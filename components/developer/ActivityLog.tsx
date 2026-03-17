import React, { useEffect, useState } from 'react';
import { Transaction, TradeOrder } from '../../types';
import { supabase } from '../../supabaseClient';

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      // Fetch transactions
      const { data: transactions } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false }).limit(20);
      // Fetch non-bot trades
      const { data: trades } = await supabase.from('trade_orders').select('*').eq('is_bot', false).order('timestamp', { ascending: false }).limit(20);

      const combined = [
        ...(transactions || []).map(t => ({ ...t, type: 'transaction' })),
        ...(trades || []).map(t => ({ ...t, type: 'trade' }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(combined);
    };

    fetchActivities();
  }, []);

  return (
    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black mb-6">Activity Log</h2>
      <div className="space-y-4">
        {activities.map(act => (
          <div key={act.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <p className="font-bold">{act.type === 'transaction' ? act.notes : `${act.type} ${act.asset_symbol}`}</p>
              <p className="text-xs text-slate-500">{new Date(act.timestamp).toLocaleString()}</p>
            </div>
            <span className={`font-black ${act.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {act.amount > 0 ? '+' : ''}{act.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
