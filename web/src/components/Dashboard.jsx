import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatMoney } from "../utils/format.js";
import ErrorMessage from "./ErrorMessage.jsx";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// "2026-10-13" -> "Mar 13"
function formatDay(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${WEEKDAYS[date.getDay()]} ${day}`;
}

// RESUMEN: indicadores, ventas por día y productos más vendidos.
export default function Dashboard({ onGoToProducts }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    api
      .getSummary()
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch((apiError) => {
        if (!ignore) setError(apiError);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return <ErrorMessage error={error} />;
  }
  if (!summary) {
    return <p className="empty">Cargando resumen...</p>;
  }

  const { today, daily, topProducts, inventory } = summary;
  const weekCents = daily.reduce((sum, day) => sum + day.totalCents, 0);
  const weekCount = daily.reduce((sum, day) => sum + day.count, 0);
  // El día con más ventas define el 100 % de altura de las barras
  const maxDayCents = Math.max(...daily.map((day) => day.totalCents), 1);
  const maxUnits = Math.max(...topProducts.map((product) => product.units), 1);

  return (
    <div className="stack">
      {/* 1. Indicadores principales */}
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Ventas de hoy</span>
          <strong className="stat-value">{formatMoney(today.totalCents)}</strong>
          <span className="muted">{today.count === 1 ? "1 venta" : `${today.count} ventas`}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Últimos 7 días</span>
          <strong className="stat-value">{formatMoney(weekCents)}</strong>
          <span className="muted">{weekCount === 1 ? "1 venta" : `${weekCount} ventas`}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Valor del inventario</span>
          <strong className="stat-value">{formatMoney(inventory.valueCents)}</strong>
          <span className="muted">{inventory.productCount} productos, a precio de venta</span>
        </div>
        <button
          type="button"
          className={inventory.lowStockCount > 0 ? "stat stat-button is-alert" : "stat stat-button"}
          onClick={onGoToProducts}
        >
          <span className="stat-label">Por reponer</span>
          <strong className="stat-value">{inventory.lowStockCount}</strong>
          <span className="muted">Ver productos</span>
        </button>
      </div>

      <div className="dashboard-grid">
        {/* 2. Gráfico de barras: ventas por día */}
        <section className="panel" aria-labelledby="daily-title">
          <div className="panel-header">
            <h2 id="daily-title">Ventas por día</h2>
            <span className="muted">Últimos 7 días</span>
          </div>

          <div className="bar-chart" role="list">
            {daily.map((day) => {
              // Altura proporcional al día con más ventas
              const height = (day.totalCents / maxDayCents) * 100;
              const label = `${formatDay(day.date)}: ${formatMoney(day.totalCents)}, ${day.count} ventas`;

              return (
                <div key={day.date} className="bar-column" role="listitem" tabIndex={0} aria-label={label}>
                  <div className="bar-track">
                    {day.totalCents > 0 && <div className="bar" style={{ height: `${height}%` }} />}
                    {/* Tooltip: aparece al pasar el mouse o con el teclado */}
                    <span className="bar-tooltip" aria-hidden="true">
                      <strong>{formatMoney(day.totalCents)}</strong>
                      <span>{day.count === 1 ? "1 venta" : `${day.count} ventas`}</span>
                    </span>
                  </div>
                  <span className="bar-label">{formatDay(day.date)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Productos más vendidos */}
        <section className="panel" aria-labelledby="top-title">
          <div className="panel-header">
            <h2 id="top-title">Más vendidos</h2>
            <span className="muted">Últimos 30 días</span>
          </div>

          {topProducts.length === 0 ? (
            <p className="empty">Todavía no hay ventas en este periodo.</p>
          ) : (
            <ol className="top-list">
              {topProducts.map((product) => (
                <li key={product.id} className="top-item">
                  <div className="top-text">
                    <span className="cell-strong">{product.name}</span>
                    <span className="muted">
                      {product.units} u., {formatMoney(product.revenueCents)}
                    </span>
                  </div>
                  <div className="top-track" aria-hidden="true">
                    <div className="top-bar" style={{ width: `${(product.units / maxUnits) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
