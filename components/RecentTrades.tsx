import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { TradeOrder } from '../types';

const maskUsername = (username: string) => {
  if (username === 'ghost_trader') return 'G***r';
  if (username.length <= 2) return username + '***';
  return username.substring(0, 1) + '***' + username.substring(username.length - 1);
};

const RecentTrades: React.FC = () => {
  const [trades, setTrades] = useState<TradeOrder[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from('trade_orders')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      if (data) setTrades(data);
    };

    fetchTrades();

    const channel = supabase
      .channel('trade_orders_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trade_orders' }, (payload) => {
        setTrades(prev => [payload.new as TradeOrder, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl">
      <h3 className="text-xl font-black mb-4">آخر الصفقات</h3>
      <div className="space-y-2">
        {trades.map(trade => (
          <div key={trade.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
            <span className="font-bold">{maskUsername(trade.username || trade.userId || 'User')}</span>
            <span className={`font-black ${trade.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{trade.type === 'buy' ? 'BUY' : 'SELL'}</span>
            <span className="font-mono">${trade.amount.toLocaleString()}</span>
            <span className="text-slate-500">{new Date(trade.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;
