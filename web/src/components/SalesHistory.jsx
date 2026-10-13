import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDateTime, formatMoney } from "../utils/format.js";
import ErrorMessage from "./ErrorMessage.jsx";

// VENTAS: historial de las últimas ventas con su detalle.
// Este componente pide sus propios datos al aparecer en pantalla.
export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [error, setError] = useState(null);

  // useEffect con [] se ejecuta UNA vez, cuando el componente aparece
  useEffect(() => {
    let ignore = false; // si el usuario cambia de pestaña antes de que llegue la respuesta

    api
      .getSales()
      .then((data) => {
        if (!ignore) {
          setSales(data);
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
      ignore = true; // "limpieza": se ejecuta cuando el componente desaparece
    };
  }, []);

  if (status === "loading") {
    return <p className="empty">Cargando ventas...</p>;
  }
  if (status === "error") {
    return <ErrorMessage error={error} />;
  }

  const totalCents = sales.reduce((sum, sale) => sum + sale.totalCents, 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Últimas ventas</h2>
        <span className="muted">
          {sales.length} ventas, {formatMoney(totalCents)} en total
        </span>
      </div>

      {sales.length === 0 ? (
        <p className="empty">Todavía no hay ventas. Registra la primera desde la caja.</p>
      ) : (
        <ul className="sales-list">
          {sales.map((sale) => (
            <li key={sale.id} className="sale-item">
              <div className="sale-header">
                <span className="cell-strong">Venta #{sale.id}</span>
                <span className="muted">{formatDateTime(sale.createdAt)}</span>
                <strong className="sale-total">{formatMoney(sale.totalCents)}</strong>
              </div>
              <ul className="sale-lines">
                {sale.items.map((item) => (
                  <li key={item.productId}>
                    {item.quantity} × {item.name}{" "}
                    <span className="muted">({formatMoney(item.unitPriceCents)} c/u)</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
