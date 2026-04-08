-- Full SQL Schema Dump for FastFlow Global 2026
-- Includes all tables, RLS policies, and seed data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password TEXT,
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
    is_bot BOOLEAN DEFAULT false,
    is_agent BOOLEAN DEFAULT false,
    agent_percentage DECIMAL(20, 2) DEFAULT 0,
    referred_by UUID REFERENCES users(id),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Site Config Table
CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions Table
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

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false
);

-- 6. Ad Exchange Items
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
    image_url_2 TEXT,
    image_url_3 TEXT,
    views INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    location JSONB,
    promotion_status TEXT DEFAULT 'none',
    promotion_type TEXT,
    promotion_price DECIMAL(20, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Ad Negotiations
CREATE TABLE IF NOT EXISTS ad_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ad_exchange_items(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    offer_amount DECIMAL(20, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Recharge Cards
CREATE TABLE IF NOT EXISTS recharge_cards (
    code TEXT PRIMARY KEY,
    amount DECIMAL(20, 2) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    generated_by TEXT NOT NULL,
    used_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- 9. Withdrawal Requests
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

-- 10. Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username TEXT,
    full_name TEXT,
    amount DECIMAL(20, 2),
    bank_name TEXT,
    iban TEXT,
    swift_code TEXT,
    status TEXT,
    requested_at TEXT
);

-- 11. Salary Financing
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

-- 12. Fixed Deposits
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

-- 13. Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    id_front TEXT,
    id_back TEXT,
    commercial_register TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT
);

-- 14. Verifications
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username TEXT,
    full_name TEXT,
    id_front TEXT,
    id_back TEXT,
    commercial_register TEXT,
    submitted_at TEXT,
    status TEXT
);

-- 15. Raffle Entries
CREATE TABLE IF NOT EXISTS raffle_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    ticket_number TEXT NOT NULL,
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Raffle Winners
CREATE TABLE IF NOT EXISTS raffle_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    prize_title TEXT NOT NULL,
    won_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Trade Assets
CREATE TABLE IF NOT EXISTS trade_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    symbol TEXT UNIQUE NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    change_24h DECIMAL(10, 2) DEFAULT 0,
    type TEXT NOT NULL,
    icon TEXT,
    is_frozen BOOLEAN DEFAULT false,
    trend_bias TEXT DEFAULT 'neutral',
    commission DECIMAL(20, 2) DEFAULT 0,
    spread DECIMAL(10, 2) DEFAULT 0
);

-- 18. Trade Orders
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
    bot_category TEXT,
    target_close_time TIMESTAMP WITH TIME ZONE,
    forced_take_profit DECIMAL(20, 8),
    forced_stop_loss DECIMAL(20, 8),
    closed_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    required_margin DECIMAL(20, 2) DEFAULT 0,
    total_swap DECIMAL(20, 2) DEFAULT 0,
    commission DECIMAL(20, 2) DEFAULT 0,
    profit DECIMAL(20, 8) DEFAULT 0,
    spread DECIMAL(10, 2) DEFAULT 0
);

-- 19. Trades
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR,
    type VARCHAR,
    volume NUMERIC,
    entry_price NUMERIC,
    exit_price NUMERIC,
    sl NUMERIC,
    tp NUMERIC,
    pnl NUMERIC,
    status VARCHAR,
    execution_type VARCHAR,
    admin_override_result BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 20. Trading Accounts
CREATE TABLE IF NOT EXISTS trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    leverage INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Trading Positions
CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    type TEXT CHECK (type IN ('Buy', 'Sell', 'BUY', 'SELL')),
    volume NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    current_price NUMERIC,
    sl NUMERIC,
    tp NUMERIC,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    is_virtual BOOLEAN DEFAULT false,
    admin_intervention BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    forced_take_profit DOUBLE PRECISION,
    forced_stop_loss DOUBLE PRECISION,
    is_bot_enabled BOOLEAN DEFAULT false
);

-- 22. Copy Trading
CREATE TABLE IF NOT EXISTS copy_trading (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    ratio NUMERIC DEFAULT 1.0
);

-- 23. Bot Config
CREATE TABLE IF NOT EXISTS bot_config (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    trades_per_hour INTEGER DEFAULT 5,
    aggressiveness DECIMAL(3, 2) DEFAULT 1.0,
    active_bots_count INTEGER DEFAULT 5,
    max_trades_per_15m INTEGER DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. Bot Instances
CREATE TABLE IF NOT EXISTS bot_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    strategy TEXT CHECK (strategy IN ('scalper', 'day', 'swing')),
    mode TEXT CHECK (mode IN ('manual', 'auto')),
    win_rate NUMERIC DEFAULT 0.5,
    is_active BOOLEAN DEFAULT false,
    amount_type TEXT CHECK (amount_type IN ('fixed', 'random')),
    fixed_amount NUMERIC DEFAULT 10.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. Bot Trades
CREATE TABLE IF NOT EXISTS bot_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bot_instances(id) ON DELETE CASCADE,
    bot_name TEXT,
    amount NUMERIC,
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. Bot Trades Simulation
CREATE TABLE IF NOT EXISTS bot_trades_simulation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID REFERENCES bot_instances(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    type TEXT CHECK (type IN ('buy', 'sell')),
    amount NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed_profit', 'closed_loss')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 27. Bots
CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    isactive BOOLEAN DEFAULT false
);

-- 28. Platform Revenues
CREATE TABLE IF NOT EXISTS platform_revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trade_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    asset_symbol TEXT NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agent_id UUID REFERENCES users(id),
    agent_profit DECIMAL(20, 2) DEFAULT 0,
    admin_profit DECIMAL(20, 2) DEFAULT 0
);

