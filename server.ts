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

  // --- نظام المتداولين الوهميين (Ghost Traders) ---
  const startGhostTraders = async () => {
    if (!isSupabaseConfigured) {
      console.log('Ghost Traders: Supabase not configured, skipping bot start.');
      return;
    }
    console.log('Ghost Traders: System initializing with Personas...');

    const ensureBotConfig = async () => {
      const { data: config } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').maybeSingle();
      if (!config) {
        console.log('Ghost Traders: Creating default bot configuration...');
        await supabase.from('bot_config').insert({
          key: 'ghost_traders',
          is_active: false,
          trades_per_hour: 5,
          aggressiveness: 1.0,
          active_bots_count: 5,
          max_trades_per_15m: 10
        });
      }
    };

    const ensureBotUsers = async () => {
      const { data: existingBots } = await supabase.from('users').select('id').eq('is_bot', true);
      const count = existingBots?.length || 0;
      console.log(`[Bot Engine] Found ${count} bot users in database.`);
    };

    await ensureBotConfig();
    await ensureBotUsers();
    
    const executeBotTrade = async (botUser: any) => {
      // 1. Check if bot already has an open trade to prevent duplicates/lag
      const { data: existingOpen } = await supabase
        .from('trade_orders')
        .select('id')
        .eq('user_id', botUser.id)
        .eq('status', 'open')
        .maybeSingle();
      
      if (existingOpen) {
        // console.log(`[Bot Engine] Bot ${botUser.username} already has an open trade. Skipping.`);
        return;
      }

      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT'];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      try {
        console.log(`[Bot Engine] Opening trade for user: ${botUser.username} on ${symbol}`);
        
        let currentPrice = 0;
        if (binanceClient) {
          try {
            const ticker = await binanceClient.tickerPrice(symbol);
            currentPrice = parseFloat(ticker.data.price);
          } catch (tickerErr) {
            console.warn(`Ghost Traders: Failed to fetch price for ${symbol}, using fallback.`);
            const fallbacks: any = { 'BTCUSDT': 95000, 'ETHUSDT': 2700, 'SOLUSDT': 180, 'XRPUSDT': 2.5, 'BNBUSDT': 600, 'ADAUSDT': 0.8 };
            currentPrice = fallbacks[symbol] || 100;
          }
        } else {
          const fallbacks: any = { 'BTCUSDT': 95000, 'ETHUSDT': 2700, 'SOLUSDT': 180, 'XRPUSDT': 2.5, 'BNBUSDT': 600, 'ADAUSDT': 0.8 };
          currentPrice = fallbacks[symbol] || 100;
        }
        
        const amount = (Math.random() * (250.0 - 50.0) + 50.0).toFixed(2);
        const type = Math.random() > 0.5 ? 'buy' : 'sell';

        // Spread Logic: $10 spread
        const spread = 10.0;
        const entryPrice = type === 'buy' ? currentPrice + spread : currentPrice - spread;

        // Bot Personas logic
        const rand = Math.random();
        let category: 'scalper' | 'day' | 'swing' = 'scalper';
        let closeDelayMs = 0;

        if (rand < 0.6) {
          category = 'scalper';
          closeDelayMs = (Math.random() * (300 - 30) + 30) * 1000;
        } else if (rand < 0.9) {
          category = 'day';
          closeDelayMs = (Math.random() * (180 - 15) + 15) * 60 * 1000;
        } else {
          category = 'swing';
          closeDelayMs = (Math.random() * (72 - 24) + 24) * 60 * 60 * 1000;
        }

        const targetCloseTime = new Date(Date.now() + closeDelayMs).toISOString();

        const tradeData = {
          user_id: botUser.id,
          username: botUser.username,
          asset_symbol: symbol,
          type: type,
          amount: parseFloat(amount),
          entry_price: entryPrice,
          status: 'open',
          is_bot: true,
          bot_category: category,
          target_close_time: targetCloseTime,
          timestamp: new Date().toISOString()
        };

        const { error: insertError } = await supabase.from('trade_orders').insert(tradeData);
        if (insertError) {
          console.error(`Ghost Traders: Failed to insert trade for ${botUser.username}:`, insertError.message);
        } else {
          console.log(`Ghost Traders: [SUCCESS] ${category.toUpperCase()} trade opened for ${botUser.username} at ${entryPrice}`);
        }
      } catch (err) {
        console.error('Ghost Traders: Critical trade execution failure:', err);
      }
    };

    let lastActiveState = false;

    const runDensityCycle = async () => {
      try {
        const { data: config } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').maybeSingle();
        const isActive = config?.is_active ?? false;

        // Detect state change from false to true for immediate execution
        if (isActive && !lastActiveState) {
          console.log('[Bot Engine] System activated! Triggering immediate trades.');
          // Immediate execution logic
          const { data: allEnabledBots } = await supabase
            .from('users')
            .select('*')
            .eq('is_bot', true)
            .eq('status', 'active');
          
          if (allEnabledBots && allEnabledBots.length > 0) {
            for (const botUser of allEnabledBots) {
              await executeBotTrade(botUser);
            }
          }
        }

        if (isActive) {
          const activeBotsLimit = config.active_bots_count || 5;
          const aggressiveness = config.aggressiveness || 1.0;

          // 1. Anti-Lag: Check current open bot trades
          const { data: openBotTrades } = await supabase
            .from('trade_orders')
            .select('id, user_id')
            .eq('status', 'open')
            .eq('is_bot', true);
          
          const activeUserIds = new Set(openBotTrades?.map(t => t.user_id) || []);
          const currentOpenCount = openBotTrades?.length || 0;

          // Get all bots (is_bot = true) - removed status check to debug
          const { data: allBots, error: botsError } = await supabase
            .from('users')
            .select('*')
            .eq('is_bot', true);
          
          if (botsError) {
            console.error('[Bot Engine] Error fetching bots:', botsError);
          } else {
            console.log('[Bot Engine] ALL bots found:', allBots?.length || 0);
          }
          
          // Use all bots for now
          const allEnabledBots = allBots || [];
          const enabledBotsCount = allEnabledBots.length;

          console.log(`[Bot Engine] Cycle: Active=${isActive}, OpenTrades=${currentOpenCount}, EnabledBots=${enabledBotsCount}, ActiveBots=${activeUserIds.size}`);

          if (allEnabledBots && allEnabledBots.length > 0) {
            // Ensure EVERY enabled bot has at least one trade
            for (const botUser of allEnabledBots) {
              if (!activeUserIds.has(botUser.id)) {
                console.log(`[Bot Engine] Opening trade for user: ${botUser.username} (Force Start)`);
                await executeBotTrade(botUser);
                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            // 3. Regular Density Scheduling (Extra trades for activity)
            const maxTrades15m = config.max_trades_per_15m || 10;
            const tradesThisMinute = Math.ceil((maxTrades15m / 15) * aggressiveness);
            
            if (tradesThisMinute > 0) {
              for (let i = 0; i < tradesThisMinute; i++) {
                const offset = Math.random() * 25000; 
                setTimeout(() => {
                  const botUser = allEnabledBots[Math.floor(Math.random() * allEnabledBots.length)];
                  executeBotTrade(botUser);
                }, offset);
              }
            }
          }
        } else {
          console.log(`[Bot Engine] System is PAUSED. No new trades will be opened.`);
        }
        lastActiveState = isActive;
      } catch (error) {
        console.error('Ghost Traders Density Cycle Error:', error);
      }
      
      // Check every 5 seconds for maximum responsiveness
      setTimeout(runDensityCycle, 5000);
    };
    
    runDensityCycle();
  };

  // Start the bots
  startWatcherBot();
  startGhostTraders();

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Server: Starting Vite in middleware mode...');
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
