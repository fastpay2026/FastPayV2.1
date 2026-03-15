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
          .eq('status', 'open')
          .eq('is_bot_enabled', true);

        if (error) throw error;
        if (!positions || positions.length === 0) return;

        if (!binanceClient) {
          console.error('Watcher Bot: Binance client not initialized, skipping cycle.');
          return;
        }

        for (const pos of positions) {
          try {
            const ticker = await binanceClient.tickerPrice(pos.asset_symbol);
            const currentPrice = parseFloat(ticker.data.price);

            if (
              (pos.forced_take_profit && currentPrice >= pos.forced_take_profit) ||
              (pos.forced_stop_loss && currentPrice <= pos.forced_stop_loss)
            ) {
              console.log(`Bot closing position ${pos.id} for user ${pos.user_id} at price ${currentPrice}`);
              await supabase
                .from('trade_orders')
                .update({ status: 'closed_profit', closed_at: new Date().toISOString() })
                .eq('id', pos.id);
              
              // Emit profit notification
              const profit = (currentPrice - pos.entry_price) * pos.amount;
              
              // تحديث رصيد المستخدم (البوت)
              const { data: user } = await supabase.from('users').select('balance').eq('id', pos.user_id).single();
              if (user) {
                  await supabase.from('users').update({ balance: user.balance + profit + pos.amount }).eq('id', pos.user_id);
              }
            }
          } catch (posError: any) {
            console.error(`Watcher Bot: Error processing position ${pos.id}:`, posError.message || posError);
          }
        }
      } catch (error: any) {
        console.error('Watcher Bot Error:', error.message || error);
        if (error.details) console.error('Watcher Bot Error Details:', error.details);
        if (error.hint) console.error('Watcher Bot Error Hint:', error.hint);
      }
    }, 5000);
  };

  // --- نظام المتداولين الوهميين (Ghost Traders) ---
  const startGhostTraders = async () => {
    if (!isSupabaseConfigured) {
      console.log('Ghost Traders: Supabase not configured, skipping bot start.');
      return;
    }
    console.log('Ghost Traders: System initializing...');
    
    const scheduleNextTrade = async () => {
      try {
        console.log('Ghost Traders: Running trade cycle...');
        const { data: configData, error: configError } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').maybeSingle();
        
        let config = configData;

        if (configError) {
          console.error('Ghost Traders: Error fetching config from Supabase:', configError);
        } else if (!config) {
          console.log('Ghost Traders: No config found in bot_config table. Using default (Active=true, Trades/Hour=5)');
          config = { is_active: true, trades_per_hour: 5 };
        }
        
        let nextDelay = 60000; 
        
        if (config && config.is_active) {
          console.log('Ghost Traders: Bot system is ACTIVE. Fetching bot users...');
          // Aggressive testing: always try to trade every 10 seconds if active
          nextDelay = 10000;
          const { data: botUsers, error: usersError } = await supabase.from('users').select('*').eq('is_bot', true);
          
          if (usersError) {
            console.error('Ghost Traders: Error fetching bot users:', usersError);
          } else {
            console.log(`Ghost Traders: Found ${botUsers?.length || 0} bot users.`);
            if (!botUsers || botUsers.length === 0) {
              const { data: anyUsers } = await supabase.from('users').select('username').limit(5);
              console.log('Ghost Traders: Sample users in DB:', anyUsers?.map(u => u.username).join(', ') || 'NONE');
            }
          }
          
          if (usersError || !botUsers || botUsers.length === 0) {
            console.log('Ghost Traders: No bot users found or error. Using fallback to any users...');
            const { data: fallbackUsers } = await supabase.from('users').select('*').limit(10);
            if (fallbackUsers && fallbackUsers.length > 0) {
              const botUser = fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)];
              await executeBotTrade(botUser);
            }
          } else {
            const botUser = botUsers[Math.floor(Math.random() * botUsers.length)];
            await executeBotTrade(botUser);
          }
        }

        async function executeBotTrade(botUser: any) {
          console.log(`Ghost Traders: Executing trade for ${botUser.username}`);
          const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];
          
          try {
            const ticker = await binanceClient.tickerPrice(symbol);
            const currentPrice = parseFloat(ticker.data.price);
            const amount = Math.floor(Math.random() * 50) + 10;
            const type = Math.random() > 0.5 ? 'buy' : 'sell';

            const tradeData = {
              user_id: botUser.id,
              asset_symbol: symbol,
              type: type,
              amount: amount,
              entry_price: currentPrice,
              status: 'open',
              is_bot: true,
              timestamp: new Date().toISOString()
            };

            // Insert into DB
            const { data: insertedTrade, error: insertError } = await supabase
              .from('trade_orders')
              .insert(tradeData)
              .select('*, users(username, is_bot)')
              .single();

            if (insertError) {
              console.error('Ghost Traders: DB Insert Error:', insertError.message);
            } else if (insertedTrade) {
              const flattened = {
                ...insertedTrade,
                username: insertedTrade.users?.username || botUser.username,
                is_bot: insertedTrade.users?.is_bot || true
              };
              console.log('Ghost Traders: [SUCCESS] Trade inserted:', flattened.username);
            }
          } catch (err) {
            console.error('Ghost Traders: Trade execution failed:', err);
          }
        }

        if (config && config.is_active) {
          console.log('Ghost Traders: Bot system is ACTIVE. Fetching bot users...');
          // Aggressive testing: always try to trade every 10 seconds if active
          nextDelay = 10000;
          const { data: botUsers, error: usersError } = await supabase.from('users').select('*').eq('is_bot', true);
          
          if (usersError) {
            console.error('Ghost Traders: Error fetching bot users:', usersError);
          } else {
            console.log(`Ghost Traders: Found ${botUsers?.length || 0} bot users.`);
          }
          
          if (usersError || !botUsers || botUsers.length === 0) {
            console.log('Ghost Traders: No bot users found or error. Using fallback to any users...');
            const { data: fallbackUsers } = await supabase.from('users').select('*').limit(10);
            if (fallbackUsers && fallbackUsers.length > 0) {
              const botUser = fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)];
              await executeBotTrade(botUser);
            }
          } else {
            const botUser = botUsers[Math.floor(Math.random() * botUsers.length)];
            await executeBotTrade(botUser);
          }
          nextDelay = Math.floor(Math.random() * (60000 / (config.trades_per_hour || 5) * 2 - 10000 + 1)) + 10000;
        } else {
          console.log('Ghost Traders: Bot system is INACTIVE (config.is_active is false).');
        }
        
        console.log(`Ghost Traders: Next cycle in ${nextDelay / 1000}s`);
        setTimeout(scheduleNextTrade, nextDelay);
      } catch (error) {
        console.error('Ghost Traders: Critical cycle error:', error);
        setTimeout(scheduleNextTrade, 60000);
      }
    };
    
    scheduleNextTrade();
  };

  // Start the bots
  startWatcherBot();
  startGhostTraders();

  // Trigger immediate bot trades for testing
  setTimeout(async () => {
    if (isSupabaseConfigured) {
      console.log('Ghost Traders: Triggering FORCED trades for test22 and mjodyiq...');
      try {
        const { data: targetBots } = await supabase
          .from('users')
          .select('*')
          .in('username', ['test22', 'mjodyiq']);
          
        if (targetBots && targetBots.length > 0) {
          for (const bot of targetBots) {
            console.log(`[BOT] Attempting to open forced trade for user: ${bot.username}`);
            const trade = {
              user_id: bot.id,
              asset_symbol: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'][Math.floor(Math.random() * 3)],
              type: Math.random() > 0.5 ? 'buy' : 'sell',
              amount: Math.floor(Math.random() * 50) + 10,
              entry_price: 70000 + (Math.random() * 500),
              status: 'open',
              is_bot: true,
              timestamp: new Date().toISOString()
            };
            const { error: insertError } = await supabase.from('trade_orders').insert(trade);
            if (insertError) {
              console.error(`[BOT] Failed to open trade for ${bot.username}:`, insertError.message);
            } else {
              console.log(`[BOT] Opened trade for user: ${bot.username}`);
            }
          }
        } else {
          console.log('Ghost Traders: Target bots not found. Falling back to any bots.');
          const { data: botUsers } = await supabase.from('users').select('*').eq('is_bot', true).limit(5);
          if (botUsers && botUsers.length > 0) {
            for (const bot of botUsers) {
              const trade = {
                user_id: bot.id,
                username: bot.username,
                asset_symbol: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'][Math.floor(Math.random() * 3)],
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                amount: Math.floor(Math.random() * 100) + 10,
                entry_price: 70000,
                status: 'open',
                is_bot_enabled: true,
                timestamp: new Date().toISOString()
              };
              await supabase.from('trade_orders').insert(trade);
              console.log(`[BOT] Opened trade for user: ${bot.username} (Fallback)`);
            }
          }
        }
      } catch (err) {
        console.error('Ghost Traders: Immediate test trades failed:', err);
      }
    }
  }, 2000);

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
