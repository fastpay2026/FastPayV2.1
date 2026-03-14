import express from 'express';
const { Spot } = require('binance-connector-node');
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Supabase and Binance
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const binanceClient = new Spot(process.env.BINANCE_API_KEY!, process.env.BINANCE_SECRET_KEY!);

  // --- الاستماع لتغييرات قاعدة البيانات ---
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
  const startWatcherBot = () => {
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

        for (const pos of positions) {
          const ticker = await binanceClient.tickerPrice(pos.symbol);
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
        }
      } catch (error) {
        console.error('Watcher Bot Error:', error);
      }
    }, 5000);
  };

  // --- نظام المتداولين الوهميين (Ghost Traders) ---
  const startGhostTraders = async () => {
    console.log('Ghost Traders Bot started...');
    
    const scheduleNextTrade = async () => {
      try {
        const { data: config } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').single();
        console.log('Ghost Traders: Checking config...', config);
        
        let nextDelay = 60000; 
        
        if (config && config.is_enabled) {
          console.log('Ghost Traders: Bot system is ENABLED.');
          const { data: botUsers } = await supabase.from('users').select('*').eq('is_bot', true);
          console.log('Ghost Traders: Bot users fetched:', botUsers?.length);
          
          if (botUsers && botUsers.length > 0) {
            const botUser = botUsers[Math.floor(Math.random() * botUsers.length)];
            console.log(`Ghost Traders: Selected bot ${botUser.username} (Balance: ${botUser.balance})`);
            
            // Check balance
            if (botUser.balance < 10) {
                console.log(`Bot ${botUser.username} has insufficient balance.`);
                setTimeout(scheduleNextTrade, 60000);
                return;
            }

            const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            
            const ticker = await binanceClient.tickerPrice(symbol);
            const currentPrice = parseFloat(ticker.data.price);
            
            // Random Amount (10 to 100)
            const amount = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
            
            // Deduct balance
            await supabase.from('users').update({ balance: botUser.balance - amount }).eq('id', botUser.id);
            
            const trade = {
                user_id: botUser.id,
                username: botUser.username,
                asset_symbol: symbol,
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                amount: amount,
                entry_price: currentPrice,
                status: 'open',
                timestamp: new Date().toISOString()
            };

            await supabase.from('trade_orders').insert(trade);
            io.emit('new_trade', trade);
            
            console.log(`Bot ${botUser.username} opened trade. Balance deducted.`);
          }
          nextDelay = Math.floor(Math.random() * (60000 - 10000 + 1)) + 10000;
        }
        
        setTimeout(scheduleNextTrade, nextDelay);
      } catch (error) {
        console.error('Ghost Traders Error:', error);
        setTimeout(scheduleNextTrade, 60000);
      }
    };
    
    scheduleNextTrade();
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
