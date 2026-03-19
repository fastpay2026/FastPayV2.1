-- Supabase SQL Schema for FastPay Global 2026
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password TEXT, -- In a real app, use Supabase Auth, but for this demo we store it
    role TEXT NOT NULL CHECK (role IN ('DEVELOPER', 'MERCHANT', 'USER', 'ACCOUNTANT', 'DISTRIBUTOR', 'GUEST')),
    balance DECIMAL(20, 2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
    status_reason TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
    verification_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    linked_cards JSONB DEFAULT '[]',
    assets JSONB DEFAULT '[]',
    api_keys JSONB DEFAULT '[]',
    is_bot BOOLEAN DEFAULT false
);

-- 2. Site Config Table (Single Row)
CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    related_user TEXT,
    related_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT,
    hash TEXT,
    notes TEXT
);

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false
);

-- 5. Ad Exchange Items
CREATE TABLE IF NOT EXISTS ad_exchange_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(20, 2) NOT NULL,
    is_negotiable BOOLEAN DEFAULT true,
    category TEXT,
    image_url TEXT,
    views INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    location JSONB,
    promotion_status TEXT DEFAULT 'none',
    promotion_type TEXT,
    promotion_price DECIMAL(20, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Ad Negotiations
CREATE TABLE IF NOT EXISTS ad_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ad_exchange_items(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    offer_amount DECIMAL(20, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Recharge Cards
CREATE TABLE IF NOT EXISTS recharge_cards (
    code TEXT PRIMARY KEY,
    amount DECIMAL(20, 2) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    generated_by TEXT NOT NULL,
    used_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- 8. Withdrawal Requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    bank_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    swift_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Salary Financing
CREATE TABLE IF NOT EXISTS salary_financing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    deduction DECIMAL(20, 2) NOT NULL,
    duration INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Fixed Deposits
CREATE TABLE IF NOT EXISTS fixed_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_profit DECIMAL(20, 2) NOT NULL,
    status TEXT DEFAULT 'active'
);

-- 11. Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    id_front TEXT, -- Base64 or URL
    id_back TEXT,
    commercial_register TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT
);

-- 12. Raffle Entries
CREATE TABLE IF NOT EXISTS raffle_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    ticket_number TEXT NOT NULL,
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Raffle Winners
CREATE TABLE IF NOT EXISTS raffle_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    prize_title TEXT NOT NULL,
    won_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Trade Assets
CREATE TABLE IF NOT EXISTS trade_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    symbol TEXT UNIQUE NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    change_24h DECIMAL(10, 2) DEFAULT 0,
    type TEXT NOT NULL,
    icon TEXT,
    is_frozen BOOLEAN DEFAULT false,
    trend_bias TEXT DEFAULT 'neutral'
);

-- 15. Trade Orders
CREATE TABLE IF NOT EXISTS trade_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    asset_symbol TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    status TEXT DEFAULT 'open',
    is_bot BOOLEAN DEFAULT false,
    is_bot_enabled BOOLEAN DEFAULT false,
    bot_config JSONB DEFAULT '{}',
    bot_category TEXT, -- 'scalper', 'day', 'swing'
    target_close_time TIMESTAMP WITH TIME ZONE,
    forced_take_profit DECIMAL(20, 8),
    forced_stop_loss DECIMAL(20, 8),
    closed_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist if table was created before
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS is_bot_enabled BOOLEAN DEFAULT false;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS bot_config JSONB DEFAULT '{}';
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS bot_category TEXT;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS target_close_time TIMESTAMP WITH TIME ZONE;

-- 16. Platform Revenues
CREATE TABLE IF NOT EXISTS platform_revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trade_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    asset_symbol TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE platform_revenues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on platform_revenues" ON platform_revenues FOR ALL USING (true) WITH CHECK (true);

-- 16. Landing Services
CREATE TABLE IF NOT EXISTS landing_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT
);

-- 17. Custom Pages
CREATE TABLE IF NOT EXISTS custom_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    show_in_navbar BOOLEAN DEFAULT true,
    show_in_footer BOOLEAN DEFAULT true
);

-- 18. FX Exchange Settings
CREATE TABLE IF NOT EXISTS fx_exchange_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usdt_buy_rate DECIMAL(20, 4) DEFAULT 1.0,
    usdt_sell_rate DECIMAL(20, 4) DEFAULT 1.0,
    gateway_fee_percent DECIMAL(5, 2) DEFAULT 1.0,
    min_transfer_amount DECIMAL(20, 2) DEFAULT 10.0,
    is_gateway_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE fx_exchange_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on fx_exchange_settings" ON fx_exchange_settings FOR ALL USING (true) WITH CHECK (true);

-- 19. Distributor Security Keys
CREATE TABLE IF NOT EXISTS distributor_security_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    serial_number TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE distributor_security_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on distributor_security_keys" ON distributor_security_keys FOR ALL USING (true) WITH CHECK (true);

-- 20. FX Gateway Queue
CREATE TABLE IF NOT EXISTS fx_gateway_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    distributor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(20, 2) NOT NULL,
    fee DECIMAL(20, 2) NOT NULL,
    total_amount DECIMAL(20, 2) NOT NULL,
    wallet_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_distributor', 'handshake_complete', 'proof_uploaded', 'success_pending_review', 'completed', 'rejected')),
    receipt_image TEXT,
    tx_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE fx_gateway_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on fx_gateway_queue" ON fx_gateway_queue FOR ALL USING (true) WITH CHECK (true);

-- 21. FX Distributor Status
CREATE TABLE IF NOT EXISTS fx_distributor_status (
    distributor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    usdt_capacity DECIMAL(20, 2) DEFAULT 0,
    availability_status TEXT DEFAULT 'offline' CHECK (availability_status IN ('online', 'offline', 'delayed')),
    delay_info TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE fx_distributor_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on fx_distributor_status" ON fx_distributor_status FOR ALL USING (true) WITH CHECK (true);

-- 22. Distributor Security Configs
CREATE TABLE IF NOT EXISTS distributor_security_configs (
    distributor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    security_pin TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add policies for distributor_security_configs
ALTER TABLE distributor_security_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on distributor_security_configs" ON distributor_security_configs FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS (Optional but recommended)
-- For this demo, we can keep it simple or add basic policies.
-- 23. Bot Config Table
CREATE TABLE IF NOT EXISTS bot_config (
    key TEXT PRIMARY KEY,
    is_active BOOLEAN DEFAULT false,
    trades_per_hour INTEGER DEFAULT 5,
    aggressiveness DECIMAL(3, 2) DEFAULT 1.0,
    active_bots_count INTEGER DEFAULT 5,
    max_trades_per_15m INTEGER DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure column exists
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS aggressiveness DECIMAL(3, 2) DEFAULT 1.0;
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS active_bots_count INTEGER DEFAULT 5;
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS max_trades_per_15m INTEGER DEFAULT 10;

-- Enable RLS and add policies for bot_config
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on bot_config" ON bot_config FOR ALL USING (true) WITH CHECK (true);
