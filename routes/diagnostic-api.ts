import { Router } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export const diagnosticRouter = (supabase: SupabaseClient, isSupabaseConfigured: boolean, lastPriceUpdate: any) => {
  const router = Router();

  router.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', connected: true });
  });

  router.get('/debug/price-feed', (req, res) => {
    res.json({
      ...lastPriceUpdate,
      supabaseConfigured: isSupabaseConfigured,
      tiingoKeyPresent: Boolean(process.env.TIINGO_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  router.get('/debug/ghost-traders', async (req, res) => {
    try {
      const { data: config } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').maybeSingle();
      const { data: openBotTrades } = await supabase
        .from('trade_orders')
        .select('id, user_id, username, bot_category')
        .eq('status', 'open');

      const { data: allBots } = await supabase.from('users').select('id, username');

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

  router.post('/admin/purge-bots', async (req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    try {
      console.log('[Purge] API: Cleaning up fake bots and simulation data...');
      await supabase.from('bot_trades_simulation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bot_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('[Purge] API: Cleanup complete.');
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Purge] API: Cleanup failed:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
