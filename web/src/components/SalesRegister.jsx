import { useState } from "react";
import { api } from "../api.js";
import { formatMoney } from "../utils/format.js";
import ErrorMessage from "./ErrorMessage.jsx";

// CAJA: elegir productos, armar el carrito y registrar la venta.
// Props:
// - products: catálogo actual (viene de App)
// - onSaleCompleted: avisa a App para recargar el stock
export default function SalesRegister({ products, onSaleCompleted }) {
  const [search, setSearch] = useState("");
  // Carrito: { productId: cantidad }. Ejemplo: { 1: 2, 5: 1 }
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lastSale, setLastSale] = useState(null);

  // Datos derivados: se calculan en cada dibujado
  const visibleProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const cartLines = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((p) => p.id === Number(id)), quantity }))
    .filter((line) => line.product); // por si un producto ya no existe
  const totalCents = cartLines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);

  // Cambia la cantidad de un producto en el carrito (0 = quitarlo)
  function setQuantity(product, quantity) {
    const newCart = { ...cart };
    if (quantity <= 0) {
      delete newCart[product.id];
    } else {
      newCart[product.id] = Math.min(quantity, product.stock); // nunca más que el stock
    }
    setCart(newCart);
    setLastSale(null);
  }

  async function handleRegisterSale() {
    setSubmitting(true);
    setError(null);
    try {
      const items = cartLines.map((line) => ({ productId: line.product.id, quantity: line.quantity }));
      const sale = await api.createSale(items);
      setLastSale(sale);
      setCart({});
      onSaleCompleted(); // recargar productos: el stock cambió
    } catch (apiError) {
      setError(apiError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register">
      {/* Columna izquierda: productos */}
      <section className="panel">
        <div className="panel-header">
          <h2>Productos</h2>
        </div>
        <input
          type="search"
          className="search-input"
          placeholder="Buscar producto..."
          aria-label="Buscar producto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <ul className="product-grid">
          {visibleProducts.map((product) => {
            const inCart = cart[product.id] ?? 0;
            const available = product.stock - inCart;

            return (
              <li key={product.id}>
                <button
                  type="button"
                  className="product-tile"
                  onClick={() => setQuantity(product, inCart + 1)}
                  disabled={available <= 0}
                >
                  <span className="tile-name">{product.name}</span>
                  <span className="tile-price">{formatMoney(product.priceCents)}</span>
                  <span className={product.isLowStock ? "tile-stock is-low" : "tile-stock"}>
                    {product.stock === 0 ? "Agotado" : `Stock: ${product.stock}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {visibleProducts.length === 0 && <p className="empty">No hay productos con ese nombre.</p>}
      </section>

      {/* Columna derecha: la boleta */}
      <section className="panel ticket" aria-labelledby="ticket-title">
        <h2 id="ticket-title">Venta actual</h2>

        {cartLines.length === 0 ? (
          <p className="empty">Toca un producto para agregarlo a la venta.</p>
        ) : (
          <ul className="ticket-lines">
            {cartLines.map(({ product, quantity }) => (
              <li key={product.id} className="ticket-line">
                <div className="ticket-info">
                  <span className="ticket-name">{product.name}</span>
                  <span className="ticket-unit">{formatMoney(product.priceCents)} c/u</span>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => setQuantity(product, quantity - 1)}
                    aria-label={`Quitar una unidad de ${product.name}`}
                  >
                    −
                  </button>
                  <span aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(product, quantity + 1)}
                    disabled={quantity >= product.stock}
                    aria-label={`Agregar una unidad de ${product.name}`}
                  >
                    +
                  </button>
                </div>
                <span className="ticket-subtotal">{formatMoney(product.priceCents * quantity)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="ticket-total">
          <span>Total</span>
          <strong>{formatMoney(totalCents)}</strong>
        </div>

        <ErrorMessage error={error} />
        {lastSale && (
          <div className="alert alert-success" role="status">
            Venta #{lastSale.id} registrada por {formatMoney(lastSale.totalCents)}.
          </div>
        )}

        <button
          type="button"
          className="button"
          onClick={handleRegisterSale}
          disabled={cartLines.length === 0 || submitting}
        >
          {submitting ? "Registrando..." : "Registrar venta"}
        </button>
        {cartLines.length > 0 && (
          <button type="button" className="text-button" onClick={() => setCart({})}>
            Vaciar venta
          </button>
        )}
      </section>
    </div>
  );
}
