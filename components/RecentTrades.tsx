import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { TradeOrder } from '../types';

const maskUsername = (username: string) => {
  if (!username) return 'User***';
  if (username.length <= 2) return username + '***';
  return username.substring(0, 2) + '****';
};

const RecentTrades: React.FC = () => {
  const [trades, setTrades] = useState<TradeOrder[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      const { data: humanTrades } = await supabase
        .from('trade_orders')
        .select('*')
        .eq('status', 'open')
        .order('timestamp', { ascending: false })
        .limit(10);

      const { data: botTrades } = await supabase
        .from('bot_trades_simulation')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      const mappedBotTrades: TradeOrder[] = (botTrades || []).map(t => ({
        id: t.id,
        userId: t.bot_id,
        username: `Bot ${t.bot_id.substring(0, 4)}`,
        assetSymbol: t.symbol,
        amount: t.amount,
        entryPrice: t.price,
        type: t.type,
        status: 'open',
        timestamp: t.created_at
      }));

      const allTrades = [...(humanTrades || []), ...mappedBotTrades]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      
      setTrades(allTrades);
    };

    fetchTrades();

    const humanChannel = supabase
      .channel('trade_orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTrade = payload.new as TradeOrder;
          if (newTrade.status === 'open') {
            setTrades(prev => [newTrade, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10));
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTrade = payload.new as TradeOrder;
          if (updatedTrade.status !== 'open') {
            setTrades(prev => prev.filter(t => t.id !== updatedTrade.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setTrades(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    const botChannel = supabase
      .channel('bot_trades_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_trades_simulation' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const t = payload.new;
          const newTrade: TradeOrder = {
            id: t.id,
            userId: t.bot_id,
            username: `Bot ${t.bot_id.substring(0, 4)}`,
            assetSymbol: t.symbol,
            amount: t.amount,
            entryPrice: t.price,
            type: t.type,
            status: 'open',
            timestamp: t.created_at
          };
          if (newTrade.status === 'open') {
            setTrades(prev => [newTrade, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10));
          }
        } else if (payload.eventType === 'UPDATE') {
          const t = payload.new;
          if (t.status !== 'open') {
            setTrades(prev => prev.filter(trade => trade.id !== t.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setTrades(prev => prev.filter(trade => trade.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(humanChannel);
      supabase.removeChannel(botChannel);
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
