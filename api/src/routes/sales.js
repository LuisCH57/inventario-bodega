// ==========================================================
// Rutas de VENTAS: /api/sales
// ==========================================================
import { Router } from "express";
import { pool } from "../db.js";
import { validateSale } from "../utils/validateSale.js";

const router = Router();

// Error con código HTTP: lo lanzamos dentro de la transacción para
// cancelarla y responder con un mensaje claro.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Consulta reutilizable: ventas con su detalle y el nombre de cada producto.
// JOIN une tablas relacionadas; json_agg junta las filas del detalle en una lista.
const SALES_QUERY = `
  SELECT
    s.id,
    s.total_cents AS "totalCents",
    s.created_at  AS "createdAt",
    json_agg(
      json_build_object(
        'productId',      p.id,
        'name',           p.name,
        'quantity',       si.quantity,
        'unitPriceCents', si.unit_price_cents
      ) ORDER BY si.id
    ) AS items
  FROM sales s
  JOIN sale_items si ON si.sale_id = s.id
  JOIN products   p  ON p.id = si.product_id
`;

// ----------------------------------------------------------
// GET /api/sales  →  últimas ventas (?limit=20 por defecto, máximo 100)
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const result = await pool.query(
    `${SALES_QUERY}
     GROUP BY s.id
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT $1`,
    [limit]
  );
  res.json(result.rows);
});

// ----------------------------------------------------------
// GET /api/sales/:id  →  una venta con su detalle
// ----------------------------------------------------------
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "El id debe ser un número entero positivo." });
  }

  const result = await pool.query(`${SALES_QUERY} WHERE s.id = $1 GROUP BY s.id`, [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Venta no encontrada." });
  }
  res.json(result.rows[0]);
});

// ----------------------------------------------------------
// createSale: guarda una venta usando una TRANSACCIÓN.
// Todos los pasos se guardan juntos o ninguno: si algo falla a la mitad
// (por ejemplo, falta stock del tercer producto), se deshace todo y la
// base de datos queda exactamente como estaba.
// Devuelve el id de la venta creada.
// ----------------------------------------------------------
async function createSale(items) {
  // Para una transacción necesitamos UNA conexión fija del pool
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // inicio de la transacción

    // 1. Leer los productos y BLOQUEARLOS (FOR UPDATE): si dos cajas venden
    //    el mismo producto al mismo tiempo, la segunda espera a la primera.
    //    Así nunca se vende más stock del que existe.
    const ids = items.map((item) => item.productId);
    const productsResult = await client.query(
      `SELECT id, name, price_cents, stock
       FROM products
       WHERE id = ANY($1)
       FOR UPDATE`,
      [ids]
    );
    const productsById = new Map(productsResult.rows.map((product) => [product.id, product]));

    // 2. Verificar que existan y que haya stock suficiente
    const missing = ids.filter((id) => !productsById.has(id));
    if (missing.length > 0) {
      throw new HttpError(404, `No existen productos con id: ${missing.join(", ")}.`);
    }

    const shortages = [];
    for (const item of items) {
      const product = productsById.get(item.productId);
      if (product.stock < item.quantity) {
        shortages.push(`${product.name}: pediste ${item.quantity}, hay ${product.stock}.`);
      }
    }
    if (shortages.length > 0) {
      throw new HttpError(409, "Stock insuficiente.", shortages);
    }

    // 3. Calcular el total con los precios de la BASE DE DATOS
    //    (nunca con precios enviados por el cliente: podrían estar alterados)
    let totalCents = 0;
    for (const item of items) {
      totalCents += productsById.get(item.productId).price_cents * item.quantity;
    }

    // 4. Guardar la venta, su detalle y descontar el stock
    const saleResult = await client.query(
      "INSERT INTO sales (total_cents) VALUES ($1) RETURNING id",
      [totalCents]
    );
    const saleId = saleResult.rows[0].id;

    for (const item of items) {
      const product = productsById.get(item.productId);
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4)`,
        [saleId, item.productId, item.quantity, product.price_cents]
      );
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [
        item.quantity,
        item.productId,
      ]);
    }

    await client.query("COMMIT"); // confirmar: todo se guarda junto
    return saleId;
  } catch (error) {
    await client.query("ROLLBACK"); // cancelar: deshacer todo lo de esta transacción
    throw error; // y avisar del error a quien llamó a createSale
  } finally {
    client.release(); // devolver la conexión al pool, pase lo que pase
  }
}

// ----------------------------------------------------------
// POST /api/sales  →  registrar una venta
// ----------------------------------------------------------
router.post("/", async (req, res) => {
  const { errors, items } = validateSale(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Datos no válidos.", details: errors });
  }

  try {
    const saleId = await createSale(items);

    // Responder con la venta completa (con nombres de productos)
    const sale = await pool.query(`${SALES_QUERY} WHERE s.id = $1 GROUP BY s.id`, [saleId]);
    res.status(201).json(sale.rows[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message, details: error.details });
    }
    throw error; // error inesperado: lo maneja el manejador general (500)
  }
});

export default router;
