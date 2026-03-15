import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, TradeOrder } from '../../types';
import { supabaseService } from '../../supabaseService';

const GhostTraders: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [tradesPerHour, setTradesPerHour] = useState(5);
  const [activeBotsCount, setActiveBotsCount] = useState(5);
  const [maxTrades15m, setMaxTrades15m] = useState(10);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [aggressiveness, setAggressiveness] = useState(1.0);
  const [openTrades, setOpenTrades] = useState<TradeOrder[]>([]);

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').single();
      if (data) {
        setIsEnabled(data.is_active);
        setTradesPerHour(data.trades_per_hour);
        setAggressiveness(data.aggressiveness || 1.0);
        setActiveBotsCount(data.active_bots_count || 5);
        setMaxTrades15m(data.max_trades_per_15m || 10);
      }
      const users = await supabaseService.getUsers();
      setAllUsers(users.filter(u => u.role === 'USER'));

      // Load open trades for stats
      const { data: trades } = await supabase.from('trade_orders').select('*').eq('status', 'open').eq('is_bot', true);
      if (trades) setOpenTrades(trades);
    };
    loadConfig();

    // Refresh stats every 30s
    const interval = setInterval(loadConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = async (updates: any) => {
    const { data: existing } = await supabase.from('bot_config').select('id').eq('key', 'ghost_traders').maybeSingle();
    if (existing) {
      await supabase.from('bot_config').update(updates).eq('id', existing.id);
    } else {
      await supabase.from('bot_config').insert({ key: 'ghost_traders', ...updates });
    }
  };

  const toggleBot = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    await updateConfig({ is_active: newState });
    alert(`تم ${newState ? 'تفعيل' : 'إيقاف'} البوتات الوهمية بنجاح`);
  };

  const toggleBotStatus = async (user: User) => {
    const updatedUser = { ...user, isBot: !user.isBot };
    await supabaseService.updateUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  const scalperCount = openTrades.filter(t => t.bot_category === 'scalper').length;
  const dayCount = openTrades.filter(t => t.bot_category === 'day').length;
  const swingCount = openTrades.filter(t => t.bot_category === 'swing').length;

  return (
    <div className="p-6 bg-[#131722] rounded-2xl border border-white/10 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">نظام المتداولين الوهميين (Ghost Traders)</h2>
        <div className="flex gap-4 text-[10px] font-mono">
          <div className="bg-emerald-900/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
            Scalpers: {scalperCount}
          </div>
          <div className="bg-sky-900/20 text-sky-400 px-2 py-1 rounded border border-sky-500/20">
            Day: {dayCount}
          </div>
          <div className="bg-amber-900/20 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
            Swing: {swingCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleBot} 
              className={`px-6 py-2 rounded-xl font-bold ${isEnabled ? 'bg-emerald-600' : 'bg-red-600'} text-white transition-all`}
            >
              {isEnabled ? 'إيقاف البوتات' : 'تشغيل البوتات'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">العدوانية (Aggressiveness): {aggressiveness}x</label>
            <input 
              type="range" 
              min="0.1" 
              max="5.0" 
              step="0.1"
              value={aggressiveness} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setAggressiveness(val);
                updateConfig({ aggressiveness: val });
              }}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <label className="text-[10px] text-slate-500 block mb-1">عدد البوتات النشطة</label>
            <input 
              type="number" 
              value={activeBotsCount} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setActiveBotsCount(val);
                updateConfig({ active_bots_count: val });
              }}
              className="bg-black text-white p-2 rounded w-full text-sm font-bold"
            />
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <label className="text-[10px] text-slate-500 block mb-1">أقصى صفقات / 15 دقيقة</label>
            <input 
              type="number" 
              value={maxTrades15m} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxTrades15m(val);
                updateConfig({ max_trades_per_15m: val });
              }}
              className="bg-black text-white p-2 rounded w-full text-sm font-bold"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
          إدارة البوتات الفردية
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {allUsers.map(user => (
            <div key={user.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
              <span className="text-xs text-white font-medium">{user.username}</span>
              <button 
                onClick={() => toggleBotStatus(user)}
                className={`${user.isBot ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20' : 'bg-slate-700'} text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-all`}
              >
                {user.isBot ? 'مفعل' : 'غير مفعل'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GhostTraders;
