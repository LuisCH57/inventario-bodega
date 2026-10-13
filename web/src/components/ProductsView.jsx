import { useState } from "react";
import { api } from "../api.js";
import { formatMoney } from "../utils/format.js";
import ProductForm from "./ProductForm.jsx";
import ErrorMessage from "./ErrorMessage.jsx";

// PRODUCTOS: catálogo con búsqueda, alertas de stock y formulario.
// Props:
// - products: catálogo actual (viene de App)
// - onChanged: avisa a App para recargar después de crear, editar o eliminar
export default function ProductsView({ products, onChanged }) {
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  // null = formulario cerrado; "new" = crear; un producto = editarlo
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const categories = [...new Set(products.map((product) => product.category))].sort();
  const lowStock = products.filter((product) => product.isLowStock);

  const visibleProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (!onlyLowStock || product.isLowStock);
  });

  async function handleDelete(product) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) {
      return;
    }
    setError(null);
    try {
      await api.deleteProduct(product.id);
      onChanged();
    } catch (apiError) {
      setError(apiError); // por ejemplo: 409 si el producto ya tiene ventas
    }
  }

  function handleSaved() {
    setEditing(null);
    onChanged();
  }

  return (
    <div className="stack">
      {/* Alerta de reposición */}
      {lowStock.length > 0 && (
        <div className="alert alert-warning">
          <strong>
            {lowStock.length === 1 ? "1 producto por reponer:" : `${lowStock.length} productos por reponer:`}
          </strong>{" "}
          {lowStock.map((product) => `${product.name} (${product.stock})`).join(", ")}.
        </div>
      )}

      {editing !== null && (
        <ProductForm
          // "key" hace que el formulario se reinicie al cambiar de producto
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={categories}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      <section className="panel">
        <div className="toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(event) => setOnlyLowStock(event.target.checked)}
            />
            Solo por reponer
          </label>
          <button type="button" className="button button-inline" onClick={() => setEditing("new")}>
            Nuevo producto
          </button>
        </div>

        <ErrorMessage error={error} />

        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col" className="numeric">Precio</th>
                <th scope="col" className="numeric">Stock</th>
                <th scope="col">
                  <span className="visually-hidden">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td className="cell-strong">{product.name}</td>
                  <td>{product.category}</td>
                  <td className="numeric">{formatMoney(product.priceCents)}</td>
                  <td className="numeric">
                    <span className={product.isLowStock ? "stock-badge is-low" : "stock-badge"}>
                      {product.stock}
                    </span>
                    <span className="stock-min">mín. {product.minStock}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button type="button" className="small-button" onClick={() => setEditing(product)}>
                        Editar
                      </button>
                      <button type="button" className="small-button danger" onClick={() => handleDelete(product)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleProducts.length === 0 && <p className="empty">No hay productos que coincidan.</p>}
      </section>
    </div>
  );
}
