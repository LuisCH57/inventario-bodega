// ==========================================================
// Rutas de PRODUCTOS: /api/products
// Cada ruta = un método HTTP + una dirección + qué hacer.
// ==========================================================
import { Router } from "express";
import { pool } from "../db.js";
import { validateProduct } from "../utils/validateProduct.js";

const router = Router();

// Columnas que devolvemos. En SQL usamos snake_case (price_cents) y en
// JavaScript camelCase (priceCents): "AS" renombra cada columna.
const PRODUCT_COLUMNS = `
  id,
  name,
  category,
  price_cents AS "priceCents",
  stock,
  min_stock   AS "minStock",
  stock <= min_stock AS "isLowStock",
  created_at  AS "createdAt"
`;

// Códigos de error de PostgreSQL que traducimos a mensajes claros
const UNIQUE_VIOLATION = "23505"; // valor repetido en una columna UNIQUE
const FOREIGN_KEY_VIOLATION = "23503"; // registro usado por otra tabla

// Convierte el :id de la dirección en número. Devuelve null si no es válido.
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ----------------------------------------------------------
// GET /api/products  →  listar productos
// Filtros opcionales: ?search=arroz  y  ?lowStock=true
// ----------------------------------------------------------
router.get("/", async (req, res) => {
  const conditions = [];
  const values = [];

  if (req.query.search) {
    values.push(`%${req.query.search}%`);
    conditions.push(`name ILIKE $${values.length}`); // ILIKE: sin importar mayúsculas
  }
  if (req.query.lowStock === "true") {
    conditions.push("stock <= min_stock");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products ${where} ORDER BY category, name`,
    values
  );

  res.json(result.rows); // 200 OK con la lista en JSON
});

// ----------------------------------------------------------
// GET /api/products/:id  →  un producto
// ----------------------------------------------------------
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "El id debe ser un número entero positivo." });
  }

  const result = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Producto no encontrado." });
  }
  res.json(result.rows[0]);
});

// ----------------------------------------------------------
// POST /api/products  →  crear un producto
// ----------------------------------------------------------
router.post("/", async (req, res) => {
  const { errors, product } = validateProduct(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Datos no válidos.", details: errors });
  }

  try {
    // $1, $2...: consulta PARAMETRIZADA. Los valores viajan aparte del SQL,
    // así nadie puede "inyectar" código SQL escribiendo en un formulario.
    const result = await pool.query(
      `INSERT INTO products (name, category, price_cents, stock, min_stock)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PRODUCT_COLUMNS}`,
      [product.name, product.category, product.priceCents, product.stock, product.minStock]
    );
    res.status(201).json(result.rows[0]); // 201 Created
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: "Ya existe un producto con ese nombre." });
    }
    throw error; // otro error: lo maneja el manejador general (500)
  }
});

// ----------------------------------------------------------
// PUT /api/products/:id  →  actualizar un producto
// ----------------------------------------------------------
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "El id debe ser un número entero positivo." });
  }

  const { errors, product } = validateProduct(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Datos no válidos.", details: errors });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, category = $2, price_cents = $3, stock = $4, min_stock = $5
       WHERE id = $6
       RETURNING ${PRODUCT_COLUMNS}`,
      [product.name, product.category, product.priceCents, product.stock, product.minStock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: "Ya existe un producto con ese nombre." });
    }
    throw error;
  }
});

// ----------------------------------------------------------
// DELETE /api/products/:id  →  eliminar un producto
// ----------------------------------------------------------
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "El id debe ser un número entero positivo." });
  }

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    res.status(204).end(); // 204 No Content: se borró, no hay nada que devolver
  } catch (error) {
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return res.status(409).json({
        error: "No se puede eliminar: el producto aparece en ventas registradas.",
      });
    }
    throw error;
  }
});

export default router;
