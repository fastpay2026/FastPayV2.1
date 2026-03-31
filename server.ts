import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import Ably from 'ably';
import { handleAblyAuth } from './services/ably-auth-service';
import { marketRouter } from './routes/market-api';
import { tradingRouter } from './routes/trading-api';
import { diagnosticRouter } from './routes/diagnostic-api';
import { seedAssets } from './services/database-seeder';
import { runPriceFeed } from './services/price-feed-engine';
import { runGhostEngine } from './services/ghost-trader-engine';
import { runStopOutEngine } from './services/stop-out-engine';

const app = express();
const distPath = path.resolve(process.cwd(), 'dist');

console.log(`[Server] 📂 Current Directory: ${process.cwd()}`);
console.log(`[Server] 📂 Dist Path: ${distPath}`);
console.log(`[Server] 🌍 NODE_ENV: ${process.env.NODE_ENV}`);

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder.supabase.co'));

// Ably Setup
let ably: Ably.Realtime | null = null;
let priceChannel: any = null;
const getAbly = () => {
  const key = process.env.ABLY_API_KEY || process.env.VITE_ABLY_API_KEY || '';
  if (!key) return { ably: null, priceChannel: null };
  if (!ably) {
    ably = new Ably.Realtime({ key });
    priceChannel = ably.channels.get('market-data');
  }
  return { ably, priceChannel };
};

// API Routes
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/ably/auth', handleAblyAuth);
app.use(['/api/market', '/api/market/'], marketRouter(supabase));
app.use(['/api/trading', '/api/trading/'], tradingRouter(supabase));
app.use(['/api/debug', '/api/debug/'], diagnosticRouter(supabase, isSupabaseConfigured, { timestamp: Date.now() }));

// Static files and SPA
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files with index.html as fallback
  app.use(express.static(distPath));
  app.get('(.*)', (req, res) => {
    if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

console.log(`[Server] 🚀 Starting server on port ${PORT}...`);

httpServer.listen(Number(PORT), "0.0.0.0", async () => {
  console.log(`[Server] ✅ Listening on http://0.0.0.0:${PORT}`);
  console.log(`[Server] 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Background engines
  if (isSupabaseConfigured) {
    seedAssets(supabase).catch(console.error);
    runGhostEngine(supabase, isSupabaseConfigured);
    runStopOutEngine(supabase);
  }
  const { priceChannel: channel } = getAbly();
  if (channel) runPriceFeed(channel, {});
});
