-- The Royal Palette Restaurant Management System Schema for InsForge PostgreSQL DB

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_name TEXT DEFAULT 'UtensilsCrossed',
    sort_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bangla_name TEXT,
    description TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    dietary_tags JSONB DEFAULT '[]'::jsonb,
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time_minutes INT DEFAULT 15,
    modifier_groups JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Restaurant Tables
CREATE TABLE IF NOT EXISTS dining_tables (
    id TEXT PRIMARY KEY,
    table_number TEXT UNIQUE NOT NULL,
    capacity INT DEFAULT 4,
    section TEXT NOT NULL DEFAULT 'INDOOR',
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    current_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customers & Loyalty Members
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    tier TEXT NOT NULL DEFAULT 'BRONZE',
    points_balance INT DEFAULT 50,
    total_spent NUMERIC(12, 2) DEFAULT 0,
    visit_count INT DEFAULT 0,
    birth_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'DINE_IN',
    table_id TEXT REFERENCES dining_tables(id) ON DELETE SET NULL,
    table_number TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    service_charge_amount NUMERIC(10, 2) DEFAULT 0,
    tip_amount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    points_earned INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    points_discount_value NUMERIC(10, 2) DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'UNPAID',
    payment_method TEXT,
    payments JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_modifiers JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Cash Drawer Kick Audit Logs
CREATE TABLE IF NOT EXISTS drawer_logs (
    id TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    order_number TEXT,
    amount NUMERIC(10, 2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY DEFAULT 'GLOBAL_CONFIG',
    restaurant_name TEXT DEFAULT 'The Royal Palette',
    tagline TEXT DEFAULT 'A Symphony of Royal Flavors & Contemporary Elegance',
    currency TEXT DEFAULT '৳',
    currency_code TEXT DEFAULT 'BDT',
    address TEXT DEFAULT 'Plot 42, Road 11, Block D, Gulshan-2, Dhaka 1212',
    phone TEXT DEFAULT '+880 1711-234567',
    email TEXT DEFAULT 'concierge@royalpalette.com.bd',
    bin_number TEXT DEFAULT 'BIN-002938471-0102',
    vat_percent NUMERIC(5, 2) DEFAULT 5.00,
    service_charge_percent NUMERIC(5, 2) DEFAULT 5.00,
    auto_kick_drawer_on_cash BOOLEAN DEFAULT TRUE,
    drawer_kick_code_hex TEXT DEFAULT '1B 70 00 19 FA',
    receipt_footer_message TEXT DEFAULT 'Thank you for gracing The Royal Palette! Visit again.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables with public policies for this app
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for API
DO $$
BEGIN
    CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on dining_tables" ON dining_tables FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on drawer_logs" ON drawer_logs FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all on system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
