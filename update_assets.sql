-- Update trade_assets table to MT5 standards
ALTER TABLE trade_assets ADD COLUMN IF NOT EXISTS digits INTEGER DEFAULT 5;
ALTER TABLE trade_assets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Forex';
ALTER TABLE trade_assets ADD COLUMN IF NOT EXISTS spread DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE trade_assets ADD COLUMN IF NOT EXISTS description TEXT;

-- Clear existing assets to start fresh with MT5 standards
DELETE FROM trade_assets;

-- 1. Forex Major (Digits: 5, Spread: 1.5 - 2.0)
INSERT INTO trade_assets (name, symbol, price, digits, category, spread, type) VALUES
('Euro vs US Dollar', 'EURUSD', 1.08542, 5, 'Forex Major', 1.5, 'forex'),
('British Pound vs US Dollar', 'GBPUSD', 1.26431, 5, 'Forex Major', 1.8, 'forex'),
('US Dollar vs Japanese Yen', 'USDJPY', 151.423, 3, 'Forex Major', 1.2, 'forex'),
('US Dollar vs Canadian Dollar', 'USDCAD', 1.35672, 5, 'Forex Major', 2.0, 'forex'),
('US Dollar vs Swiss Franc', 'USDCHF', 0.90231, 5, 'Forex Major', 2.1, 'forex'),
('Australian Dollar vs US Dollar', 'AUDUSD', 0.65432, 5, 'Forex Major', 1.7, 'forex'),
('New Zealand Dollar vs US Dollar', 'NZDUSD', 0.60123, 5, 'Forex Major', 1.9, 'forex');

-- 2. Forex Crosses (Digits: 5, Spread: 2.5 - 4.0)
INSERT INTO trade_assets (name, symbol, price, digits, category, spread, type) VALUES
('Euro vs British Pound', 'EURGBP', 0.85821, 5, 'Forex Crosses', 2.5, 'forex'),
('Euro vs Japanese Yen', 'EURJPY', 164.321, 3, 'Forex Crosses', 2.8, 'forex'),
('British Pound vs Japanese Yen', 'GBPJPY', 191.432, 3, 'Forex Crosses', 3.2, 'forex'),
('Australian Dollar vs Japanese Yen', 'AUDJPY', 98.765, 3, 'Forex Crosses', 3.0, 'forex'),
('Canadian Dollar vs Japanese Yen', 'CADJPY', 111.543, 3, 'Forex Crosses', 3.1, 'forex'),
('Euro vs Australian Dollar', 'EURAUD', 1.65872, 5, 'Forex Crosses', 3.5, 'forex'),
('British Pound vs Canadian Dollar', 'GBPCAD', 1.71432, 5, 'Forex Crosses', 3.8, 'forex');

-- 3. Metals (Digits: 2, Spread: 15 - 30)
INSERT INTO trade_assets (name, symbol, price, digits, category, spread, type) VALUES
('Gold vs US Dollar', 'XAUUSD', 2175.42, 2, 'Metals', 15.0, 'metal'),
('Silver vs US Dollar', 'XAGUSD', 24.56, 2, 'Metals', 3.0, 'metal');

-- 4. Indices (Digits: 2, Spread: 100 - 500)
INSERT INTO trade_assets (name, symbol, price, digits, category, spread, type) VALUES
('Dow Jones Industrial Average', 'US30', 39475.21, 2, 'Indices', 200.0, 'index'),
('Nasdaq 100', 'NAS100', 18325.43, 2, 'Indices', 150.0, 'index'),
('S&P 500', 'SPX500', 5234.12, 2, 'Indices', 50.0, 'index'),
('DAX 40', 'GER40', 18175.32, 2, 'Indices', 120.0, 'index'),
('FTSE 100', 'UK100', 7932.45, 2, 'Indices', 100.0, 'index');

-- 5. Energies (Digits: 2, Spread: 5 - 15)
INSERT INTO trade_assets (name, symbol, price, digits, category, spread, type) VALUES
('Crude Oil WTI', 'WTI', 81.42, 2, 'Energies', 5.0, 'energy'),
('Brent Crude Oil', 'BRENT', 85.67, 2, 'Energies', 5.0, 'energy'),
('Natural Gas', 'NATGAS', 1.78, 3, 'Energies', 10.0, 'energy');

-- 6. Crypto (Digits: 2, Spread: 500 - 5000)
INSERT INTO trade_assets (name, symbol, price, digits, category, spread, type) VALUES
('Bitcoin vs US Dollar', 'BTCUSD', 67432.12, 2, 'Crypto', 5000.0, 'crypto'),
('Ethereum vs US Dollar', 'ETHUSD', 3542.67, 2, 'Crypto', 300.0, 'crypto'),
('Solana vs US Dollar', 'SOLUSD', 187.42, 2, 'Crypto', 50.0, 'crypto'),
('Ripple vs US Dollar', 'XRPUSD', 0.6234, 4, 'Crypto', 10.0, 'crypto');
