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

  // API Route for Closing Order (Moved to top)
  app.post('/api/close-position', express.json(), (req, res) => {
    console.log('DEBUG: Received POST request on /api/close-position, body:', req.body);
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId' });
    }
    console.log('Closing order:', orderId);
    res.status(200).json({ message: 'Order closed successfully' });
  });

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
