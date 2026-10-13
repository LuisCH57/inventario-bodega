// Formatos para mostrar datos en pantalla

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

// 1050 -> "S/ 10.50"
export function formatMoney(cents) {
  return moneyFormatter.format(cents / 100);
}

// "2026-10-13T16:23:30Z" -> "13/10/2026, 11:23" (hora de Perú)
export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "4.90" -> 490. Devuelve null si el texto no es un precio válido.
export function solesToCents(text) {
  const value = Number(String(text).replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value * 100);
}
