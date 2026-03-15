import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const GhostTraders: React.FC = () => {
  const [bots, setBots] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    fetchBots();
    fetchTrades();

    // Real-time sync
    const botChannel = supabase
      .channel('bot_instances_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_instances' }, fetchBots)
      .subscribe();

    const tradeChannel = supabase
      .channel('bot_trades_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_trades_simulation' }, fetchTrades)
      .subscribe();

    return () => {
      supabase.removeChannel(botChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, []);

  const fetchBots = async () => {
    const { data } = await supabase.from('bot_instances').select('*');
    if (data) setBots(data);
  };

  const fetchTrades = async () => {
    const { data } = await supabase.from('bot_trades_simulation').select('*').eq('status', 'open');
    if (data) setTrades(data);
  };

  const updateBot = async (id: string, updates: any) => {
    await supabase.from('bot_instances').update(updates).eq('id', id);
  };

  const triggerManualTrade = async (bot: any) => {
    await supabase.from('bot_trades_simulation').insert({
      bot_id: bot.id,
      symbol: 'BTCUSDT',
      type: 'buy',
      amount: bot.fixed_amount,
      price: 95000,
      status: 'open'
    });
  };

  const addBot = async () => {
    const { error } = await supabase.from('bot_instances').insert({
      name: 'New Bot',
      strategy: 'scalper',
      mode: 'manual',
      fixed_amount: 10,
      is_active: true
    });
    if (error) alert('Error adding bot: ' + error.message);
    else fetchBots();
  };

  const deleteBot = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bot?')) {
      await supabase.from('bot_instances').delete().eq('id', id);
      fetchBots();
    }
  };

  return (
    <div className="p-6 bg-[#131722] rounded-2xl border border-white/10 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">مركز التحكم الذكي (Ghost Engine)</h2>
        <button onClick={addBot} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold transition-all">
          + إضافة بوت جديد
        </button>
      </div>
      
      <div className="space-y-4">
        {bots.map(bot => (
          <div key={bot.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500">اسم البوت</label>
              <input 
                defaultValue={bot.name} 
                onBlur={(e) => updateBot(bot.id, { name: e.target.value })}
                className="bg-black p-2 rounded text-white w-40 border border-white/10"
                placeholder="أدخل الاسم هنا"
              />
            </div>
            <select value={bot.strategy} onChange={(e) => updateBot(bot.id, { strategy: e.target.value })} className="bg-black p-2 rounded text-white">
              <option value="scalper">Scalper</option>
              <option value="day">Day</option>
              <option value="swing">Swing</option>
            </select>
            <input type="number" value={bot.fixed_amount} onChange={(e) => updateBot(bot.id, { fixed_amount: e.target.value })} className="bg-black p-2 rounded text-white w-20" />
            
            <button 
              onClick={() => updateBot(bot.id, { mode: bot.mode === 'auto' ? 'manual' : 'auto', is_active: true })}
              className={`p-2 rounded font-bold ${bot.mode === 'auto' ? 'bg-green-600' : 'bg-yellow-600'}`}
            >
              {bot.mode === 'auto' ? 'Auto' : 'Manual'}
            </button>

            {bot.mode === 'manual' && (
              <button onClick={() => triggerManualTrade(bot)} className="bg-blue-600 p-2 rounded font-bold">فتح صفقة الآن</button>
            )}
            
            <button onClick={() => deleteBot(bot.id)} className="bg-red-900/40 text-red-500 p-2 rounded hover:bg-red-900/60 transition-all">
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-400 mb-3">ملخص صفقات البوتات</h3>
        <div className="text-3xl font-black text-white">{trades.length} صفقات مفتوحة</div>
      </div>
    </div>
  );
};

export default GhostTraders;
