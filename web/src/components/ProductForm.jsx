import { useState } from "react";
import { api } from "../api.js";
import { solesToCents } from "../utils/format.js";
import ErrorMessage from "./ErrorMessage.jsx";

// Formulario para crear o editar un producto.
// Props:
// - product: el producto a editar, o null para crear uno nuevo
// - categories: categorías existentes (para sugerirlas)
// - onSaved: se llama cuando la API guardó el producto
// - onCancel: cerrar el formulario sin guardar
export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const isEditing = product !== null;

  // Los campos se guardan como texto, tal como los escribe el usuario
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "",
    price: product ? (product.priceCents / 100).toFixed(2) : "",
    stock: product ? String(product.stock) : "0",
    minStock: product ? String(product.minStock) : "5",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Validación rápida aquí; la API vuelve a validar todo
    const priceCents = solesToCents(form.price);
    if (priceCents === null) {
      setError({ message: "Ingresa un precio mayor que 0, por ejemplo 4.90." });
      return;
    }

    const data = {
      name: form.name.trim(),
      category: form.category.trim(),
      priceCents: priceCents,
      stock: Number(form.stock),
      minStock: Number(form.minStock),
    };

    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await api.updateProduct(product.id, data);
      } else {
        await api.createProduct(data);
      }
      onSaved();
    } catch (apiError) {
      setError(apiError); // por ejemplo: 409 "Ya existe un producto con ese nombre"
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel product-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? `Editar: ${product.name}` : "Nuevo producto"}</h2>

      <div className="form-grid">
        <div className="field field-wide">
          <label htmlFor="name">Nombre</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} maxLength={100} required />
        </div>

        <div className="field">
          <label htmlFor="category">Categoría</label>
          <input
            id="category"
            name="category"
            list="category-list"
            value={form.category}
            onChange={handleChange}
            maxLength={50}
            required
          />
          <datalist id="category-list">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label htmlFor="price">Precio (S/)</label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="0.00"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="stock">Stock</label>
          <input id="stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} required />
        </div>

        <div className="field">
          <label htmlFor="minStock">Stock mínimo</label>
          <input
            id="minStock"
            name="minStock"
            type="number"
            min="0"
            step="1"
            value={form.minStock}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="form-actions">
        <button type="submit" className="button button-inline" disabled={saving}>
          {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
