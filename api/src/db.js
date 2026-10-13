// ==========================================================
// Conexión a la base de datos PostgreSQL (Neon)
// ==========================================================
import pg from "pg";

// La cadena de conexión NO se escribe en el código: viene de una
// "variable de entorno" (el archivo .env en tu computadora, o la
// configuración del servidor cuando la publiquemos).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Falta la variable DATABASE_URL. Revisa tu archivo .env");
  process.exit(1); // detener el programa: sin base de datos no puede funcionar
}

// Un "pool" mantiene varias conexiones abiertas y las reutiliza,
// en lugar de abrir una conexión nueva en cada petición (que es lento).
export const pool = new pg.Pool({ connectionString });
