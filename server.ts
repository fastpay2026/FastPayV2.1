import express from 'express';
import pkg from '@binance/connector';
const Spot = pkg ? (pkg as any).Spot : null;
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }));
  app.use(express.json());

  console.log('Server: Initializing services...');

  // 2. Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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

  // 4. Socket.io Setup
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: "*", // Radical allow for debugging
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingInterval: 10000,
    pingTimeout: 5000
  });

  io.engine.on("connection_error", (err) => {
    console.error('Socket Engine Error:', err.code, err.message, err.context);
  });

  // 5. API Routes
  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', connected: true });
  });

  app.get('/api/trades', async (req, res) => {
    console.log('API: Request for /api/trades');
    if (!isSupabaseConfigured) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }
    try {
      const { data, error } = await supabase
        .from('trade_orders')
        .select('*')
        .eq('status', 'open')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error('API Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // API 404 Guard - MUST be after all valid API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.originalUrl} not found` });
  });

  // 6. Socket Events
  io.on('connection', (socket) => {
    console.log('Server: New connection:', socket.id);
    socket.emit('connection_status', { status: 'Connected' });
    
    const sendInitialData = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data: openTrades, error } = await supabase
          .from('trade_orders')
          .select('*')
          .eq('status', 'open')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (!error) {
          socket.emit('initial_trades', openTrades || []);
        }
      } catch (err) {
        console.error('Server: Initial data fetch error:', err);
      }
    };

    sendInitialData();

    socket.on('disconnect', (reason) => {
      console.log('Server: Disconnected:', socket.id, 'Reason:', reason);
    });
  });

  // --- الاستماع لتغييرات قاعدة البيانات ---
  if (isSupabaseConfigured) {
    supabase
      .channel('trade_orders_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_orders' }, (payload) => {
        console.log('New trade detected:', payload.new);
        io.emit('new_trade', payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trade_orders' }, async (payload) => {
        console.log('Trade updated:', payload.new);
        if (payload.new.status === 'closed_profit') {
          const { data: user } = await supabase.from('users').select('username').eq('id', payload.new.user_id).single();
          const profit = (payload.new.exit_price - payload.new.entry_price) * payload.new.amount;
          io.emit('profit_notification', { username: user?.username || 'Trader', profit });
        }
      })
      .subscribe();
  } else {
    console.log('Server: Supabase not configured, skipping database listener.');
  }
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

              io.emit('profit_notification', { username: pos.username, profit });
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
          
          if (botUsers && botUsers.length > 0) {
            const botUser = botUsers[Math.floor(Math.random() * botUsers.length)];
            console.log(`Ghost Traders: Selected bot ${botUser.username} (Balance: ${botUser.balance})`);
            
            // Check balance
            if (botUser.balance < 10) {
                console.log(`Ghost Traders: Bot ${botUser.username} has insufficient balance ($${botUser.balance}). Skipping cycle.`);
                setTimeout(scheduleNextTrade, 30000);
                return;
            }

            const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            
            try {
              console.log(`Ghost Traders: Fetching price for ${symbol}...`);
              const ticker = await binanceClient.tickerPrice(symbol);
              const currentPrice = parseFloat(ticker.data.price);
              
              if (isNaN(currentPrice)) {
                throw new Error(`Invalid price received for ${symbol}: ${ticker.data.price}`);
              }

              console.log(`Ghost Traders: Current price for ${symbol} is ${currentPrice}`);

              // Random Amount (10 to 100)
              const amount = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
              
              console.log(`Ghost Traders: Deducting ${amount} from ${botUser.username}'s balance...`);
              const { error: balanceError } = await supabase.from('users').update({ balance: botUser.balance - amount }).eq('id', botUser.id);
              if (balanceError) console.error('Ghost Traders: Balance update error:', balanceError);
              
              const trade = {
                  user_id: botUser.id,
                  username: botUser.username,
                  asset_symbol: symbol,
                  type: Math.random() > 0.5 ? 'buy' : 'sell',
                  amount: amount,
                  entry_price: currentPrice,
                  status: 'open',
                  is_bot_enabled: true,
                  timestamp: new Date().toISOString()
              };

              console.log(`Ghost Traders: Inserting trade for ${botUser.username}...`);
              const { error: insertError } = await supabase.from('trade_orders').insert(trade);
              if (insertError) {
                console.error('Ghost Traders: Error inserting trade:', insertError.message || insertError);
                if (insertError.details) console.error('Ghost Traders: Error Details:', insertError.details);
                if (insertError.hint) console.error('Ghost Traders: Error Hint:', insertError.hint);
              } else {
                console.log(`Ghost Traders: Trade inserted successfully. Emitting to socket...`);
                io.emit('new_trade', trade);
                console.log(`Ghost Traders: Bot ${botUser.username} opened trade on ${symbol} at ${currentPrice}.`);
              }
            } catch (tickerError) {
              console.error(`Ghost Traders: Error during trade execution for ${symbol}:`, tickerError);
            }
          } else {
            console.log('Ghost Traders: No bot users found. Please mark some users as bots in the dashboard.');
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
      console.log('Ghost Traders: Triggering 5 IMMEDIATE test trades...');
      try {
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
            io.emit('new_trade', trade);
          }
          console.log('Ghost Traders: 5 test trades emitted.');
        }
      } catch (err) {
        console.error('Ghost Traders: Immediate test trades failed:', err);
      }
    }
  }, 1000);

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