-- 29. Platform Stats
CREATE TABLE IF NOT EXISTS platform_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_profits DECIMAL(20, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 30. Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL
);

-- 31. Landing Services
CREATE TABLE IF NOT EXISTS landing_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT
);

-- 32. Custom Pages
CREATE TABLE IF NOT EXISTS custom_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    show_in_navbar BOOLEAN DEFAULT true,
    show_in_footer BOOLEAN DEFAULT true
);

-- 33. FX Exchange Settings
CREATE TABLE IF NOT EXISTS fx_exchange_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    status TEXT DEFAULT 'online',
    buy_rate TEXT DEFAULT '1',
    gateway_fee TEXT DEFAULT '2',
    min_transfer TEXT DEFAULT '10',
    is_active BOOLEAN DEFAULT true,
    usdt_buy_rate DECIMAL(20, 4) DEFAULT 1.0,
    usdt_sell_rate DECIMAL(20, 4) DEFAULT 1.0,
    gateway_fee_percent DECIMAL(5, 2) DEFAULT 1.0,
    min_transfer_amount DECIMAL(20, 2) DEFAULT 10.0,
    is_gateway_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 34. Distributor Security Keys
CREATE TABLE IF NOT EXISTS distributor_security_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    serial_number TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 35. FX Gateway Queue
CREATE TABLE IF NOT EXISTS fx_gateway_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    amount NUMERIC,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wallet_address TEXT,
    distributor_id TEXT,
    fee NUMERIC DEFAULT 100,
    totalAmount NUMERIC DEFAULT 5050,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    net_to_recipient NUMERIC DEFAULT 450,
    netAmount NUMERIC DEFAULT 0,
    total_amount NUMERIC,
    receipt_image TEXT,
    tx_id TEXT
);

-- 36. Gateway Config
CREATE TABLE IF NOT EXISTS gateway_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    status TEXT DEFAULT 'online',
    is_active BOOLEAN DEFAULT true
);

-- 37. FX Distributor Status
CREATE TABLE IF NOT EXISTS fx_distributor_status (
    distributor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    usdt_capacity DECIMAL(20, 2) DEFAULT 0,
    availability_status TEXT DEFAULT 'offline' CHECK (availability_status IN ('online', 'offline', 'delayed')),
    delay_info TEXT,
    update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 38. Distributor Security Configs
CREATE TABLE IF NOT EXISTS distributor_security_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    security_pin TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 39. FX Flash Registry
CREATE TABLE IF NOT EXISTS fx_flash_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor_id TEXT,
    hardware_hash TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 40. Agent Lottery Prizes
CREATE TABLE IF NOT EXISTS agent_lottery_prizes (
    id SERIAL PRIMARY KEY,
    prize_description TEXT NOT NULL,
    num_winners INTEGER NOT NULL,
    lottery_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 41. Agent Lottery Winners
CREATE TABLE IF NOT EXISTS agent_lottery_winners (
    id SERIAL PRIMARY KEY,
    prize_id INTEGER REFERENCES agent_lottery_prizes(id),
    agent_id TEXT NOT NULL,
    winner_user_id TEXT NOT NULL,
    won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 42. Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    admin_name TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 43. Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0.0,
    equity NUMERIC DEFAULT 0.0,
    margin_used NUMERIC DEFAULT 0.0,
    free_margin NUMERIC DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    margin NUMERIC DEFAULT 0
);

-- Enable RLS and add policies for critical tables
ALTER TABLE platform_revenues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on platform_revenues" ON platform_revenues FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on platform_stats" ON platform_stats FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fx_exchange_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on fx_exchange_settings" ON fx_exchange_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE distributor_security_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on distributor_security_keys" ON distributor_security_keys FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fx_gateway_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on fx_gateway_queue" ON fx_gateway_queue FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fx_distributor_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on fx_distributor_status" ON fx_distributor_status FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE distributor_security_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on distributor_security_configs" ON distributor_security_configs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on bot_config" ON bot_config FOR ALL USING (true) WITH CHECK (true);

-- Initial Seed Data
INSERT INTO site_config (id, config) VALUES (1, '{"site_name": "FastFlow Global", "maintenance_mode": false}') ON CONFLICT (id) DO NOTHING;
INSERT INTO trade_assets (name, symbol, price, type, spread, commission) VALUES 
('Bitcoin', 'BTCUSD', 60000, 'crypto', 0.01, 0.05),
('Ethereum', 'ETHUSD', 3000, 'crypto', 0.02, 0.05),
('Euro', 'EURUSD', 1.10, 'forex', 0.0001, 0.02);
