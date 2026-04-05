-- ============================================================================
-- SCHEMA - SISTEMA B2B E-COMMERCE (SEDERÍA)
-- Base de datos: Supabase (PostgreSQL)
-- Normalización: 3FN
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda por similitud de texto

-- ============================================================================
-- 2. TIPOS ENUM
-- ============================================================================
CREATE TYPE user_role      AS ENUM ('minorista', 'mayorista', 'admin');
CREATE TYPE user_status    AS ENUM ('active', 'inactive', 'pending_approval', 'rejected');

CREATE TYPE product_availability AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'pre_order', 'discontinued');

CREATE TYPE document_type   AS ENUM ('aviso_operaciones', 'ruc', 'dv', 'licencia_comercial', 'otros');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE quote_status    AS ENUM ('pending', 'reviewed', 'approved', 'rejected', 'cancelled');

-- Ciclo de vida de una orden: pending_payment → paid → processing → shipped → delivered
-- Rutas de salida: cancelled | refunded
-- payment_review: transferencia bancaria esperando validación manual del admin
CREATE TYPE order_status    AS ENUM ('pending_payment', 'payment_review', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Estado interno del registro de pago
CREATE TYPE payment_status  AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');

-- Métodos de pago disponibles en Panamá
CREATE TYPE payment_method  AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'yappy', 'cash', 'other');

-- ============================================================================
-- 3. FUNCIÓN PARA GENERAR SLUGS
-- Convierte "Tela de Algodón" → "tela-de-algodon"
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    result := lower(input_text);
    result := translate(result,
        'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOOUUUUNC');
    result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
    result := trim(both '-' from result);
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 4. TABLAS PRINCIPALES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- users
-- auth_id → UUID de Supabase Auth (auth.users.id)
-- id      → UUID interno usado como FK en el resto del negocio
-- RLS: USING (auth_id = auth.uid()) o EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid())
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id  UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email    VARCHAR(255) UNIQUE NOT NULL,
    name     VARCHAR(255) NOT NULL,
    phone    VARCHAR(50),
    role     user_role   NOT NULL DEFAULT 'minorista',
    status   user_status NOT NULL DEFAULT 'pending_approval',

    -- Campos exclusivos de mayoristas
    company_name    VARCHAR(255),
    company_ruc     VARCHAR(50),
    company_address TEXT,
    city            VARCHAR(100),
    province        VARCHAR(100),

    show_prices BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT mayorista_requires_company CHECK (
        role != 'mayorista' OR (company_name IS NOT NULL AND company_ruc IS NOT NULL)
    )
);

