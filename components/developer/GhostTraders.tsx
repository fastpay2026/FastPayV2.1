import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const GhostTraders: React.FC = () => {
  const [bots, setBots] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [categorySettings, setCategorySettings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBots();
    fetchTrades();
    fetchSettings();
    fetchAssets();
    
    // ... rest of useEffect
    const botChannel = supabase.channel('bot_instances_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bot_instances' }, fetchBots).subscribe();
    const tradeChannel = supabase.channel('bot_trades_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bot_trades_simulation' }, fetchTrades).subscribe();
    const settingsChannel = supabase.channel('bot_settings_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bot_category_settings' }, fetchSettings).subscribe();
    const assetChannel = supabase.channel('asset_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'trade_assets' }, fetchAssets).subscribe();

    return () => {
      supabase.removeChannel(botChannel);
      supabase.removeChannel(tradeChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(assetChannel);
    };
  }, []);

  const fetchAssets = async () => {
    const { data } = await supabase.from('trade_assets').select('symbol');
    if (data) setAssets(data);
  };

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase.from('bot_instances').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBots(data || []);
    } catch (err: any) {
      console.error('Fetch Bots Error:', err.message);
    }
  };

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase.from('bot_trades_simulation').select('*').eq('status', 'open');
      if (error) throw error;
      setTrades(data || []);
    } catch (err: any) {
      console.error('Fetch Trades Error:', err.message);
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('bot_category_settings').select('*');
    if (data) setCategorySettings(data);
  };

  const updateBot = async (id: string, updates: any) => {
    await supabase.from('bot_instances').update(updates).eq('id', id);
    fetchBots();
  };

  const updateCategorySetting = async (category: string, updates: any) => {
    await supabase.from('bot_category_settings').update(updates).eq('category', category);
  };

  const addBot = async () => {
    setLoading(true);
    await supabase.from('bot_instances').insert({ 
      name: 'New Bot', 
      strategy: 'scalper', 
      mode: 'manual', 
      fixed_amount: 10, 
      is_active: true 
    });
    await fetchBots();
    setLoading(false);
  };

  const deleteBot = async (id: string) => {
    setLoading(true);
    const botToDelete = bots.find(b => b.id === id);
    
    // إغلاق صفقات هذا البوت أولاً
    await supabase.from('bot_trades_simulation').delete().eq('bot_id', id);
    
    if (botToDelete) {
      await supabase.from('trade_orders').delete().eq('username', botToDelete.name).eq('is_bot', true);
    }
    
    // حذف البوت
    await supabase.from('bot_instances').delete().eq('id', id);
    await fetchBots();
    await fetchTrades();
    setLoading(false);
  };

  const purgeAll = async () => {
    if (window.confirm('⚠️ تحذير نهائي: سيتم مسح كل شيء الآن. هل أنت متأكد؟')) {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/purge-bots', { method: 'POST' });
        if (!response.ok) throw new Error('Server failed to purge data');
        
        await fetchBots();
        await fetchTrades();
        alert('تم التطهير الشامل بنجاح وإغلاق كافة الصفقات');
      } catch (err: any) {
        console.error('Purge error:', err.message);
        alert('حدث خطأ أثناء التطهير: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const triggerManualTrade = async (bot: any) => {
    try {
      setLoading(true);
      const symbol = bot.trade_symbol || 'BTCUSDT';
      const amount = bot.fixed_amount || 10;
      
      const { error: simError } = await supabase.from('bot_trades_simulation').insert({
        bot_id: bot.id, 
        symbol: symbol, 
        type: Math.random() > 0.5 ? 'buy' : 'sell', 
        amount: amount, 
        price: 95000 + (Math.random() * 100), 
        status: 'open'
      });
      
      if (simError) throw simError;

      const { error: orderError } = await supabase.from('trade_orders').insert({
        user_id: null,
        username: bot.name,
        asset_symbol: symbol,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        amount: amount,
        entry_price: 95000 + (Math.random() * 100),
        status: 'open',
        is_bot: true,
        timestamp: new Date().toISOString()
      });

      if (orderError) throw orderError;
      
      await fetchTrades();
      alert(`✅ تم فتح صفقة يدوية بنجاح على ${symbol}! ستظهر في المنصة الآن.`);
    } catch (err: any) {
      alert('❌ فشل فتح الصفقة: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#131722] rounded-2xl border border-white/10 space-y-8 shadow-2xl">
      {/* Header & Global Actions */}
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">مركز التحكم الذكي (Ghost Engine v2)</h2>
            <p className="text-xs text-slate-500 font-medium">نظام محاكاة التداول البشري المتطور</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            disabled={loading}
            onClick={purgeAll} 
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl font-bold border border-red-500/20 transition-all text-sm flex items-center gap-2"
          >
            🗑️ تطهير شامل
          </button>
          <button 
            disabled={loading}
            onClick={addBot} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            <span className="text-lg">+</span> إضافة بوت جديد
          </button>
        </div>
      </div>

      {/* Category Programming Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categorySettings.map(set => (
          <div key={set.category} className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4 hover:border-sky-500/30 transition-all">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-widest">{set.category}</h3>
              <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Min (m)</label>
                <input type="number" value={set.min_duration_minutes} onChange={e => updateCategorySetting(set.category, { min_duration_minutes: parseInt(e.target.value) })} className="bg-black/50 text-white p-2 rounded-lg w-full text-xs border border-white/5 focus:border-sky-500/50 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Max (m)</label>
                <input type="number" value={set.max_duration_minutes} onChange={e => updateCategorySetting(set.category, { max_duration_minutes: parseInt(e.target.value) })} className="bg-black/50 text-white p-2 rounded-lg w-full text-xs border border-white/5 focus:border-sky-500/50 outline-none" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bots.map(bot => (
          <div key={bot.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-6 hover:bg-white/[0.07] transition-all group">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Bot Identity</label>
              <input 
                defaultValue={bot.name} 
                onBlur={e => updateBot(bot.id, { name: e.target.value })} 
                className="bg-black/40 p-2.5 rounded-xl text-white font-bold border border-white/10 focus:border-emerald-500/50 outline-none transition-all" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Asset</label>
              <select 
                value={bot.trade_symbol || 'BTCUSDT'} 
                onChange={e => updateBot(bot.id, { trade_symbol: e.target.value })} 
                className="bg-black/40 p-2.5 rounded-xl text-white font-bold border border-white/10 focus:border-emerald-500/50 outline-none transition-all w-24" 
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Amount</label>
              <input 
                type="number"
                defaultValue={bot.fixed_amount || 10} 
                onBlur={e => updateBot(bot.id, { fixed_amount: parseFloat(e.target.value) })} 
                className="bg-black/40 p-2.5 rounded-xl text-white font-bold border border-white/10 focus:border-emerald-500/50 outline-none transition-all w-20" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Start/End Time</label>
              <div className="flex gap-1">
                <input 
                  type="time"
                  defaultValue={bot.start_time} 
                  onBlur={e => updateBot(bot.id, { start_time: e.target.value })} 
                  className="bg-black/40 p-2.5 rounded-xl text-white font-bold border border-white/10 focus:border-emerald-500/50 outline-none transition-all w-24" 
                />
                <input 
                  type="time"
                  defaultValue={bot.end_time} 
                  onBlur={e => updateBot(bot.id, { end_time: e.target.value })} 
                  className="bg-black/40 p-2.5 rounded-xl text-white font-bold border border-white/10 focus:border-emerald-500/50 outline-none transition-all w-24" 
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Strategy</label>
              <select 
                value={bot.strategy} 
                onChange={e => updateBot(bot.id, { strategy: e.target.value })} 
                className="bg-black/40 p-2.5 rounded-xl text-white text-xs font-bold border border-white/10 outline-none"
              >
                <option value="scalper">Scalper</option>
                <option value="day">Day</option>
                <option value="swing">Swing</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Control Mode</label>
              <div className="flex bg-black/60 rounded-xl p-1 border border-white/5">
                <button 
                  onClick={() => updateBot(bot.id, { mode: 'manual' })} 
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${bot.mode === 'manual' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  MANUAL
                </button>
                <button 
                  onClick={() => updateBot(bot.id, { mode: 'auto' })} 
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${bot.mode === 'auto' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  AUTO
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              {bot.mode === 'manual' && (
                <button 
                  onClick={() => triggerManualTrade(bot)} 
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-sky-900/20"
                >
                  OPEN TRADE
                </button>
              )}
              <button 
                onClick={() => deleteBot(bot.id)} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
          <span className="text-emerald-500 font-black text-sm uppercase tracking-widest">إجمالي الصفقات النشطة في المنصة حالياً:</span>
        </div>
        <span className="text-4xl font-black text-white tabular-nums">{trades.length}</span>
      </div>
    </div>
  );
};

export default GhostTraders;
