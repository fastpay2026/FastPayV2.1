import React, { useState, useEffect } from 'react';
import TradingViewChart from './components/TradingViewChart';
import { LayoutDashboard, BarChart3, ListChecks, Settings, Bell } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { User } from '../../../types';

interface TradingPlatformProps {
  user: User;
}

const TradingPlatform: React.FC<TradingPlatformProps> = ({ user }) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [volume, setVolume] = useState(0.1);
  const [balance, setBalance] = useState({ balance: 31820, equity: 31820, margin: 0, freeMargin: 31820 });
  const [positions, setPositions] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({ BTCUSDT: 0, ETHUSDT: 0, SOLUSDT: 0 });
  const [priceColor, setPriceColor] = useState('text-white');
  const [prevPrice, setPrevPrice] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchWallet();
    fetchPositions();

    // WebSocket Connection
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newPrice = parseFloat(data.c);
      setPrices(prev => {
        const oldPrice = prev[data.s] || 0;
        setPrevPrice(oldPrice);
        setPriceColor(newPrice > oldPrice ? 'text-emerald-400' : newPrice < oldPrice ? 'text-red-400' : 'text-white');
        return { ...prev, [data.s]: newPrice };
      });
    };

    const channel = supabase
      .channel('realtime_trading')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, fetchWallet)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_positions' }, fetchPositions)
      .subscribe();

    return () => {
      ws.close();
      supabase.removeChannel(channel);
    };
  }, [user]);

  const currentPrice = prices[symbol] || 0;

  const fetchWallet = async () => {
    let { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
    if (walletData) {
      setBalance({ balance: walletData.balance || 0, equity: walletData.equity || 0, margin: walletData.margin || 0, freeMargin: walletData.free_margin || 0 });
    } else {
      let { data: userData } = await supabase.from('users').select('balance').eq('id', user.id).single();
      setBalance({ balance: userData?.balance || 0, equity: userData?.balance || 0, margin: 0, freeMargin: userData?.balance || 0 });
    }
  };

  const fetchPositions = async () => {
    const { data } = await supabase.from('trade_orders').select('*').eq('user_id', user.id).eq('status', 'open');
    if (data) setPositions(data);
  };

  const handleTrade = async (type: 'Buy' | 'Sell') => {
    if (isNaN(volume) || volume <= 0) { alert("يرجى إدخال كمية صحيحة!"); return; }
    const price = currentPrice;
    const marginRequired = (volume * price) / 100;
    if (balance.freeMargin < marginRequired) { alert("الرصيد غير كافٍ!"); return; }

    const { data: pos, error: posError } = await supabase.from('trade_orders').insert({
      user_id: user.id, username: user.username, asset_symbol: symbol, type: type.toLowerCase(), amount: volume, entry_price: price, status: 'open'
    }).select().single();

    if (!posError) {
      await supabase.from('wallets').update({ free_margin: balance.freeMargin - marginRequired, margin: balance.margin + marginRequired }).eq('user_id', user.id);
      await supabase.from('users').update({ balance: user.balance - marginRequired }).eq('id', user.id);
      alert("تم تنفيذ الصفقة!");
    } else {
      console.error(posError);
      alert("حدث خطأ أثناء تنفيذ الصفقة!");
    }
  };

  const closePosition = async (position: any) => {
    try {
      // 1. Update position status to CLOSED in Supabase
      const { error: posError } = await supabase
        .from('trade_orders')
        .update({ status: 'closed_profit' })
        .eq('id', position.id);

      if (posError) throw posError;

      // 2. Update user balance in Supabase
      const marginToReturn = (position.volume * position.entry_price) / 100;
      const profit = position.profit || 0;
      
      const { error: userError } = await supabase
        .from('users')
        .update({ balance: balance.balance + profit })
        .eq('id', user.id);
        
      if (userError) throw userError;

      // 3. Update wallet in Supabase
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          free_margin: balance.freeMargin + marginToReturn + profit, 
          margin: balance.margin - marginToReturn 
        })
        .eq('user_id', user.id);
        
      if (walletError) throw walletError;

      // 4. Update UI immediately
      setPositions(prev => prev.filter(p => p.id !== position.id));
      setBalance(prev => ({ 
        ...prev, 
        balance: prev.balance + profit,
        freeMargin: prev.freeMargin + marginToReturn + profit,
        margin: prev.margin - marginToReturn
      }));
      
      alert("تم إغلاق الصفقة بنجاح!");
    } catch (error) {
      console.error('Error closing order:', error);
      alert("حدث خطأ أثناء إغلاق الصفقة!");
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      <div className="w-64 bg-[#131722] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 font-bold text-white flex items-center gap-2"><BarChart3 size={20} /> Market Watch</div>
        <div className="flex-1 overflow-y-auto">
          {['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].map(s => (
            <button key={s} onClick={() => setSymbol(s)} className={`w-full p-4 text-left border-b border-white/5 ${symbol === s ? 'bg-sky-900/30 text-sky-400' : 'hover:bg-white/5'}`}>
              {s} <span className="float-right font-mono">{prices[s]?.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-[#131722] border-b border-white/10 flex items-center px-4 gap-4">
          <LayoutDashboard size={20} className="text-sky-400" />
          <div className="flex-1 text-xs font-mono overflow-hidden whitespace-nowrap">
            {Object.entries(prices).map(([s, p]) => <span key={s} className="mx-4">{s}: {(p as number).toFixed(2)}</span>)}
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-2"><TradingViewChart symbol={`BINANCE:${symbol}`} /></div>
          <div className="w-48 bg-[#131722] border-l border-white/10 p-4 flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm">Order: {symbol.split(':')[1]}</h3>
            <div className={`text-2xl font-bold ${priceColor}`}>{currentPrice.toFixed(2)}</div>
            <input type="number" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value) || 0)} className="bg-[#1e2329] text-white p-2 rounded text-sm w-full" />
            <button onClick={() => handleTrade('Buy')} className="w-full bg-emerald-600 text-white py-1.5 rounded text-sm font-bold">BUY</button>
            <button onClick={() => handleTrade('Sell')} className="w-full bg-red-600 text-white py-1.5 rounded text-sm font-bold">SELL</button>
          </div>
        </div>
        <div className="h-10 bg-[#1e2329] border-t border-white/10 flex items-center px-4 gap-6 text-xs font-mono">
          <span>Balance: ${balance.balance.toFixed(2)}</span>
          <span>Free Margin: ${balance.freeMargin.toFixed(2)}</span>
        </div>
        <div className="h-48 bg-[#131722] border-t border-white/10 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
              <tr><th className="p-2">Symbol</th><th className="p-2">Type</th><th className="p-2">Volume</th><th className="p-2">Profit</th><th className="p-2">Action</th></tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="p-2">{p.asset_symbol}</td>
                  <td className={p.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}>{p.type}</td>
                  <td className="p-2">{p.amount}</td>
                  <td className="text-slate-400">0.00</td>
                  <td className="p-2"><button onClick={() => closePosition(p)} className="bg-red-900/50 text-red-200 px-2 py-1 rounded">Close</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default TradingPlatform;