-- ---------------------------------------------------------------------------
-- user_documents — documentos legales de mayoristas (RUC, licencia, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE user_documents (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type document_type   NOT NULL,
    document_url  TEXT            NOT NULL,
    document_name VARCHAR(255)    NOT NULL,
    file_size     INTEGER,
    mime_type     VARCHAR(100),
    status        document_status NOT NULL DEFAULT 'pending',
    reviewed_by   UUID REFERENCES users(id),
    reviewed_at   TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    uploaded_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- categories — categorías de productos (pueden ser jerárquicas)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name               VARCHAR(100) UNIQUE NOT NULL,
    slug               VARCHAR(100) UNIQUE NOT NULL,
    description        TEXT,
    icon               VARCHAR(50),
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    display_order      INTEGER DEFAULT 0,
    is_active          BOOLEAN DEFAULT true,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- products — catálogo base de productos
-- stock_quantity y product_availability se sincronizan via trigger
-- ---------------------------------------------------------------------------
CREATE TABLE products (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cod_ref              VARCHAR(50) UNIQUE NOT NULL,   -- código interno (ej: TEL-001)
    slug                 VARCHAR(255) UNIQUE NOT NULL,  -- URL amigable (ej: tela-algodon-blanca)
    name                 VARCHAR(255) NOT NULL,
    description          TEXT,
    category_id          UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    base_price           DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    unit                 VARCHAR(50) NOT NULL,           -- metro, unidad, rollo, pack, etc.
    product_availability product_availability NOT NULL DEFAULT 'in_stock',
    stock_quantity       INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_alert      INTEGER NOT NULL DEFAULT 10,
    weight               DECIMAL(10,2),
    dimensions           VARCHAR(100),
    is_featured          BOOLEAN DEFAULT false,
    is_active            BOOLEAN DEFAULT true,
    created_by           UUID REFERENCES users(id),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- product_variants — variantes (color, talla, etc.)
-- additional_price se suma al base_price del producto padre
-- ---------------------------------------------------------------------------
CREATE TABLE product_variants (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cod_ref_variant  VARCHAR(100) UNIQUE NOT NULL,
    variant_name     VARCHAR(255) NOT NULL,         -- ej: "Rojo - M"
    color            VARCHAR(50),
    size             VARCHAR(50),
    additional_price DECIMAL(10,2) DEFAULT 0 CHECK (additional_price >= 0),
    stock_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 5,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_product_variant UNIQUE (product_id, color, size)
);

-- ---------------------------------------------------------------------------
-- product_images — imágenes de productos y variantes
-- ---------------------------------------------------------------------------
CREATE TABLE product_images (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id    UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    alt_text      VARCHAR(255),
    is_primary    BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    uploaded_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- product_offers — descuentos temporales sobre productos
-- ---------------------------------------------------------------------------
CREATE TABLE product_offers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id          UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    discount_percentage DECIMAL(5,2) CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    discount_amount     DECIMAL(10,2) CHECK (discount_amount > 0),
    start_date          TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date            TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT discount_type_exclusive CHECK (
        (discount_percentage IS NOT NULL AND discount_amount IS NULL) OR
        (discount_percentage IS NULL AND discount_amount IS NOT NULL)
    )
);

-- ---------------------------------------------------------------------------
-- price_visibility_settings — configura si cada rol ve precios
-- updated_by es nullable para poder hacer el seed inicial sin admin
-- ---------------------------------------------------------------------------
CREATE TABLE price_visibility_settings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role        user_role NOT NULL UNIQUE,
    show_prices BOOLEAN NOT NULL DEFAULT false,
    updated_by  UUID REFERENCES users(id),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- quotes — cotizaciones solicitadas por clientes
-- ---------------------------------------------------------------------------
CREATE TABLE quotes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number    VARCHAR(50) UNIQUE NOT NULL,
    customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          quote_status NOT NULL DEFAULT 'pending',
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    customer_notes  TEXT,
    admin_response  TEXT,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMP WITH TIME ZONE,
    expires_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- quote_items — líneas de una cotización
-- subtotal se calcula automáticamente via trigger
-- ---------------------------------------------------------------------------
CREATE TABLE quote_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id   UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal   DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    notes      TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- shopping_carts — un carrito por usuario (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE shopping_carts (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_cart_per_user UNIQUE (user_id)
);

-- ---------------------------------------------------------------------------
-- cart_items — productos en el carrito
-- ---------------------------------------------------------------------------
CREATE TABLE cart_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id    UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    added_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_product_in_cart UNIQUE (cart_id, product_id, variant_id)
);

-- ---------------------------------------------------------------------------
-- orders — órdenes generadas a partir de cotizaciones aprobadas
--
-- Ciclo de vida:
--   1. Cotización aprobada → admin crea la orden (pending_payment)
--   2. Cliente paga → se registra en payments
--      - Tarjeta/Yappy: automático → paid
--      - Transferencia: admin valida → payment_review → paid
--   3. Admin prepara la orden → processing
--   4. Se envía → shipped (con tracking)
--   5. Entregado → delivered
--   Puede cancelarse o reembolsarse en cualquier punto antes de shipped
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number    VARCHAR(50) UNIQUE NOT NULL,          -- ORD-2024-0001
    quote_id        UUID REFERENCES quotes(id),           -- nullable: órdenes sin cotización previa
    customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          order_status NOT NULL DEFAULT 'pending_payment',

    -- Snapshot de montos al momento de crear la orden
    subtotal        DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount    DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),

    -- Snapshot de dirección de envío (no usar la dirección actual del usuario)
    shipping_name     VARCHAR(255),
    shipping_address  TEXT,
    shipping_city     VARCHAR(100),
    shipping_province VARCHAR(100),
    shipping_phone    VARCHAR(50),

    -- Información de envío
    tracking_number   VARCHAR(100),
    shipping_carrier  VARCHAR(100),
    estimated_delivery DATE,

    customer_notes  TEXT,
    admin_notes     TEXT,

    -- Timestamps del ciclo de vida
    paid_at        TIMESTAMP WITH TIME ZONE,
    shipped_at     TIMESTAMP WITH TIME ZONE,
    delivered_at   TIMESTAMP WITH TIME ZONE,
    cancelled_at   TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- order_items — líneas de una orden (copiadas de quote_items al crear la orden)
-- Se guardan como snapshot: si el precio del producto cambia, la orden no cambia
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id   UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,      -- snapshot del nombre al momento de compra
    variant_name VARCHAR(255),               -- snapshot de la variante
    cod_ref      VARCHAR(50),                -- snapshot del código
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal     DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- payments — registro de pagos asociados a órdenes
--
-- Conexión con procesadores:
--   Stripe    → processor='stripe', processor_transaction_id='pi_xxx', processor_response=JSON
--   Yappy     → processor='yappy',  processor_transaction_id='YPY-xxx', processor_response=JSON
--   PayU      → processor='payu',   processor_transaction_id='xxx',     processor_response=JSON
--   Transferencia → processor='manual', bank_reference, receipt_url, admin valida manualmente
--   Efectivo  → processor='manual', admin registra manualmente
--
-- Para integrar un procesador nuevo: solo agregar el nombre en processor y
-- guardar su respuesta en processor_response (JSONB es flexible)
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency    VARCHAR(3) NOT NULL DEFAULT 'USD',   -- Panamá usa USD
    method      payment_method NOT NULL,
    status      payment_status NOT NULL DEFAULT 'pending',

    -- Datos del procesador externo (Stripe, Yappy, PayU, etc.)
    processor                VARCHAR(50),             -- 'stripe' | 'yappy' | 'payu' | 'manual'
    processor_transaction_id VARCHAR(255),            -- ID que retorna el procesador
    processor_response       JSONB,                   -- respuesta completa del procesador

    -- Solo para transferencias bancarias (validación manual)
    bank_name       VARCHAR(100),
    bank_reference  VARCHAR(100),
    transfer_date   DATE,
    receipt_url     TEXT,                             -- URL del comprobante subido

    -- Solo para tarjetas (para mostrar en UI, nunca guardar número completo)
    card_last_four  VARCHAR(4),
    card_brand      VARCHAR(20),                      -- 'visa' | 'mastercard' | 'amex'

    -- Timestamps
    paid_at         TIMESTAMP WITH TIME ZONE,
    failed_at       TIMESTAMP WITH TIME ZONE,
    refunded_at     TIMESTAMP WITH TIME ZONE,
    refund_reason   TEXT,
    failure_reason  TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- email_notifications — log de correos enviados
-- ---------------------------------------------------------------------------
CREATE TABLE email_notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    quote_id        UUID REFERENCES quotes(id) ON DELETE SET NULL,
    order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject         VARCHAR(500) NOT NULL,
    body            TEXT NOT NULL,
    status          VARCHAR(50) DEFAULT 'sent',
    error_message   TEXT,
    sent_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- audit_log — trazabilidad de cambios
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id  UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ÍNDICES
-- ============================================================================

-- users
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_status  ON users(status);

-- categories
CREATE INDEX idx_categories_slug   ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- products
CREATE INDEX idx_products_cod_ref      ON products(cod_ref);
CREATE INDEX idx_products_slug         ON products(slug);
CREATE INDEX idx_products_category     ON products(category_id);
CREATE INDEX idx_products_availability ON products(product_availability);
CREATE INDEX idx_products_featured     ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_active       ON products(is_active)   WHERE is_active = true;
CREATE INDEX idx_products_name_trgm    ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- product_variants
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_cod_ref ON product_variants(cod_ref_variant);

-- product_images
CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- product_offers
CREATE INDEX idx_offers_product ON product_offers(product_id);
CREATE INDEX idx_offers_active  ON product_offers(is_active, start_date, end_date);

-- user_documents
CREATE INDEX idx_documents_user   ON user_documents(user_id);
CREATE INDEX idx_documents_status ON user_documents(status);

-- quotes
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status   ON quotes(status);
CREATE INDEX idx_quotes_number   ON quotes(quote_number);
CREATE INDEX idx_quotes_created  ON quotes(created_at DESC);

-- quote_items
CREATE INDEX idx_quote_items_quote   ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_id);

-- shopping_carts / cart_items
CREATE INDEX idx_carts_user       ON shopping_carts(user_id);
CREATE INDEX idx_cart_items_cart  ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_number   ON orders(order_number);
CREATE INDEX idx_orders_quote    ON orders(quote_id);
CREATE INDEX idx_orders_created  ON orders(created_at DESC);

-- order_items
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- payments
CREATE INDEX idx_payments_order    ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status   ON payments(status);
CREATE INDEX idx_payments_processor_id ON payments(processor_transaction_id);

-- email_notifications
CREATE INDEX idx_notifications_user  ON email_notifications(user_id);
CREATE INDEX idx_notifications_order ON email_notifications(order_id);

-- audit_log
CREATE INDEX idx_audit_table   ON audit_log(table_name);
CREATE INDEX idx_audit_user    ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================================================
-- 6. FUNCIONES Y TRIGGERS
-- ============================================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at      BEFORE UPDATE ON categories      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at        BEFORE UPDATE ON products        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_quotes_updated_at          BEFORE UPDATE ON quotes          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at          BEFORE UPDATE ON orders          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at        BEFORE UPDATE ON payments        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_shopping_carts_updated_at  BEFORE UPDATE ON shopping_carts  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cart_items_updated_at      BEFORE UPDATE ON cart_items      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Número de cotización: COT-20240115-000001
CREATE SEQUENCE quote_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quote_number := 'COT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                        LPAD(NEXTVAL('quote_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_quote_number
    BEFORE INSERT ON quotes
    FOR EACH ROW EXECUTE FUNCTION generate_quote_number();

-- Número de orden: ORD-20240115-000001
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                        LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Subtotal de línea de cotización = quantity * unit_price
CREATE OR REPLACE FUNCTION calculate_quote_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quote_item_subtotal
    BEFORE INSERT OR UPDATE ON quote_items
    FOR EACH ROW EXECUTE FUNCTION calculate_quote_item_subtotal();

-- Subtotal de línea de orden = quantity * unit_price
CREATE OR REPLACE FUNCTION calculate_order_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_item_subtotal
    BEFORE INSERT OR UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION calculate_order_item_subtotal();

-- Total de cotización = suma de sus ítems
CREATE OR REPLACE FUNCTION update_quote_total()
RETURNS TRIGGER AS $$
DECLARE
    target_quote_id UUID;
BEGIN
    target_quote_id := COALESCE(NEW.quote_id, OLD.quote_id);
    UPDATE quotes
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM quote_items WHERE quote_id = target_quote_id
    )
    WHERE id = target_quote_id;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_quote_total
    AFTER INSERT OR UPDATE OR DELETE ON quote_items
    FOR EACH ROW EXECUTE FUNCTION update_quote_total();

