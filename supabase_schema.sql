-- Supabase SQL Schema for FastPay Global 2026

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
    api_keys JSONB DEFAULT '[]'
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
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Enable RLS (Optional but recommended)
-- For this demo, we can keep it simple or add basic policies.
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public profiles are viewable by everyone." ON users FOR SELECT USING (true);
