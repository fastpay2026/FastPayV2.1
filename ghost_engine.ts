import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // مفتاح الصلاحيات الكاملة
);

const runGhostEngine = async () => {
  console.log('[Ghost Engine] Started.');
  
  while (true) {
    try {
      // 1. جلب البوتات النشطة
      const { data: bots } = await supabase
        .from('bot_instances')
        .select('*')
        .eq('is_active', true);

      if (bots) {
        for (const bot of bots) {
          if (bot.mode === 'auto') {
            // منطق فتح الصفقات التلقائي بناءً على الاستراتيجية ونسبة النجاح
            await executeSimulatedTrade(bot);
          }
        }
      }
    } catch (e) {
      console.error('[Ghost Engine] Error:', e);
    }
    
    // الانتظار قبل الدورة القادمة
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

async function executeSimulatedTrade(bot: any) {
  // منطق محاكاة الصفقة مع نسبة النجاح
  const isWin = Math.random() < bot.win_rate;
  
  await supabase.from('bot_trades_simulation').insert({
    bot_id: bot.id,
    symbol: 'BTCUSDT',
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    amount: bot.fixed_amount,
    price: 95000, // سعر افتراضي
    status: isWin ? 'closed_profit' : 'closed_loss'
  });
}

runGhostEngine();
