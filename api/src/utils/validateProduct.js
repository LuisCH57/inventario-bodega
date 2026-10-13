// ==========================================================
// Validación de los datos de un producto
// ==========================================================
// Nunca confíes en lo que llega desde afuera: cualquiera puede
// enviar peticiones a tu API, no solo tu propio frontend.
// Devuelve { errors, product }: si "errors" no está vacío, los datos no sirven.

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function validateProduct(body) {
  const errors = [];
  const data = body ?? {};

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const category = typeof data.category === "string" ? data.category.trim() : "";

  if (name === "" || name.length > 100) {
    errors.push("El nombre es obligatorio y debe tener como máximo 100 caracteres.");
  }
  if (category === "" || category.length > 50) {
    errors.push("La categoría es obligatoria y debe tener como máximo 50 caracteres.");
  }
  if (!Number.isInteger(data.priceCents) || data.priceCents <= 0) {
    errors.push("priceCents debe ser un número entero mayor que 0 (precio en céntimos).");
  }
  if (!isNonNegativeInteger(data.stock)) {
    errors.push("stock debe ser un número entero mayor o igual a 0.");
  }
  if (!isNonNegativeInteger(data.minStock)) {
    errors.push("minStock debe ser un número entero mayor o igual a 0.");
  }

  return {
    errors,
    product: {
      name,
      category,
      priceCents: data.priceCents,
      stock: data.stock,
      minStock: data.minStock,
    },
  };
}
