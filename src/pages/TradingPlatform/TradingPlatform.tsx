import React, { useState, useEffect } from 'react';
import TradingViewChart from './components/TradingViewChart';
import { LayoutDashboard, BarChart3, ListChecks, Settings, Bell } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { User } from '../../../types';

interface TradingPlatformProps {
  user: User;
}

const TradingPlatform: React.FC<TradingPlatformProps> = ({ user }) => {
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  const [volume, setVolume] = useState(0.1);
  const [balance, setBalance] = useState({ balance: 0, equity: 0, margin: 0, freeMargin: 0 });
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchWallet();
    fetchPositions();

    const channel = supabase
      .channel('realtime_trading')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, fetchWallet)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_positions' }, fetchPositions)
      .subscribe();

    // محاكاة تحديث السعر كل 3 ثوانٍ
    const priceInterval = setInterval(() => {
      setPositions(prev => prev.map(p => {
        const priceChange = (Math.random() - 0.5) * 100; // تغير عشوائي
        const newPrice = p.current_price + priceChange;
        const profit = (newPrice - p.entry_price) * p.volume * (p.type === 'Buy' ? 1 : -1);
        return { ...p, current_price: newPrice, profit };
      }));
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(priceInterval);
    };
  }, [user]);

  const fetchWallet = async () => {
    console.log("Fetching wallet for user:", user.id);
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
    
    if (error) {
      console.error("Error fetching wallet:", error);
      return;
    }
    
    if (data) {
      console.log("Wallet data fetched:", data);
      setBalance({ 
        balance: data.balance || 0, 
        equity: data.equity || 0, 
        margin: data.margin || 0, 
        freeMargin: data.free_margin || 0 
      });
    } else {
      console.log("No wallet found, creating default wallet for user");
      // إنشاء محفظة افتراضية برصيد 10,000
      const { data: newData, error: createError } = await supabase.from('wallets').insert({
        user_id: user.id,
        balance: 10000,
        equity: 10000,
        margin: 0,
        free_margin: 10000
      }).select().single();

      if (newData) {
        setBalance({ balance: 10000, equity: 10000, margin: 0, freeMargin: 10000 });
      }
    }
  };

  const fetchPositions = async () => {
    const { data } = await supabase.from('trading_positions').select('*').eq('user_id', user.id).eq('status', 'OPEN');
    if (data) setPositions(data);
  };

  const handleTrade = async (type: 'Buy' | 'Sell') => {
    if (isNaN(volume) || volume <= 0) {
      alert("يرجى إدخال كمية صحيحة!");
      return;
    }
    const price = 70500; // سعر تقريبي حالي
    const marginRequired = (volume * price) / 100; // رافعة 1:100

    if (balance.freeMargin < marginRequired) {
      alert("الرصيد غير كافٍ لفتح هذه الصفقة!");
      return;
    }

    // 1. إضافة الصفقة
    const { data: pos, error: posError } = await supabase.from('trading_positions').insert({
      user_id: user.id,
      symbol: symbol.split(':')[1],
      type,
      volume,
      entry_price: price,
      current_price: price,
      status: 'OPEN'
    }).select().single();

    if (posError) {
      alert("خطأ في فتح الصفقة: " + posError.message);
      return;
    }

    // 2. تحديث المحفظة (خصم الهامش)
    const { error: walletError } = await supabase.from('wallets').update({
      free_margin: balance.freeMargin - marginRequired,
      margin: balance.margin + marginRequired
    }).eq('user_id', user.id);

    // 3. تحديث رصيد المستخدم في جدول users
    const { error: userError } = await supabase.from('users').update({
      balance: user.balance - marginRequired
    }).eq('id', user.id);

    if (walletError || userError) {
      alert("خطأ في تحديث الرصيد: " + (walletError?.message || userError?.message));
    } else {
      alert("تم تنفيذ الصفقة بنجاح!");
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      {/* القائمة الجانبية للأدوات */}
      <div className="w-64 bg-[#131722] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 font-bold text-white flex items-center gap-2">
          <BarChart3 size={20} /> Market Watch
        </div>
        <div className="flex-1 overflow-y-auto">
          {['BTCUSDT', 'EURUSD', 'XAUUSD'].map(s => (
            <button 
              key={s} 
              onClick={() => setSymbol(`BINANCE:${s}`)}
              className={`w-full p-4 text-left border-b border-white/5 transition-colors ${symbol === `BINANCE:${s}` ? 'bg-sky-900/30 text-sky-400 border-l-4 border-l-sky-500' : 'hover:bg-white/5'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* الشارت في المنتصف */}
      <div className="flex-1 flex flex-col">
        {/* أيقونات MT5 */}
        <div className="h-12 bg-[#131722] border-b border-white/10 flex items-center px-4 gap-4">
          <LayoutDashboard size={20} className="text-sky-400" />
          <BarChart3 size={20} className="text-slate-400" />
          <ListChecks size={20} className="text-slate-400" />
          <div className="flex-1" />
          <Bell size={20} className="text-slate-400" />
          <Settings size={20} className="text-slate-400" />
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 p-2">
            <TradingViewChart symbol={symbol} />
          </div>
          
          {/* لوحة تنفيذ الصفقات الجانبية */}
          <div className="w-48 bg-[#131722] border-l border-white/10 p-4 flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm">Order: {symbol.split(':')[1]}</h3>
            <input 
              type="number" 
              value={volume} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(isNaN(val) ? 0 : val);
              }}
              className="bg-[#1e2329] text-white p-2 rounded text-sm w-full"
            />
            <button onClick={() => handleTrade('Buy')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-sm font-bold">BUY</button>
            <button onClick={() => handleTrade('Sell')} className="w-full bg-red-600 hover:bg-red-500 text-white py-1.5 rounded text-sm font-bold">SELL</button>
          </div>
        </div>
        
        {/* منطقة الرصيد */}
        <div className="h-10 bg-[#1e2329] border-t border-white/10 flex items-center px-4 gap-6 text-xs font-mono">
          <span>Balance: <span className="text-white">${balance.balance.toFixed(2)}</span></span>
          <span>Equity: <span className="text-white">${balance.equity.toFixed(2)}</span></span>
          <span>Margin: <span className="text-white">${balance.margin.toFixed(2)}</span></span>
          <span>Free Margin: <span className="text-white">${balance.freeMargin.toFixed(2)}</span></span>
        </div>

        {/* جدول الصفقات (Terminal) */}
        <div className="h-48 bg-[#131722] border-t border-white/10 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
              <tr>
                <th className="p-2">Symbol</th>
                <th className="p-2">Type</th>
                <th className="p-2">Volume</th>
                <th className="p-2">Price</th>
                <th className="p-2">S/L</th>
                <th className="p-2">T/P</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-white font-bold">{p.symbol}</td>
                  <td className={`p-2 ${p.type === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p.type}</td>
                  <td className="p-2">{p.volume}</td>
                  <td className="p-2">{p.entry_price}</td>
                  <td className="p-2">{p.sl || '-'}</td>
                  <td className="p-2">{p.tp || '-'}</td>
                  <td className={`p-2 ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.profit?.toFixed(2) || '0.00'}</td>
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
