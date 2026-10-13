# Sistema de inventario y ventas para bodegas

Sistema web full stack para que una bodega controle su stock, registre ventas desde una caja y sepa qué productos debe reponer.

**Demo:** https://luisch57.github.io/inventario-bodega/
_La API usa un plan gratuito que se apaga sin uso: la primera carga puede tardar hasta un minuto._

## Funcionalidades

- **Resumen:** ventas de hoy y de la semana, valor del inventario, gráfico de ventas por día y productos más vendidos.
- **Caja:** armar una venta tocando productos, ajustar cantidades y registrarla. Impide vender más unidades de las que hay en stock.
- **Productos:** catálogo con búsqueda, alertas de reposición (stock bajo el mínimo) y formulario para crear, editar y eliminar.
- **Ventas:** historial con el detalle de cada venta.

## Arquitectura

```
 Navegador                    Servidor                      Base de datos
┌──────────────┐   HTTP    ┌──────────────────┐   SQL    ┌──────────────┐
│ React + Vite │ ────────► │ Node.js+Express  │ ───────► │  PostgreSQL  │
│ GitHub Pages │ ◄──JSON── │ API REST, Render │ ◄─────── │    (Neon)    │
└──────────────┘           └──────────────────┘          └──────────────┘
```

| Carpeta | Contenido |
|---|---|
| `web/` | Frontend en React (pestañas, caja, catálogo, dashboard) |
| `api/` | API REST en Express: productos, ventas y reportes |
| `database/` | Esquema SQL con datos de ejemplo |

### Modelo de datos

- `products`: nombre, categoría, precio, stock y stock mínimo.
- `sales`: cada venta con su total.
- `sale_items`: el detalle de cada venta (relación uno a muchos), con el precio **al momento de la venta**.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products?search=&lowStock=true` | Listar productos con filtros |
| GET | `/api/products/:id` | Ver un producto |
| POST | `/api/products` | Crear un producto |
| PUT | `/api/products/:id` | Actualizar un producto |
| DELETE | `/api/products/:id` | Eliminar (409 si tiene ventas) |
| GET | `/api/sales` | Últimas ventas con su detalle |
| POST | `/api/sales` | Registrar una venta |
| GET | `/api/reports/summary` | Indicadores del dashboard |

## Decisiones técnicas

- **Transacciones para las ventas:** crear la venta, su detalle y descontar el stock ocurre dentro de `BEGIN ... COMMIT`; si algo falla, `ROLLBACK` deja la base de datos como estaba.
- **`SELECT ... FOR UPDATE`:** bloquea los productos durante la venta para evitar condiciones de carrera (dos cajas vendiendo el último producto).
- **El total se calcula en el servidor** con los precios de la base de datos, nunca con precios enviados por el cliente.
- **Consultas parametrizadas** (`$1, $2`) para prevenir inyección SQL.
- **Validación en tres capas:** formulario (experiencia de usuario), API y restricciones de la base de datos (`CHECK`, `UNIQUE`, claves foráneas).
- **Dinero en céntimos** (enteros) para evitar errores de redondeo.
- **Zona horaria:** los reportes convierten las fechas de UTC a `America/Lima` para que "hoy" sea el día real de la bodega.
- **CORS** configurado con una lista de orígenes permitidos mediante variable de entorno.

## Limitaciones y mejoras futuras

- No tiene usuarios ni inicio de sesión: la demo es pública. El siguiente proyecto de mi ruta agrega autenticación y roles.
- Agregar pruebas automáticas de la API.
- Registrar compras a proveedores para reponer stock con historial.

## Cómo ejecutarlo en tu computadora

1. Crea una base de datos PostgreSQL (por ejemplo, gratis en [Neon](https://neon.com)) y ejecuta `database/schema.sql`.
2. API:
   ```bash
   cd api
   cp .env.example .env   # y completa DATABASE_URL
   npm install
   npm run dev
   ```
3. Frontend, en otra terminal:
   ```bash
   cd web
   npm install
   npm run dev
   ```
4. Abre `http://localhost:5173`.
