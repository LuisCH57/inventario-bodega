// ==========================================================
// Validación de una venta
// Formato esperado:
// { "items": [ { "productId": 1, "quantity": 2 }, ... ] }
// ==========================================================

const MAX_ITEMS = 50;
const MAX_QUANTITY = 1000;

export function validateSale(body) {
  const errors = [];
  const items = body?.items;

  if (!Array.isArray(items) || items.length === 0) {
    return { errors: ["La venta debe incluir al menos un producto en 'items'."], items: [] };
  }
  if (items.length > MAX_ITEMS) {
    return { errors: [`Una venta puede tener como máximo ${MAX_ITEMS} productos.`], items: [] };
  }

  // Juntar cantidades si el mismo producto aparece dos veces.
  // Un Map guarda pares clave -> valor: productId -> cantidad total.
  const quantities = new Map();

  items.forEach((item, index) => {
    const position = index + 1;
    if (!Number.isInteger(item?.productId) || item.productId <= 0) {
      errors.push(`Producto ${position}: productId debe ser un número entero positivo.`);
      return;
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_QUANTITY) {
      errors.push(`Producto ${position}: quantity debe ser un entero entre 1 y ${MAX_QUANTITY}.`);
      return;
    }
    const previous = quantities.get(item.productId) ?? 0;
    quantities.set(item.productId, previous + item.quantity);
  });

  // Convertir el Map en una lista: [{ productId, quantity }, ...]
  const merged = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
  return { errors, items: merged };
}
