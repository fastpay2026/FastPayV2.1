import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User } from '../../types';
import { supabaseService } from '../../supabaseService';

const GhostTraders: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [tradesPerHour, setTradesPerHour] = useState(5);
  const [botUsers, setBotUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase.from('bot_config').select('*').eq('key', 'ghost_traders').single();
      if (data) {
        setIsEnabled(data.is_enabled);
        setTradesPerHour(data.trades_per_hour);
      }
      const users = await supabaseService.getUsers();
      setBotUsers(users.filter(u => u.isBot));
    };
    loadConfig();
  }, []);

  const toggleBot = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    await supabase.from('bot_config').upsert({ key: 'ghost_traders', is_enabled: newState, trades_per_hour: tradesPerHour });
    alert(`تم ${newState ? 'تفعيل' : 'إيقاف'} البوتات الوهمية`);
  };

  const updateFrequency = async (freq: number) => {
    setTradesPerHour(freq);
    await supabase.from('bot_config').upsert({ key: 'ghost_traders', is_enabled: isEnabled, trades_per_hour: freq });
  };

  const disableBot = async (user: User) => {
    await supabaseService.updateUser({ ...user, isBot: false });
    setBotUsers(prev => prev.filter(u => u.id !== user.id));
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
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">البوتات المفعلة:</h3>
        <div className="space-y-2">
          {botUsers.map(user => (
            <div key={user.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <span className="text-white">{user.username}</span>
              <button 
                onClick={() => disableBot(user)}
                className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
              >
                إلغاء التفعيل
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GhostTraders;
