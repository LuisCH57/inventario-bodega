// ==========================================================
// Rutas de REPORTES: /api/reports
// Consultas de agregación (SUM, COUNT, GROUP BY) para el dashboard.
// ==========================================================
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// La base de datos guarda las fechas en UTC (hora universal).
// Para que "hoy" sea el hoy de la bodega, convertimos a la hora de Perú.
const TIMEZONE = "America/Lima";

// ----------------------------------------------------------
// GET /api/reports/summary  →  todo lo que muestra el dashboard
// ----------------------------------------------------------
router.get("/summary", async (req, res) => {
  // Las 4 consultas son independientes: con Promise.all se envían
  // al mismo tiempo y esperamos a que terminen todas.
  const [today, daily, topProducts, inventory] = await Promise.all([
    // 1. Ventas de hoy
    pool.query(
      `SELECT
         COALESCE(SUM(total_cents), 0)::int AS "totalCents",
         COUNT(*)::int                      AS "count"
       FROM sales
       WHERE (created_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date`,
      [TIMEZONE]
    ),

    // 2. Ventas por día de los últimos 7 días.
    //    generate_series crea los 7 días aunque alguno no tenga ventas,
    //    y LEFT JOIN los une con las ventas (o con nada, si no hubo).
    pool.query(
      `SELECT
         to_char(day, 'YYYY-MM-DD')           AS "date",
         COALESCE(SUM(s.total_cents), 0)::int AS "totalCents",
         COUNT(s.id)::int                     AS "count"
       FROM generate_series(
              (now() AT TIME ZONE $1)::date - 6,
              (now() AT TIME ZONE $1)::date,
              interval '1 day'
            ) AS day
       LEFT JOIN sales s ON (s.created_at AT TIME ZONE $1)::date = day::date
       GROUP BY day
       ORDER BY day`,
      [TIMEZONE]
    ),

    // 3. Los 5 productos más vendidos de los últimos 30 días
    pool.query(
      `SELECT
         p.id,
         p.name,
         SUM(si.quantity)::int                      AS "units",
         SUM(si.quantity * si.unit_price_cents)::int AS "revenueCents"
       FROM sale_items si
       JOIN sales s    ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       WHERE s.created_at >= now() - interval '30 days'
       GROUP BY p.id, p.name
       ORDER BY "units" DESC, "revenueCents" DESC
       LIMIT 5`
    ),

    // 4. Estado del inventario. FILTER cuenta solo las filas que cumplen la condición.
    pool.query(
      `SELECT
         COUNT(*)::int                                      AS "productCount",
         COUNT(*) FILTER (WHERE stock <= min_stock)::int    AS "lowStockCount",
         COALESCE(SUM(stock * price_cents), 0)::bigint::text AS "valueCents"
       FROM products`
    ),
  ]);

  const inventoryRow = inventory.rows[0];

  res.json({
    today: today.rows[0],
    daily: daily.rows,
    topProducts: topProducts.rows,
    inventory: {
      productCount: inventoryRow.productCount,
      lowStockCount: inventoryRow.lowStockCount,
      valueCents: Number(inventoryRow.valueCents),
    },
  });
});

export default router;
