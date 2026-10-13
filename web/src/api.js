// ==========================================================
// Cliente de la API: TODAS las peticiones al backend pasan por aquí.
// Así, si cambia la dirección de la API, se cambia en un solo lugar.
// ==========================================================

// En desarrollo usamos "/api" (Vite lo reenvía al puerto 3000).
// Al publicar, VITE_API_URL tendrá la dirección real del backend.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

// Error con el código HTTP y los detalles que envía la API
export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    // fetch solo falla así si no hay conexión con el servidor
    throw new ApiError("No se pudo conectar con el servidor. Revisa que la API esté encendida.", 0);
  }

  if (response.status === 204) {
    return null; // 204 No Content: no hay cuerpo que leer
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error ?? `Error ${response.status}`, response.status, data?.details ?? []);
  }
  return data;
}

// Una función por cada operación de la API
export const api = {
  getProducts: () => request("/products"),
  createProduct: (product) =>
    request("/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id, product) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  getSales: () => request("/sales?limit=50"),
  createSale: (items) => request("/sales", { method: "POST", body: JSON.stringify({ items }) }),

  getSummary: () => request("/reports/summary"),
};
