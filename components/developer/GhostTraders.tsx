import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const GhostTraders: React.FC = () => {
  const [bots, setBots] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [categorySettings, setCategorySettings] = useState<any[]>([]);

  useEffect(() => {
    fetchBots();
    fetchTrades();
    fetchSettings();

    const botChannel = supabase.channel('bot_instances_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bot_instances' }, fetchBots).subscribe();
    const tradeChannel = supabase.channel('bot_trades_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bot_trades_simulation' }, fetchTrades).subscribe();
    const settingsChannel = supabase.channel('bot_settings_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bot_category_settings' }, fetchSettings).subscribe();

    return () => {
      supabase.removeChannel(botChannel);
      supabase.removeChannel(tradeChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const fetchBots = async () => {
    const { data } = await supabase.from('bot_instances').select('*').order('created_at', { ascending: false });
    if (data) setBots(data);
  };

  const fetchTrades = async () => {
    const { data } = await supabase.from('bot_trades_simulation').select('*').eq('status', 'open');
    if (data) setTrades(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('bot_category_settings').select('*');
    if (data) setCategorySettings(data);
  };

  const updateBot = async (id: string, updates: any) => {
    await supabase.from('bot_instances').update(updates).eq('id', id);
  };

  const updateCategorySetting = async (category: string, updates: any) => {
    await supabase.from('bot_category_settings').update(updates).eq('category', category);
  };

  const addBot = async () => {
    await supabase.from('bot_instances').insert({ name: 'New Bot', strategy: 'scalper', mode: 'manual', fixed_amount: 10, is_active: true });
    fetchBots();
  };

  const purgeAll = async () => {
    if (window.confirm('⚠️ تحذير: سيتم حذف جميع البوتات وجميع صفقاتها من المنصة فوراً. هل أنت متأكد؟')) {
      await supabase.from('bot_trades_simulation').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bot_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      fetchBots();
      fetchTrades();
    }
  };

  const triggerManualTrade = async (bot: any) => {
    await supabase.from('bot_trades_simulation').insert({
      bot_id: bot.id, symbol: 'BTCUSDT', type: 'buy', amount: bot.fixed_amount, price: 95000, status: 'open', target_duration: 5
    });
  };

  return (
    <div className="p-6 bg-[#131722] rounded-2xl border border-white/10 space-y-8">
      {/* Header & Global Actions */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">مركز التحكم الذكي (Ghost Engine v2)</h2>
          <p className="text-xs text-slate-500">تحكم كامل في سلوك البوتات ومحاكاة التداول البشري</p>
        </div>
        <div className="flex gap-3">
          <button onClick={purgeAll} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl font-bold border border-red-500/20 transition-all text-sm">
            🗑️ تطهير شامل
          </button>
          <button onClick={addBot} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
            + إضافة بوت جديد
          </button>
        </div>
      </div>

      {/* Category Programming Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categorySettings.map(set => (
          <div key={set.category} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-sky-400 uppercase">{set.category} Settings</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">Min Duration (m)</label>
                <input type="number" value={set.min_duration_minutes} onChange={e => updateCategorySetting(set.category, { min_duration_minutes: parseInt(e.target.value) })} className="bg-black text-white p-1 rounded w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Max Duration (m)</label>
                <input type="number" value={set.max_duration_minutes} onChange={e => updateCategorySetting(set.category, { max_duration_minutes: parseInt(e.target.value) })} className="bg-black text-white p-1 rounded w-full text-xs" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bots.map(bot => (
          <div key={bot.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[9px] text-slate-500 uppercase">Bot Identity</label>
              <input defaultValue={bot.name} onBlur={e => updateBot(bot.id, { name: e.target.value })} className="bg-black p-2 rounded text-white font-bold border border-white/10" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 uppercase">Strategy</label>
              <select value={bot.strategy} onChange={e => updateBot(bot.id, { strategy: e.target.value })} className="bg-black p-2 rounded text-white text-xs">
                <option value="scalper">Scalper</option>
                <option value="day">Day</option>
                <option value="swing">Swing</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 uppercase">Mode</label>
              <div className="flex bg-black rounded-lg p-1">
                <button onClick={() => updateBot(bot.id, { mode: 'manual' })} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${bot.mode === 'manual' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Manual</button>
                <button onClick={() => updateBot(bot.id, { mode: 'auto' })} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${bot.mode === 'auto' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>Auto</button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {bot.mode === 'manual' && (
                <button onClick={() => triggerManualTrade(bot)} className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-lg text-xs font-bold">Open Trade</button>
              )}
              <button onClick={() => { if(window.confirm('حذف البوت؟')) { supabase.from('bot_instances').delete().eq('id', bot.id).then(fetchBots); } }} className="text-red-500 p-2">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center">
        <span className="text-emerald-500 font-bold">إجمالي الصفقات النشطة في المنصة:</span>
        <span className="text-2xl font-black text-white">{trades.length}</span>
      </div>
    </div>
  );
};

export default GhostTraders;
