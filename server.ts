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

  // --- Master Price Feed Sync (MT5 Standards) ---
  const runPriceFeed = async () => {
    console.log('[Price Feed] Master Sync started.');
    
    setInterval(async () => {
      try {
        const { data: assets } = await supabase.from('trade_assets').select('*');
        if (!assets || assets.length === 0) return;

        // Mapping symbols to Yahoo Finance format
        const symbols = assets.map(a => {
          if (a.category === 'Crypto') return `${a.symbol.replace('USD', '')}-USD`;
          if (a.category && a.category.includes('Forex')) return `${a.symbol}=X`;
          if (a.symbol === 'XAUUSD') return 'GC=F';
          if (a.symbol === 'XAGUSD') return 'SI=F';
          if (a.symbol === 'US30') return '^DJI';
          if (a.symbol === 'NAS100') return '^IXIC';
          if (a.symbol === 'SPX500') return '^GSPC';
          if (a.symbol === 'WTI') return 'CL=F';
          if (a.symbol === 'BRENT') return 'BZ=F';
          return a.symbol;
        });

        const results = await yahooFinance.quote(symbols) as any[];
        
        if (results && Array.isArray(results)) {
          for (const quote of results) {
            const asset = assets.find(a => 
              symbols[assets.indexOf(a)] === quote.symbol
            );
  
            if (asset && quote.regularMarketPrice) {
              await supabase.from('trade_assets').update({
                price: quote.regularMarketPrice,
                change_24h: quote.regularMarketChangePercent || 0,
                is_frozen: false
              }).eq('id', asset.id);
            }
          }
        }
      } catch (e: any) {
        console.error('[Price Feed] Sync Error:', e.message);
      }
    }, 10000); 
  };

  if (isSupabaseConfigured) {
    runPriceFeed();
  }

  // 5. API Routes - MUST be before any catch-all or static middleware
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
    
    setInterval(async () => {
      try {
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

              if (count === 0) {
                // اختيار أصل عشوائي من الأصول الحقيقية
                const randomAsset = assets[Math.floor(Math.random() * assets.length)];
                
                await supabase.from('bot_trades_simulation').insert({
                  bot_id: bot.id,
                  symbol: randomAsset.symbol,
                  type: Math.random() > 0.5 ? 'buy' : 'sell',
                  amount: bot.fixed_amount || 100,
                  price: randomAsset.price,
                  status: 'open'
                });
                console.log(`[Ghost Engine] Auto-trade opened for ${bot.name} on ${randomAsset.symbol}`);
              }
            }
          }
        }
      } catch (e: any) {
        console.error('[Ghost Engine] Error:', e.message);
      }
    }, 15000); 
  };

  runGhostEngine();

  // API for Purge All
  app.post('/api/admin/purge-bots', async (req, res) => {
    try {
      await supabase.from('bot_trades_simulation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bot_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 404 Guard
  app.all('/api/*', (req, res) => {
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

    app.get('*', (req, res) => {
      console.log(`[DEBUG] Catch-all route hit for: ${req.url}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
