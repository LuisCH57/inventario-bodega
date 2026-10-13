import { useEffect, useState } from "react";
import { api } from "./api.js";
import SalesRegister from "./components/SalesRegister.jsx";
import ProductsView from "./components/ProductsView.jsx";
import SalesHistory from "./components/SalesHistory.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";
import "./App.css";

// Pestañas de la aplicación
const VIEWS = [
  { id: "dashboard", label: "Resumen" },
  { id: "register", label: "Caja" },
  { id: "products", label: "Productos" },
  { id: "sales", label: "Ventas" },
];

export default function App() {
  const [view, setView] = useState("dashboard");

  // Los productos se comparten entre "Caja" y "Productos", por eso viven aquí
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [error, setError] = useState(null);

  // Cargar los productos una vez, al abrir la aplicación.
  // setState solo se llama cuando llega la respuesta (dentro de .then).
  useEffect(() => {
    let ignore = false; // evita guardar datos si el componente ya desapareció

    api
      .getProducts()
      .then((data) => {
        if (!ignore) {
          setProducts(data);
          setStatus("ready");
        }
      })
      .catch((apiError) => {
        if (!ignore) {
          setError(apiError);
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Recargar los productos después de una venta o un cambio en el catálogo
  async function loadProducts() {
    try {
      const data = await api.getProducts();
      setProducts(data);
      setStatus("ready");
    } catch (apiError) {
      setError(apiError);
      setStatus("error");
    }
  }

  const lowStockCount = products.filter((product) => product.isLowStock).length;

  return (
    <>
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <h1>Bodega</h1>
            <span className="muted">Inventario y ventas</span>
          </div>

          <nav aria-label="Secciones">
            <ul className="tabs">
              {VIEWS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={view === item.id ? "tab is-active" : "tab"}
                    aria-current={view === item.id ? "page" : undefined}
                    onClick={() => setView(item.id)}
                  >
                    {item.label}
                    {item.id === "products" && lowStockCount > 0 && (
                      <span className="tab-badge" title="Productos por reponer">
                        {lowStockCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container main">
        {status === "loading" && <p className="empty">Cargando productos...</p>}

        {status === "error" && (
          <div className="stack">
            <ErrorMessage error={error} />
            <button type="button" className="button-secondary" onClick={loadProducts}>
              Reintentar
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            {view === "dashboard" && <Dashboard onGoToProducts={() => setView("products")} />}
            {view === "register" && <SalesRegister products={products} onSaleCompleted={loadProducts} />}
            {view === "products" && <ProductsView products={products} onChanged={loadProducts} />}
            {view === "sales" && <SalesHistory />}
          </>
        )}
      </main>

      <footer className="container app-footer">
        <p>
          Proyecto 4 de mi <a href="https://luisch57.github.io">ruta de proyectos</a>. React, Node.js, Express y
          PostgreSQL.
        </p>
      </footer>
    </>
  );
}
