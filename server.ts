import 'dotenv/config';
console.log('[Server] Environment variables loaded. TIINGO_API_KEY:', process.env.TIINGO_API_KEY ? '***' + process.env.TIINGO_API_KEY.slice(-4) : 'Missing');
console.log('[Server] Environment variables loaded. ABLY_API_KEY exists:', !!(process.env.ABLY_API_KEY || process.env.VITE_ABLY_API_KEY));
import { setupExpress } from './core/express-setup';
import { handleAblyAuth } from './services/ably-auth-service';
import { seedAssets } from './services/database-seeder';
import { runPriceFeed } from './services/price-feed-engine';
import { runGhostEngine } from './services/ghost-trader-engine';
import { runStopOutEngine } from './services/stop-out-engine';
import { marketRouter } from './routes/market-api';
import { tradingRouter } from './routes/trading-api';
import { diagnosticRouter } from './routes/diagnostic-api';
import { createClient } from '@supabase/supabase-js';
import Ably from 'ably';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const { app, httpServer, io } = setupExpress();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder.supabase.co'));

const latestPrices: Record<string, number> = {};
const lastPriceUpdate = { timestamp: Date.now() };
let ably: Ably.Realtime | null = null;
let priceChannel: any = null;

const getAbly = () => {
  const key = process.env.ABLY_API_KEY || process.env.VITE_ABLY_API_KEY || '';
  if (!key) {
    console.warn('[Ably] No API key found. Real-time features will be limited.');
    return { ably: null, priceChannel: null };
  }

  if (!ably) {
    try {
      ably = new Ably.Realtime({ key });
      priceChannel = ably.channels.get('market-data');
      console.log('[Ably] Realtime client initialized');
    } catch (err) {
      console.error('[Ably] Initialization error:', err);
      return { ably: null, priceChannel: null };
    }
  }
  return { ably, priceChannel };
};

// Health check
app.get('/api/health', (req, res) => {
  console.log('[Server] /api/health requested');
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use((req, res, next) => {
  console.log(`[Server] Request: ${req.method} ${req.url}`);
  next();
});
app.get('/api/ably/auth', handleAblyAuth);
app.use(['/api/market', '/api/market/'], marketRouter(supabase));
app.use(['/api/trading', '/api/trading/'], tradingRouter(supabase));
app.use(['/api/debug', '/api/debug/'], diagnosticRouter(supabase, isSupabaseConfigured, lastPriceUpdate));

// Production/Development Server Start
async function setupVite(app: express.Application) {
  if (process.env.NODE_ENV !== "production") {
    console.log('[Server] Setting up Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware attached');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`[Server] Serving static files from: ${distPath}`);
    
    // التحقق من وجود الملفات
    import fs from 'fs';
    if (fs.existsSync(distPath)) {
      console.log(`[Server] dist directory exists. Contents:`, fs.readdirSync(distPath));
    } else {
      console.error(`[Server] ERROR: dist directory does not exist at ${distPath}`);
    }

    app.use((req, res, next) => {
      if (req.url.startsWith('/assets/')) {
        console.log(`[Server] Request for asset: ${req.url}`);
      }
      next();
    });
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, path) => {
        if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
      }
    }));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Initialize
const startServer = async () => {
  try {
    console.log('[Server] Starting initialization...');
    
    // Setup Vite/Static first so the server is ready to serve
    await setupVite(app);

    const PORT = Number(process.env.PORT) || 3000;
    httpServer.listen(PORT, "0.0.0.0", async () => {
      console.log(`[Server] ✅ Express server listening on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
      
      // Small delay before starting background engines to ensure server stability
      console.log('[Server] Waiting 2s before starting background engines...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { priceChannel: channel } = getAbly();
      
      if (isSupabaseConfigured) {
        console.log('[Server] Supabase configured, seeding assets...');
        seedAssets(supabase).catch(err => console.error('[Seed] Failed:', err));
        runGhostEngine(supabase, isSupabaseConfigured);
        runStopOutEngine(supabase);
      } else {
        console.warn('[Server] Supabase not configured, skipping seed and ghost engine');
      }

      if (channel) {
        runPriceFeed(channel, latestPrices);
      } else {
        console.warn('[Server] Price feed skipped: Ably channel not available');
      }
    });
  } catch (err) {
    console.error('[Server] Critical startup error:', err);
    // Even if background tasks fail, try to start the server
    const PORT = Number(process.env.PORT) || 3000;
    if (!httpServer.listening) {
      httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`[Server] ⚠️ Started in emergency mode on http://0.0.0.0:${PORT}`);
      });
    }
  }
};

startServer();
