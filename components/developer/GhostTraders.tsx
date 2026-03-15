import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User } from '../../types';
import { supabaseService } from '../../supabaseService';

const GhostTraders: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [tradesPerHour, setTradesPerHour] = useState(5);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [aggressiveness, setAggressiveness] = useState(1.0);

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').single();
      if (data) {
        setIsEnabled(data.is_active);
        setTradesPerHour(data.trades_per_hour);
        setAggressiveness(data.aggressiveness || 1.0);
      }
      const users = await supabaseService.getUsers();
      setAllUsers(users.filter(u => u.role === 'USER'));
    };
    loadConfig();
  }, []);

  const toggleBot = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    const { data: existing } = await supabase.from('bot_config').select('id').eq('key', 'ghost_traders').maybeSingle();
    
    if (existing) {
      await supabase.from('bot_config').update({ is_active: newState, trades_per_hour: tradesPerHour, aggressiveness }).eq('id', existing.id);
    } else {
      await supabase.from('bot_config').insert({ key: 'ghost_traders', is_active: newState, trades_per_hour: tradesPerHour, aggressiveness });
    }
    alert(`تم ${newState ? 'تفعيل' : 'إيقاف'} البوتات الوهمية بنجاح`);
  };

  const updateAggressiveness = async (val: number) => {
    setAggressiveness(val);
    const { data: existing } = await supabase.from('bot_config').select('id').eq('key', 'ghost_traders').maybeSingle();
    if (existing) {
      await supabase.from('bot_config').update({ aggressiveness: val }).eq('id', existing.id);
    }
  };

  const updateFrequency = async (freq: number) => {
    setTradesPerHour(freq);
    
    // البحث عن الإعداد الحالي
    const { data: existing } = await supabase.from('bot_config').select('id').eq('key', 'ghost_traders').maybeSingle();
    
    if (existing) {
      await supabase.from('bot_config').update({ is_active: isEnabled, trades_per_hour: freq }).eq('id', existing.id);
    } else {
      await supabase.from('bot_config').insert({ key: 'ghost_traders', is_active: isEnabled, trades_per_hour: freq });
    }
  };

  const toggleBotStatus = async (user: User) => {
    const updatedUser = { ...user, isBot: !user.isBot };
    await supabaseService.updateUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  return (
    <div className="p-6 bg-[#131722] rounded-2xl border border-white/10 space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">نظام المتداولين الوهميين (Ghost Traders)</h2>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleBot} 
          className={`px-6 py-2 rounded-xl font-bold ${isEnabled ? 'bg-emerald-600' : 'bg-red-600'} text-white`}
        >
          {isEnabled ? 'إيقاف البوتات' : 'تشغيل البوتات'}
        </button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">الصفقات في الساعة:</label>
          <input 
            type="number" 
            value={tradesPerHour} 
            onChange={(e) => updateFrequency(Number(e.target.value))}
            className="bg-black text-white p-2 rounded w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">العدوانية (Aggressiveness):</label>
          <input 
            type="range" 
            min="0.1" 
            max="5.0" 
            step="0.1"
            value={aggressiveness} 
            onChange={(e) => updateAggressiveness(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-white font-mono text-xs">{aggressiveness}x</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">إدارة البوتات:</h3>
        <div className="space-y-2">
          {allUsers.map(user => (
            <div key={user.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <span className="text-white">{user.username}</span>
              <button 
                onClick={() => toggleBotStatus(user)}
                className={`${user.isBot ? 'bg-emerald-600' : 'bg-slate-600'} text-white px-3 py-1 rounded-lg text-xs`}
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
