import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const runGhostEngine = async () => {
  console.log('[Ghost Engine] Started exclusively with bot_instances.');
  
  while (true) {
    try {
      // 1. جلب البوتات النشطة فقط
      const { data: bots } = await supabase
        .from('bot_instances')
        .select('*')
        .eq('is_active', true);

      if (bots) {
        for (const bot of bots) {
          if (bot.mode === 'auto') {
            // تنفيذ صفقة بناءً على إعدادات البوت
            await executeSimulatedTrade(bot);
          }
        }
      }
    } catch (e) {
      console.error('[Ghost Engine] Error:', e);
    }
    
    // الانتظار 3 ثوانٍ كما طلبت
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
};

async function executeSimulatedTrade(bot: any) {
  const isWin = Math.random() < bot.win_rate;
  
  // إدراج الصفقة باسم البوت مباشرة
  await supabase.from('bot_trades_simulation').insert({
    bot_id: bot.id,
    symbol: 'BTCUSDT',
    type: Math.random() > 0.5 ? 'buy' : 'sell',
    amount: bot.fixed_amount,
    price: 95000,
    status: 'open'
  });
  console.log(`[Ghost Engine] Trade opened for bot: ${bot.name}`);
}

runGhostEngine();
