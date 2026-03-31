import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer } from 'http';

const app = express();
// Ensure dist path is correct for Render environment
const distPath = path.resolve(process.cwd(), 'dist');

console.log(`[Server] Serving static files from: ${distPath}`);

// Serve static files
app.use(express.static(distPath, {
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  }
}));

// SPA Catch-all route
app.use((req, res, next) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/assets/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[Server] ✅ Express server listening on http://0.0.0.0:${PORT}`);
});
