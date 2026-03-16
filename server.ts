import express from 'express';
import pkg from '@binance/connector';
const Spot = pkg ? (pkg as any).Spot : null;
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import yahooFinance from 'yahoo-finance2';

console.log('Server: Process starting...');
if (!pkg) {
  console.error('CRITICAL: @binance/connector package failed to load!');
}
if (!Spot) {
  console.error('CRITICAL: Spot class not found in @binance/connector!');
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  // 1. Basic Middleware
  app.use((req, res, next) => {
    console.log(`[DEBUG] Request Path: ${req.path} | Method: ${req.method} | Time: ${new Date().toISOString()}`);
    next();
  });

  app.use(cors({
    origin: ["https://trade.fastpay-network.com", "https://fastpay-network.com", "*"],
    methods: ["GET", "POST"],
    credentials: true
  }));
  app.use(express.json());

  console.log('Server: Initializing services...');

  // 2. Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Bot trades might fail due to RLS.');
  }
  
  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder.supabase.co'));

  console.log('Server: Supabase URL Present:', !!supabaseUrl);
  console.log('Server: Supabase Key Present:', !!supabaseKey);
  console.log('Server: Supabase Configured:', isSupabaseConfigured);

  if (!isSupabaseConfigured) {
    console.error('CRITICAL: Supabase environment variables are missing or invalid!');
  }

  // 3. Initialize Supabase and Binance
  const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseKey || 'placeholder'
  );
  
  let binanceClient: any;
  try {
    if (Spot) {
      binanceClient = new Spot(process.env.BINANCE_API_KEY || '', process.env.BINANCE_SECRET_KEY || '');
      console.log('Server: Binance client initialized');
    }
  } catch (e) {
    console.error('Server: Failed to initialize Binance client:', e);
  }

  // --- Assets Seeding (MT5 Standard Assets) ---
  const seedAssets = async () => {
    console.log('[Seed] Starting asset verification...');
    try {
      const coreAssets = [
        { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', price: 1.0850, is_frozen: false },
        { symbol: 'GBPUSD', name: 'Great Britain Pound / US Dollar', type: 'forex', price: 1.2640, is_frozen: false },
        { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', price: 150.50, is_frozen: false },
        { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'metal', price: 2155.20, is_frozen: false },
        { symbol: 'XAGUSD', name: 'Silver / US Dollar', type: 'metal', price: 24.50, is_frozen: false },
        { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', type: 'crypto', price: 68450.00, is_frozen: false },
        { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', type: 'crypto', price: 3820.00, is_frozen: false },
        { symbol: 'US30', name: 'Dow Jones 30', type: 'index', price: 39120.00, is_frozen: false },
        { symbol: 'NAS100', name: 'Nasdaq 100', type: 'index', price: 18150.00, is_frozen: false },
        { symbol: 'WTI', name: 'Crude Oil WTI', type: 'energy', price: 78.40, is_frozen: false }
      ];

      const { data, error } = await supabase
        .from('trade_assets')
        .upsert(coreAssets, { onConflict: 'symbol' });

      if (error) {
        console.error('[Seed] Critical Error during seeding:', error.message);
      } else {
        console.log('[Seed] Assets successfully verified and updated in database.');
      }
    } catch (err: any) {
      console.error('[Seed] Unexpected error during seeding:', err.message);
    }
  };

  let lastPriceUpdate = {
    time: null as string | null,
    status: 'idle',
    error: null as string | null,
    count: 0
  };

  // --- Master Price Feed Sync (MT5 Standards) ---
  const runPriceFeed = async () => {
    console.log('[Price Feed] Master Sync started with Dual-Routing (Binance + Twelve Data).');
    
    const syncBinancePrices = async () => {
      try {
        lastPriceUpdate.status = 'syncing_binance';
        const { data: assets, error: assetsError } = await supabase.from('trade_assets').select('*');
        if (assetsError) throw assetsError;
        if (!assets || assets.length === 0) return;

        const cryptoAssets = assets.filter(a => a.type?.toLowerCase() === 'crypto' || a.category === 'Crypto' || a.symbol.includes('BTC') || a.symbol.includes('ETH'));

        for (const asset of cryptoAssets) {
          try {
            const binanceSymbol = asset.symbol.toUpperCase().replace('USD', 'USDT');
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
            const data = await response.json();
            
            if (data.lastPrice) {
              const currentPrice = parseFloat(data.lastPrice);
              const change24h = parseFloat(data.priceChangePercent);
              
              // Add a tiny bit of noise to ensure price always changes even if Binance is flat
              const noise = (Math.random() - 0.5) * (currentPrice * 0.00001);
              const noisyPrice = currentPrice + noise;

              const { error: updateError } = await supabase.from('trade_assets').update({
                price: noisyPrice,
                change_24h: change24h,
                is_frozen: false
              }).eq('id', asset.id);
              
              if (updateError) {
                console.error(`[Binance] Update failed for ${asset.symbol}:`, updateError.message);
                lastPriceUpdate.error = updateError.message;
              } else {
                console.log(`[Binance] UPDATED: ${asset.symbol} -> ${currentPrice} | Time: ${new Date().toLocaleTimeString()}`);
                lastPriceUpdate.time = new Date().toISOString();
                lastPriceUpdate.count++;
              }
            }
          } catch (err: any) {
            console.error(`[Binance] Error for ${asset.symbol}:`, err);
            lastPriceUpdate.error = err.message;
          }
        }
        lastPriceUpdate.status = 'idle';
      } catch (e: any) {
        console.error('[Binance] Global Sync Error:', e.message);
        lastPriceUpdate.error = e.message;
        lastPriceUpdate.status = 'error';
      }
    };

    const simulateNonCryptoPrices = async () => {
      try {
        lastPriceUpdate.status = 'simulating';
        const { data: assets, error: assetsError } = await supabase.from('trade_assets').select('*');
        if (assetsError) throw assetsError;
        if (!assets || assets.length === 0) return;

        const nonCryptoAssets = assets.filter(a => a.type?.toLowerCase() !== 'crypto' && a.category !== 'Crypto' && !a.symbol.includes('BTC') && !a.symbol.includes('ETH'));

        for (const asset of nonCryptoAssets) {
          // Realistic random walk simulation
          // Increased volatility for Forex to ensure movement is visible
          const volatility = asset.type === 'forex' ? 0.0004 : 
                             asset.type === 'metal' ? 0.0015 : 
                             asset.type === 'index' ? 0.0008 : 0.003;
                             
          const changePercent = (Math.random() - 0.5) * volatility;
          const currentPrice = Number(asset.price) * (1 + changePercent);
          
          // Ensure price always changes at least a little bit (at least 1 pip for forex)
          const minChange = asset.type === 'forex' ? 0.00001 : 0.01;
          const finalPrice = Math.abs(currentPrice - Number(asset.price)) < minChange 
            ? Number(asset.price) + (Math.random() > 0.5 ? minChange : -minChange)
            : currentPrice;
          
          const change24h = Number(asset.change_24h) + (changePercent * 100);
          const boundedChange24h = Math.max(-10, Math.min(10, change24h));

          const { error: updateError } = await supabase.from('trade_assets').update({
            price: finalPrice,
            change_24h: boundedChange24h,
            is_frozen: false
          }).eq('id', asset.id);

          if (asset.symbol === 'EURUSD' || asset.symbol === 'GBPUSD') {
            // Ensure Forex always moves at least 2-5 pips
            const pips = (Math.floor(Math.random() * 4) + 2) * 0.0001;
            const direction = Math.random() > 0.5 ? 1 : -1;
            const forcedPrice = Number(asset.price) + (direction * pips);
            
            await supabase.from('trade_assets').update({
              price: forcedPrice,
              change_24h: boundedChange24h,
              is_frozen: false
            }).eq('id', asset.id);
            
            console.log(`[Price Feed] FORCED ${asset.symbol} to ${forcedPrice.toFixed(5)}`);
            continue; // Skip the default update below
          }

          if (updateError) {
            console.error(`[Simulation] Update failed for ${asset.symbol}:`, updateError.message);
            lastPriceUpdate.error = updateError.message;
          } else {
            console.log(`[Simulation] UPDATED: ${asset.symbol} -> ${currentPrice.toFixed(asset.digits || 2)}`);
            lastPriceUpdate.time = new Date().toISOString();
            lastPriceUpdate.count++;
          }
        }
        lastPriceUpdate.status = 'idle';
      } catch (e: any) {
        console.error('[Simulation] Global Sync Error:', e.message);
        lastPriceUpdate.error = e.message;
        lastPriceUpdate.status = 'error';
      }
    };

    // Run Binance immediately then every 1s
    syncBinancePrices();
    setInterval(syncBinancePrices, 1000);

    // Run Simulation immediately then every 800ms
    simulateNonCryptoPrices();
    setInterval(simulateNonCryptoPrices, 800);
  };

  if (isSupabaseConfigured) {
    console.log('Server: Starting initialization...');
    await seedAssets();
    runPriceFeed();
  } else {
    console.error('Server: Initialization NOT started due to missing Supabase config.');
  }

  // 5. API Routes - MUST be before any catch-all or static middleware
  app.get('/api/debug/price-feed', (req, res) => {
    res.json({
      ...lastPriceUpdate,
      supabaseConfigured: isSupabaseConfigured,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', connected: true });
  });

  app.get('/api/debug/ghost-traders', async (req, res) => {
    try {
      const { data: config } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').maybeSingle();
      const { data: openBotTrades } = await supabase
        .from('trade_orders')
        .select('id, user_id, username, bot_category')
        .eq('status', 'open')
        .eq('is_bot', true);
      
      const { data: allBots } = await supabase.from('users').select('id, username, is_bot').eq('is_bot', true);
      
      res.json({
        config,
        openTradesCount: openBotTrades?.length || 0,
        uniqueActiveBots: new Set(openBotTrades?.map(t => t.user_id) || []).size,
        allBotsInDbCount: allBots?.length || 0,
        allBotsInDb: allBots,
        openTrades: openBotTrades,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/purge-bots', async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    try {
      console.log('[Purge] API: Cleaning up fake bots and simulation data...');
      // Delete simulation tables
      await supabase.from('bot_trades_simulation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bot_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete only bot trades, keep real user trades
      await supabase.from('trade_orders').delete().eq('is_bot', true);
      
      // Delete users marked as bot
      await supabase.from('users').delete().eq('is_bot', true);
      
      console.log('[Purge] API: Cleanup complete.');
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Purge] API: Cleanup failed:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/test-trade', async (req, res) => {
    console.log('API: Manual test trade trigger');
    if (!isSupabaseConfigured) return res.status(503).json({ error: 'Supabase not configured' });
    
    try {
      // Get a random user to act as the trader
      const { data: users } = await supabase.from('users').select('id, username').limit(1);
      const user = users?.[0] || { id: '00000000-0000-0000-0000-000000000000', username: 'System_Test' };

      const mockTrade = {
        user_id: user.id,
        asset_symbol: 'BTCUSDT',
        type: 'buy',
        amount: 1.5,
        entry_price: 70000,
        status: 'open',
        timestamp: new Date().toISOString()
      };

      const { data: inserted, error } = await supabase
        .from('trade_orders')
        .insert(mockTrade)
        .select('*, users(username)')
        .single();

      if (error) throw error;

      const flattened = {
        ...inserted,
        username: inserted.users?.username || user.username
      };

      return res.json({ success: true, trade: flattened });
    } catch (err: any) {
      console.error('API: Test trade failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // --- New Ghost Engine Integration (Directly in Server) ---
  const runGhostEngine = async () => {
    console.log('[Ghost Engine] Background process started.');
    
    // Increased frequency to 10 seconds for more activity
    setInterval(async () => {
      try {
        if (!isSupabaseConfigured) return;
        
        // 1. جلب البوتات
        const { data: bots } = await supabase.from('bot_instances').select('*');
        // 2. جلب الأصول المتاحة
        const { data: assets } = await supabase.from('trade_assets').select('*').eq('is_frozen', false);
        
        if (bots && bots.length > 0 && assets && assets.length > 0) {
          for (const bot of bots) {
            // A. إغلاق الصفقات القديمة تلقائياً
            const { data: openTrades } = await supabase
              .from('bot_trades_simulation')
              .select('*')
              .eq('bot_id', bot.id)
              .eq('status', 'open');

            if (openTrades) {
              for (const trade of openTrades) {
                const startTime = new Date(trade.created_at).getTime();
                const now = new Date().getTime();
                const durationMinutes = (now - startTime) / (1000 * 60);

                if (durationMinutes >= (trade.target_duration || 5)) {
                  await supabase.from('bot_trades_simulation').update({
                    status: Math.random() > 0.4 ? 'closed_profit' : 'closed_loss',
                    closed_at: new Date().toISOString()
                  }).eq('id', trade.id);
                  
                  // Also update the trade_orders table if it exists there
                  await supabase.from('trade_orders')
                    .update({ status: 'closed_profit', closed_at: new Date().toISOString() })
                    .eq('asset_symbol', trade.symbol)
                    .eq('username', bot.name)
                    .eq('status', 'open');
                }
              }
            }

            // B. فتح صفقات جديدة (في وضع AUTO)
            if (bot.mode === 'auto') {
              const { count } = await supabase
                .from('bot_trades_simulation')
                .select('*', { count: 'exact', head: true })
                .eq('bot_id', bot.id)
                .eq('status', 'open');

              // Allow up to 3 concurrent trades per bot for more activity
              if (!count || count < 3) {
                const randomAsset = assets[Math.floor(Math.random() * assets.length)];
                
                await supabase.from('bot_trades_simulation').insert({
                  bot_id: bot.id,
                  symbol: randomAsset.symbol,
                  type: Math.random() > 0.5 ? 'buy' : 'sell',
                  amount: bot.fixed_amount || 100,
                  price: randomAsset.price,
                  status: 'open'
                });

                await supabase.from('trade_orders').insert({
                  user_id: null,
                  username: bot.name,
                  asset_symbol: randomAsset.symbol,
                  type: Math.random() > 0.5 ? 'buy' : 'sell',
                  amount: bot.fixed_amount || 100,
                  entry_price: randomAsset.price,
                  status: 'open',
                  is_bot: true,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        }
      } catch (e: any) {
        console.error('[Ghost Engine] Error:', e.message);
      }
    }, 10000); 
  };

  // --- Live Feed Generator (Simulated Global Activity) ---
  const runLiveFeedGenerator = () => {
    console.log('[Live Feed] Generator started.');
    const fakeNames = [
      'Alex', 'Sarah', 'John', 'Elena', 'Marco', 'Yuki', 'Sofia', 'David', 'Emma', 'Lucas',
      'Ahmed', 'Fatima', 'Omar', 'Layla', 'Zaid', 'Nour', 'Hassan', 'Mona', 'Youssef', 'Amira'
    ];
    
    setInterval(async () => {
      try {
        if (!isSupabaseConfigured) return;
        
        // 50% chance to generate a trade every 3 seconds for more activity
        if (Math.random() > 0.5) {
          const { data: assets } = await supabase.from('trade_assets').select('*').eq('is_frozen', false);
          if (!assets || assets.length === 0) return;
          
          const asset = assets[Math.floor(Math.random() * assets.length)];
          const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
          
          await supabase.from('trade_orders').insert({
            user_id: null,
            username: `${name}_${Math.floor(Math.random() * 1000)}`,
            asset_symbol: asset.symbol,
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            amount: (Math.random() * 0.5 + 0.1).toFixed(2),
            entry_price: asset.price,
            status: 'open',
            is_bot: true,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e: any) {
        console.error('[Live Feed] Error:', e.message);
      }
    }, 3000);
  };

  // --- Purge Bots on Startup ---
  const purgeBots = async () => {
    if (!isSupabaseConfigured) return;
    console.log('[Purge] Cleaning up fake bots and simulation data...');
    try {
      // Delete simulation tables
      await supabase.from('bot_trades_simulation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bot_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete only bot trades, keep real user trades
      await supabase.from('trade_orders').delete().is('user_id', null);
      
      // Delete users marked as bot
      await supabase.from('users').delete().eq('is_bot', true);
      
      console.log('[Purge] Cleanup complete.');
    } catch (err: any) {
      console.error('[Purge] Cleanup failed:', err.message);
    }
  };

  if (isSupabaseConfigured) {
    await seedAssets();
    await purgeBots();
    runPriceFeed();
    // runGhostEngine(); // Removed to stop random bot trades
    // runLiveFeedGenerator(); // Removed to stop random names
  }

  // API 404 Guard
  app.all('/api/*all', (req, res) => {
    res.status(404).json({ error: `API route ${req.originalUrl} not found` });
  });
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Guard to ensure API requests never reach the catch-all
    app.use('/api', (req, res) => {
      res.status(404).json({ error: `API endpoint ${req.url} not found` });
    });

    app.get('*all', (req, res) => {
      console.log(`[DEBUG] Catch-all route hit for: ${req.url}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
