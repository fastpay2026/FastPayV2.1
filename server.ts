import express from 'express';
import { Spot } from '@binance/connector';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  const client = new Spot(process.env.BINANCE_API_KEY || '', process.env.BINANCE_SECRET_KEY || '');

  // API Route for Binance Price
  app.get('/api/price/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const response = await client.tickerPrice(symbol);
      res.json(response.data);
    } catch (error) {
      console.error('Binance API Error:', error);
      res.status(500).json({ error: 'Failed to fetch price' });
    }
  });

  // API Route for Closing Order
  app.post('/api/test-close', (req, res) => {
    const { orderId } = req.body;
    console.log('Closing order:', orderId);
    // Here you would add logic to interact with Binance/Supabase if needed
    res.status(200).json({ message: 'Order closed successfully' });
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