-- Total de orden = suma de sus ítems
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
    target_order_id UUID;
BEGIN
    target_order_id := COALESCE(NEW.order_id, OLD.order_id);
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM order_items WHERE order_id = target_order_id
    )
    WHERE id = target_order_id;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_total
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- product_availability automático según stock
CREATE OR REPLACE FUNCTION sync_product_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity = 0 THEN
        NEW.product_availability := 'out_of_stock';
    ELSIF NEW.stock_quantity <= NEW.min_stock_alert THEN
        NEW.product_availability := 'low_stock';
    ELSIF NEW.product_availability IN ('out_of_stock', 'low_stock') THEN
        NEW.product_availability := 'in_stock';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_product_availability
    BEFORE INSERT OR UPDATE OF stock_quantity ON products
    FOR EACH ROW EXECUTE FUNCTION sync_product_availability();

-- Slug automático al insertar producto si no se provee
CREATE OR REPLACE FUNCTION set_product_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter   INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug  := generate_slug(NEW.name);
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM products WHERE slug = final_slug AND id != NEW.id) LOOP
            counter    := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_product_slug
    BEFORE INSERT OR UPDATE OF name ON products
    FOR EACH ROW EXECUTE FUNCTION set_product_slug();

-- Slug automático al insertar categoría
CREATE OR REPLACE FUNCTION set_category_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug  TEXT;
    final_slug TEXT;
    counter    INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug  := generate_slug(NEW.name);
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM categories WHERE slug = final_slug AND id != NEW.id) LOOP
            counter    := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_category_slug
    BEFORE INSERT OR UPDATE OF name ON categories
    FOR EACH ROW EXECUTE FUNCTION set_category_slug();

