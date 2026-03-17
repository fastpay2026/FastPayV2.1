import express from 'express';
import pkg from '@binance/connector';
const Spot = pkg ? (pkg as any).Spot : null;
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';

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
    console.log('[Price Feed] Master Sync started with Dual-Routing (Binance + Yahoo Finance).');
    
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
            if (!response.ok) continue;
            const data = await response.json();
            
            if (data.lastPrice) {
              const currentPrice = parseFloat(data.lastPrice);
              const change24h = parseFloat(data.priceChangePercent);
              
              // تطبيق تذبذب وهمي لضمان حركة السعر
              const jitter = (Math.random() - 0.5) * (currentPrice * 0.00005);
              const noisyPrice = currentPrice + jitter;
              
              await supabase.from('trade_assets').update({
                price: noisyPrice,
                change_24h: change24h,
                is_frozen: false
              }).eq('id', asset.id);
            }
          } catch (err: any) {
            console.error(`[Binance] Error for ${asset.symbol}:`, err);
          }
        }
        lastPriceUpdate.status = 'idle';
      } catch (e: any) {
        console.error('[Binance] Global Sync Error:', e.message);
        lastPriceUpdate.status = 'error';
      }
    };

    const syncYahooFinancePrices = async () => {
      try {
        lastPriceUpdate.status = 'syncing_yahoo';
        const { data: assets, error: assetsError } = await supabase.from('trade_assets').select('*');
        if (assetsError) throw assetsError;
        if (!assets || assets.length === 0) return;

        const yahooAssets = assets.filter(a => a.type?.toLowerCase() !== 'crypto' && a.category !== 'Crypto' && !a.symbol.includes('BTC') && !a.symbol.includes('ETH'));

        const symbolMap: Record<string, string> = {
          'EURUSD': 'EURUSD=X',
          'GBPUSD': 'GBPUSD=X',
          'USDJPY': 'JPY=X',
          'XAUUSD': 'XAUUSD=X',
          'XAGUSD': 'XAGUSD=X',
          'US30': '^DJI',
          'NAS100': '^IXIC',
          'WTI': 'CL=F'
        };

        const GOLD_ADJUSTMENT = 5.0; // معامل تصحيح سعر الذهب

        for (const asset of yahooAssets) {
          try {
            let yahooSymbol = symbolMap[asset.symbol] || asset.symbol;
            let response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`);
            
            // 1. تدقيق الرمز: إذا فشل XAUUSD=X جرب GC=F
            if (!response.ok && asset.symbol === 'XAUUSD') {
              yahooSymbol = 'GC=F';
              response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`);
            }

            if (!response.ok) continue;
            const data = await response.json();
            
            if (data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta && data.chart.result[0].meta.regularMarketPrice) {
              let currentPrice = data.chart.result[0].meta.regularMarketPrice;
              
              // 2. إضافة معامل التصحيح للذهب
              if (asset.symbol === 'XAUUSD') {
                currentPrice += GOLD_ADJUSTMENT;
              }

              // 4. نظام التذبذب الوهمي (Jittering)
              const jitter = (Math.random() - 0.5) * (currentPrice * 0.00005);
              currentPrice += jitter;

              // 3. معالجة الكسور (Precision)
              const precision = asset.symbol === 'XAUUSD' ? 2 : 5;
              currentPrice = parseFloat(currentPrice.toFixed(precision));
              
              await supabase.from('trade_assets').update({
                price: currentPrice,
                is_frozen: false
              }).eq('id', asset.id);
            }
          } catch (err: any) {
            console.error(`[Yahoo] Error for ${asset.symbol}:`, err.message);
          }
        }
        lastPriceUpdate.status = 'idle';
      } catch (e: any) {
        console.error('[Yahoo] Global Sync Error:', e.message);
        lastPriceUpdate.status = 'error';
      }
    };

    // Run Binance immediately then every 1s
    syncBinancePrices();
    setInterval(syncBinancePrices, 1000);

    // Run Yahoo Finance immediately then every 3s
    syncYahooFinancePrices();
    setInterval(syncYahooFinancePrices, 3000);
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

  // --- Enhanced Ghost Engine (3 Types Logic + Human Simulation) ---
  const runGhostEngine = async () => {
    console.log('[Ghost Engine] Advanced Bot Engine started.');

    const BOT_TYPES = [
      { name: 'ScalperBot', minAmount: 10, maxAmount: 50, minDuration: 5 * 60 * 1000, maxDuration: 15 * 60 * 1000 },
      { name: 'DayBot', minAmount: 100, maxAmount: 500, minDuration: 4 * 60 * 60 * 1000, maxDuration: 8 * 60 * 60 * 1000 },
      { name: 'SwingBot', minAmount: 1000, maxAmount: 5000, minDuration: 24 * 60 * 60 * 1000, maxDuration: 96 * 60 * 60 * 1000 }
    ];

    const runBotLifecycle = async (config: any) => {
      while (true) {
        try {
          // 1. توقيت دخول عشوائي (Human Simulation)
          const randomEntryDelay = Math.random() * 10000 + 2000; // 2-12 ثانية
          await new Promise(r => setTimeout(r, randomEntryDelay));

          if (!isSupabaseConfigured) continue;

          // 2. جلب أصل عشوائي
          const { data: assets } = await supabase.from('trade_assets').select('*').eq('is_frozen', false);
          if (!assets || assets.length === 0) continue;
          const asset = assets[Math.floor(Math.random() * assets.length)];

          // 3. فتح الصفقة
          const amount = (Math.random() * (config.maxAmount - config.minAmount) + config.minAmount).toFixed(2);
          const trade = {
            user_id: null,
            username: config.name,
            asset_symbol: asset.symbol,
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            amount: parseFloat(amount),
            entry_price: asset.price,
            status: 'open',
            is_bot: true,
            timestamp: new Date().toISOString()
          };

          await supabase.from('trade_orders').insert(trade);

          // 4. انتظار فترة الخروج (Duration)
          const duration = Math.random() * (config.maxDuration - config.minDuration) + config.minDuration;
          await new Promise(r => setTimeout(r, duration));

          // 5. إغلاق الصفقة (60% ربح، 40% خسارة)
          const isWin = Math.random() < 0.6;
          await supabase.from('trade_orders')
            .update({ 
              status: isWin ? 'closed_profit' : 'closed_loss',
              closed_at: new Date().toISOString() 
            })
            .eq('username', config.name)
            .eq('status', 'open')
            .eq('asset_symbol', asset.symbol);

        } catch (e: any) {
          console.error(`[Ghost Engine] ${config.name} Error:`, e.message);
          await new Promise(r => setTimeout(r, 5000)); // انتظار قبل المحاولة التالية
        }
      }
    };

    // تشغيل البوتات الثلاثة بشكل متوازي
    BOT_TYPES.forEach(config => runBotLifecycle(config));
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
    runGhostEngine();
    runLiveFeedGenerator();
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
