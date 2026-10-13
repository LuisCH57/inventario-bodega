// ==========================================================
// Punto de entrada de la API: crea el servidor y conecta las rutas
// ==========================================================
import express from "express";
import { pool } from "./db.js";
import productsRouter from "./routes/products.js";

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE: funciones que se ejecutan en CADA petición, antes de las rutas.
// express.json() lee el cuerpo de la petición y convierte el JSON en un objeto (req.body).
app.use(express.json());

// Registro simple: muestra en la terminal cada petición que llega
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // pasar a lo siguiente
});

// Ruta de comprobación: ¿la API está viva y conectada a la base de datos?
app.get("/api/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

// Todas las rutas de productos empiezan con /api/products
app.use("/api/products", productsRouter);

// Si ninguna ruta coincidió: 404
app.use((req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.url}` });
});

// MANEJADOR DE ERRORES: si algo falla sin control, responde 500
// sin mostrar detalles internos al cliente (pero sí en la terminal).
app.use((error, req, res, next) => {
  // JSON mal formado en el cuerpo de la petición
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
  }
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