-- Cuando un pago se completa → actualizar order.status y order.paid_at
CREATE OR REPLACE FUNCTION sync_order_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        UPDATE orders
        SET status  = 'paid',
            paid_at = CURRENT_TIMESTAMP
        WHERE id = NEW.order_id AND status = 'pending_payment';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_order_on_payment
    AFTER UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION sync_order_on_payment();

-- Trigger para crear el registro de usuario al registrarse en Supabase Auth
-- Este trigger se ejecuta en auth.users (schema de Supabase)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'minorista',
        'pending_approval'
    )
    ON CONFLICT (auth_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- NOTA: Este trigger se aplica sobre auth.users que pertenece a Supabase.
-- Ejecutar SOLO en producción (Supabase Dashboard → SQL Editor):
--
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- Patrón: auth_id = auth.uid() para usuarios propios
--         EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin') para admins
-- ============================================================================

ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_offers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "user: ver perfil propio"    ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "user: editar perfil propio" ON users FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY "admin: gestionar usuarios"  ON users FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- user_documents
CREATE POLICY "user: ver docs propios"    ON user_documents FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "user: subir docs propios"  ON user_documents FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "admin: gestionar docs"     ON user_documents FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- categories (cualquier visitante puede leer las activas)
CREATE POLICY "público: ver categorías activas" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "admin: gestionar categorías"     ON categories FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- products (cualquier visitante puede leer los activos)
CREATE POLICY "público: ver productos activos" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "admin: gestionar productos"     ON products FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- product_variants, product_images, product_offers
CREATE POLICY "público: ver variantes"        ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "admin: gestionar variantes"    ON product_variants FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "público: ver imágenes"         ON product_images   FOR SELECT USING (true);
CREATE POLICY "admin: gestionar imágenes"     ON product_images   FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "público: ver ofertas activas"  ON product_offers   FOR SELECT USING (is_active = true);
CREATE POLICY "admin: gestionar ofertas"      ON product_offers   FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- price_visibility_settings
CREATE POLICY "público: ver configuración de precios" ON price_visibility_settings FOR SELECT USING (true);
CREATE POLICY "admin: editar configuración de precios" ON price_visibility_settings FOR ALL USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- quotes
CREATE POLICY "user: ver cotizaciones propias"    ON quotes FOR SELECT USING (customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "user: crear cotizaciones"          ON quotes FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "admin: gestionar cotizaciones"     ON quotes FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- quote_items
CREATE POLICY "user: ver items de cotizaciones propias" ON quote_items FOR SELECT
    USING (quote_id IN (SELECT id FROM quotes WHERE customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "user: agregar items a cotizaciones"      ON quote_items FOR INSERT
    WITH CHECK (quote_id IN (SELECT id FROM quotes WHERE customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "admin: gestionar items de cotizaciones"  ON quote_items FOR ALL
    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- shopping_carts
CREATE POLICY "user: gestionar carrito propio" ON shopping_carts FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- cart_items
CREATE POLICY "user: gestionar items del carrito" ON cart_items FOR ALL
    USING (cart_id IN (SELECT id FROM shopping_carts WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())))
    WITH CHECK (cart_id IN (SELECT id FROM shopping_carts WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));

-- orders
CREATE POLICY "user: ver órdenes propias"   ON orders FOR SELECT USING (customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "admin: gestionar órdenes"    ON orders FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- order_items
CREATE POLICY "user: ver items de órdenes propias" ON order_items FOR SELECT
    USING (order_id IN (SELECT id FROM orders WHERE customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())));
CREATE POLICY "admin: gestionar items de órdenes"  ON order_items FOR ALL
    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- payments
CREATE POLICY "user: ver pagos propios"    ON payments FOR SELECT USING (customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "user: crear pagos"          ON payments FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "admin: gestionar pagos"     ON payments FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- email_notifications / audit_log
CREATE POLICY "user: ver notificaciones propias" ON email_notifications FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "admin: gestionar notificaciones"  ON email_notifications FOR ALL    USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "admin: ver audit log"             ON audit_log            FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin'));

-- ============================================================================
-- 8. DATOS INICIALES
-- updated_by es NULL porque no existe admin al aplicar el schema
-- ============================================================================

INSERT INTO price_visibility_settings (role, show_prices, updated_by) VALUES
    ('minorista', false, NULL),
    ('mayorista', false, NULL),
    ('admin',     true,  NULL);

INSERT INTO categories (name, slug, description, icon, display_order) VALUES
    ('Telas',      'telas',      'Variedad de telas para todo tipo de proyectos', 'fabric',  1),
    ('Hilos',      'hilos',      'Hilos de costura en múltiples colores',         'thread',  2),
    ('Botones',    'botones',    'Botones decorativos y funcionales',             'circle',  3),
    ('Accesorios', 'accesorios', 'Cintas, encajes, cierres y más',               'scissors',4);

-- ============================================================================
-- 9. VISTAS ÚTILES
-- ============================================================================

-- Producto completo con imagen principal, categoría y oferta activa
CREATE VIEW v_products_complete AS
SELECT
    p.*,
    c.name     AS category_name,
    c.slug     AS category_slug,
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
    (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = true) AS variant_count,
    EXISTS (
        SELECT 1 FROM product_offers po
        WHERE po.product_id = p.id
          AND po.is_active = true
          AND CURRENT_TIMESTAMP BETWEEN po.start_date AND po.end_date
    ) AS has_active_offer
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Cotización con datos del cliente
CREATE VIEW v_quotes_with_customer AS
SELECT
    q.*,
    u.name         AS customer_name,
    u.email        AS customer_email,
    u.phone        AS customer_phone,
    u.company_name AS customer_company,
    u.role         AS customer_role,
    (SELECT COUNT(*) FROM quote_items WHERE quote_id = q.id) AS item_count
FROM quotes q
LEFT JOIN users u ON q.customer_id = u.id;

-- Orden con datos del cliente y pago
CREATE VIEW v_orders_complete AS
SELECT
    o.*,
    u.name         AS customer_name,
    u.email        AS customer_email,
    u.phone        AS customer_phone,
    u.company_name AS customer_company,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)         AS item_count,
    (SELECT status  FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS last_payment_status,
    (SELECT method  FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1) AS last_payment_method
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON TABLE users    IS 'Perfiles de usuario. auth_id conecta con Supabase Auth (auth.users).';
COMMENT ON TABLE products IS 'Catálogo de productos. slug generado automáticamente desde name.';
COMMENT ON TABLE orders   IS 'Ciclo de vida: pending_payment → paid → processing → shipped → delivered.';
COMMENT ON TABLE payments IS 'processor_response (JSONB) almacena la respuesta raw del procesador de pagos.';
