import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const runGhostEngine = async () => {
  console.log('[Ghost Engine] Running with Human-like behavior.');
  
  while (true) {
    try {
      const { data: bots } = await supabase.from('bot_instances').select('*').eq('is_active', true);
      const { data: settings } = await supabase.from('bot_category_settings').select('*');
      const settingsMap = Object.fromEntries(settings?.map(s => [s.category, s]) || []);

      if (bots) {
        for (const bot of bots) {
          // 1. إغلاق الصفقات المنتهية
          await closeExpiredTrades(bot, settingsMap[bot.strategy]);

          // 2. فتح صفقات جديدة (فقط إذا كان في وضع Auto)
          if (bot.mode === 'auto') {
            await handleAutoTrade(bot, settingsMap[bot.strategy]);
          }
        }
      }
    } catch (e) {
      console.error('[Ghost Engine] Error:', e);
    }
    await new Promise(resolve => setTimeout(resolve, 10000)); // فحص كل 10 ثوانٍ
  }
};

async function closeExpiredTrades(bot: any, config: any) {
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

      // إذا تجاوزت الصفقة المدة العشوائية المحددة للفئة
      if (durationMinutes >= (trade.target_duration || 5)) {
        const isWin = Math.random() < (bot.win_rate || 0.5);
        await supabase.from('bot_trades_simulation').update({
          status: isWin ? 'closed_profit' : 'closed_loss',
          closed_at: new Date().toISOString()
        }).eq('id', trade.id);
        console.log(`[Ghost Engine] Closed trade for ${bot.name} (${isWin ? 'Profit' : 'Loss'})`);
      }
    }
  }
}

async function handleAutoTrade(bot: any, config: any) {
  // التأكد من عدم وجود صفقة مفتوحة حالياً
  const { count } = await supabase
    .from('bot_trades_simulation')
    .select('*', { count: 'exact', head: true })
    .eq('bot_id', bot.id)
    .eq('status', 'open');

  if (count === 0) {
    // حساب مدة الصفقة القادمة عشوائياً بناءً على إعدادات الفئة
    const minDur = config?.min_duration_minutes || 1;
    const maxDur = config?.max_duration_minutes || 5;
    const targetDuration = Math.floor(Math.random() * (maxDur - minDur + 1) + minDur);

    await supabase.from('bot_trades_simulation').insert({
      bot_id: bot.id,
      symbol: 'BTCUSDT',
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: bot.fixed_amount,
      price: 95000,
      status: 'open',
      target_duration: targetDuration // تخزين المدة المستهدفة
    });
    console.log(`[Ghost Engine] Auto-opened trade for ${bot.name} (Duration: ${targetDuration}m)`);
  }
}

runGhostEngine();
