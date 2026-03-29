import { SupabaseClient } from '@supabase/supabase-js';

export const purgeBots = async (supabase: SupabaseClient) => {
  console.log('[Purge] Cleaning up simulation data...');
  try {
    await supabase.from('bot_trades_simulation').delete().neq('id', 0);
    await supabase.from('trade_orders').delete().is('user_id', null);
    console.log('[Purge] Simulation data cleared.');
  } catch (e: any) {
    console.error('[Purge] Error:', e.message);
  }
};

export const runGhostEngine = async (supabase: SupabaseClient, isSupabaseConfigured: boolean) => {
  console.log('[Ghost Engine] Background process started.');

  setInterval(async () => {
    try {
      if (!isSupabaseConfigured) return;

      const { data: bots } = await supabase.from('bot_instances').select('*');
      const { data: assets } = await supabase.from('trade_assets').select('*').eq('is_frozen', false);

      if (bots && bots.length > 0 && assets && assets.length > 0) {
        for (const bot of bots) {
          const { data: openTrades } = await supabase
            .from('bot_trades_simulation')
            .select('*')
            .eq('bot_id', bot.id)
            .eq('status', 'open');

          if (openTrades) {
            for (const trade of openTrades) {
              const startTime = new Date(trade.created_at).getTime();
              const now = new Date().getTime();
              const durationMinutes = (now - startTime) / (1000 * 60);

              if (durationMinutes >= (trade.target_duration || 5)) {
                await supabase.from('bot_trades_simulation').update({
                  status: Math.random() > 0.4 ? 'closed_profit' : 'closed_loss',
                  closed_at: new Date().toISOString()
                }).eq('id', trade.id);

                await supabase.from('trade_orders')
                  .update({ status: 'closed_profit', closed_at: new Date().toISOString() })
                  .eq('asset_symbol', trade.symbol)
                  .eq('username', bot.name)
                  .eq('status', 'open');
              }
            }
          }

          if (bot.mode === 'auto') {
            const { count } = await supabase
              .from('bot_trades_simulation')
              .select('*', { count: 'exact', head: true })
              .eq('bot_id', bot.id)
              .eq('status', 'open');

            if (!count || count < 1) {
              const randomAsset = assets[Math.floor(Math.random() * assets.length)];

              await supabase.from('bot_trades_simulation').insert({
                bot_id: bot.id,
                symbol: randomAsset.symbol,
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                amount: bot.fixed_amount || 100,
                price: randomAsset.price,
                status: 'open'
              });

              await supabase.from('trade_orders').insert({
                user_id: null,
                username: bot.name,
                asset_symbol: randomAsset.symbol,
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                amount: bot.fixed_amount || 100,
                entry_price: randomAsset.price,
                status: 'open',
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.error('[Ghost Engine] Error:', e.message);
    }
  }, 10000);
};
