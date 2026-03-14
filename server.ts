import express from 'express';
const { Spot } = require('binance-connector-node');
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Supabase and Binance
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const binanceClient = new Spot(process.env.BINANCE_API_KEY!, process.env.BINANCE_SECRET_KEY!);

  // --- البوت المراقب (Watcher Bot) ---
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
          }
        }
      } catch (error) {
        console.error('Watcher Bot Error:', error);
      }
    }, 5000);
  };

  // --- نظام المتداولين الوهميين (Ghost Traders) ---
  const startGhostTraders = () => {
    console.log('Ghost Traders Bot started...');
    setInterval(async () => {
      try {
        const { data: config } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').single();
        if (!config || !config.is_enabled) return;

        const tradesPerHour = config.trades_per_hour || 5;
        
        // Open a random trade
        if (Math.random() < (tradesPerHour / 60)) {
            // Fetch bot users
            const { data: botUsers } = await supabase.from('users').select('*').eq('is_bot', true);
            if (!botUsers || botUsers.length === 0) return;

            const botUser = botUsers[Math.floor(Math.random() * botUsers.length)];

            console.log(`Ghost Trader ${botUser.username} opening a trade...`);
            const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const type = Math.random() > 0.5 ? 'buy' : 'sell';
            const amount = (Math.random() * 0.1 + 0.01).toFixed(4);
            
            await supabase.from('trade_orders').insert({
                user_id: botUser.id,
                username: botUser.username,
                asset_symbol: symbol,
                type: type,
                amount: parseFloat(amount),
                entry_price: 0, // Should be fetched from binance
                status: 'open'
            });
        }
      } catch (error) {
        console.error('Ghost Traders Error:', error);
      }
    }, 60000); // Check every minute
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
