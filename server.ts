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

  // API 404 Guard - MUST be after all valid API routes but before catch-all
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.originalUrl} not found` });
  });

  const startWatcherBot = () => {
    if (!isSupabaseConfigured) {
      console.log('Watcher Bot: Supabase not configured, skipping bot start.');
      return;
    }
    console.log('Watcher Bot started...');
    setInterval(async () => {
      try {
        const { data: positions, error } = await supabase
          .from('trade_orders')
          .select('*')
          .eq('status', 'open');

        if (error) throw error;
        if (!positions || positions.length === 0) return;

        const botPositions = positions.filter(p => p.is_bot === true || p.is_bot_enabled === true);
        if (botPositions.length === 0) return;

        if (!binanceClient) {
          console.error('Watcher Bot: Binance client not initialized, skipping cycle.');
          return;
        }

        const now = new Date();

        for (const pos of botPositions) {
          try {
            // 1. Smart Closing Logic: check target_close_time
            let shouldClose = false;
            if (pos.target_close_time) {
              const targetTime = new Date(pos.target_close_time);
              if (now >= targetTime) {
                shouldClose = true;
              }
            } else {
              // Fallback to old scalping logic if no target_close_time
              const entryTime = new Date(pos.timestamp);
              const minutesOpen = (now.getTime() - entryTime.getTime()) / 60000;
              if (minutesOpen >= 15) shouldClose = true;
            }

            // 2. Forced TP/SL (only if not already closing)
            if (!shouldClose) {
              const ticker = await binanceClient.tickerPrice(pos.asset_symbol);
              const currentPrice = parseFloat(ticker.data.price);
              const isBuy = pos.type === 'buy';
              
              shouldClose = isBuy 
                ? (pos.forced_take_profit && currentPrice >= pos.forced_take_profit) || (pos.forced_stop_loss && currentPrice <= pos.forced_stop_loss)
                : (pos.forced_take_profit && currentPrice <= pos.forced_take_profit) || (pos.forced_stop_loss && currentPrice >= pos.forced_stop_loss);
            }

            if (shouldClose) {
              // 60/40 win/loss logic for bots
              const winProbability = 0.6;
              const finalStatus = (Math.random() < winProbability) ? 'closed_profit' : 'closed_loss';
              
              console.log(`[WATCHER] Closing bot trade ${pos.id} | Category: ${pos.bot_category} | Result: ${finalStatus}`);
              
              await supabase
                .from('trade_orders')
                .update({ status: finalStatus, closed_at: new Date().toISOString() })
                .eq('id', pos.id);
            }
          } catch (posError: any) {
            console.error(`Watcher Bot: Error processing position ${pos.id}:`, posError.message || posError);
          }
        }
      } catch (error: any) {
        console.error('Watcher Bot Error:', error.message || error);
      }
    }, 5000); // Check every 5 seconds for faster closing
  };

  // --- Ghost Engine Integration ---
  import './ghost_engine';

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  const botLogs: string[] = [];
  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString();
    const log = `[Bot Engine] ${timestamp}: ${msg}`;
    botLogs.push(log);
    if (botLogs.length > 50) botLogs.shift();
    console.log(log);
  };

  // API to fetch logs
  app.get('/api/bot-logs', (req, res) => {
    res.json({ logs: botLogs });
  });

  // API to trigger test trade
  app.post('/api/test-trade', async (req, res) => {
    addLog('Manual test trade triggered.');
    try {
      const { data: users } = await supabase.from('users').select('*').eq('is_bot', true).limit(1);
      if (!users || users.length === 0) {
        throw new Error('No bots found to test.');
      }
      const botUser = users[0];
      addLog(`Attempting test trade for: ${botUser.username}`);
      await executeBotTrade(botUser);
      addLog('Test trade executed successfully.');
      res.json({ success: true });
    } catch (error: any) {
      const errorMsg = `[Error] Failed to open trade: ${error.message}`;
      addLog(errorMsg);
      res.status(500).json({ error: errorMsg });
    }
  });
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
