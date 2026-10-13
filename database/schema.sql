-- ==========================================================
-- Base de datos: Sistema de inventario y ventas para bodegas
-- Ejecuta este archivo completo en el SQL Editor de Neon.
-- ==========================================================

-- Por si lo ejecutas más de una vez: borra las tablas anteriores.
-- (El orden importa: primero las que dependen de otras.)
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS products;

-- ----------------------------------------------------------
-- 1. PRODUCTOS: lo que vende la bodega
-- ----------------------------------------------------------
CREATE TABLE products (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- número automático
  name        VARCHAR(100) NOT NULL UNIQUE,                     -- no puede repetirse
  category    VARCHAR(50)  NOT NULL,
  price_cents INTEGER      NOT NULL CHECK (price_cents > 0),    -- en céntimos, como en el Proyecto 2
  stock       INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock   INTEGER      NOT NULL DEFAULT 5 CHECK (min_stock >= 0), -- avisar si baja de aquí
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 2. VENTAS: cada venta (una "boleta")
-- ----------------------------------------------------------
CREATE TABLE sales (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  total_cents INTEGER     NOT NULL CHECK (total_cents >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------
-- 3. DETALLE DE VENTA: qué productos y cuántos en cada venta
--    (una venta tiene muchos productos: relación uno a muchos)
-- ----------------------------------------------------------
CREATE TABLE sale_items (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id          INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id       INTEGER NOT NULL REFERENCES products(id),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0) -- precio al momento de la venta
);

-- ----------------------------------------------------------
-- 4. DATOS DE EJEMPLO
-- ----------------------------------------------------------
INSERT INTO products (name, category, price_cents, stock, min_stock) VALUES
  ('Inca Kola 500 ml',            'Bebidas',    250, 24, 6),
  ('Agua San Luis 625 ml',        'Bebidas',    150, 30, 10),
  ('Leche Gloria lata 400 g',     'Lácteos',    420, 18, 6),
  ('Yogurt Laive 1 L',            'Lácteos',    750,  3, 4),
  ('Arroz Costeño 1 kg',          'Abarrotes',  490, 15, 5),
  ('Azúcar rubia 1 kg',           'Abarrotes',  380, 12, 5),
  ('Aceite Primor 1 L',           'Abarrotes', 1050,  2, 4),
  ('Fideos spaghetti 500 g',      'Abarrotes',  320, 20, 6),
  ('Atún en trozos 170 g',        'Conservas',  650,  9, 4),
  ('Galletas de soda (paquete)',  'Snacks',      80, 40, 12),
  ('Papel higiénico x4',          'Limpieza',   690,  7, 3),
  ('Detergente 500 g',            'Limpieza',   590,  0, 3);
