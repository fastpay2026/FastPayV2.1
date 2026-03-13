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
    console.log("Fetching wallet/balance for user ID:", user.id);
    
    // 1. محاولة جلب الرصيد من جدول wallets
    let { data: walletData, error: walletError } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
    
    if (walletData) {
      console.log("Wallet data found:", walletData);
      setBalance({ 
        balance: walletData.balance || 0, 
        equity: walletData.equity || 0, 
        margin: walletData.margin || 0, 
        freeMargin: walletData.free_margin || 0 
      });
      return;
    }

    // 2. إذا لم يوجد، محاولة جلب الرصيد من جدول users كبديل
    console.log("No wallet found, checking users table for balance...");
    let { data: userData, error: userError } = await supabase.from('users').select('balance').eq('id', user.id).single();
    
    if (userData) {
      console.log("User balance found in users table:", userData.balance);
      setBalance({ 
        balance: userData.balance || 0, 
        equity: userData.balance || 0, 
        margin: 0, 
        freeMargin: userData.balance || 0 
      });
    } else {
      console.log("No balance found in users table either.");
      setBalance({ balance: 0, equity: 0, margin: 0, freeMargin: 0 });
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

  const closePosition = async (position: any) => {
    const currentPrice = 71600; // سعر تقريبي حالي
    const profit = (currentPrice - position.entry_price) * position.volume * (position.type === 'Buy' ? 1 : -1);
    const marginToReturn = (position.volume * position.entry_price) / 100;

    // 1. إغلاق الصفقة
    const { error: posError } = await supabase.from('trading_positions').update({
      status: 'CLOSED',
      current_price: currentPrice,
      profit
    }).eq('id', position.id);

    if (posError) {
      alert("خطأ في إغلاق الصفقة: " + posError.message);
      return;
    }

    // 2. تحديث المحفظة (إعادة الهامش + الربح/الخسارة)
    await supabase.from('wallets').update({
      free_margin: balance.freeMargin + marginToReturn + profit,
      margin: balance.margin - marginToReturn
    }).eq('user_id', user.id);

    // 3. تحديث رصيد المستخدم
    await supabase.from('users').update({
      balance: user.balance + profit
    }).eq('id', user.id);

    alert("تم إغلاق الصفقة بنجاح!");
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      {/* ... (القائمة الجانبية والشارت كما هي) ... */}
      {/* ... (منطقة الرصيد كما هي) ... */}

        {/* جدول الصفقات (Terminal) */}
        <div className="h-48 bg-[#131722] border-t border-white/10 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
              <tr>
                <th className="p-2">Symbol</th>
                <th className="p-2">Type</th>
                <th className="p-2">Volume</th>
                <th className="p-2">Price</th>
                <th className="p-2">Profit</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-white font-bold">{p.symbol}</td>
                  <td className={`p-2 ${p.type === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p.type}</td>
                  <td className="p-2">{p.volume}</td>
                  <td className="p-2">{p.entry_price}</td>
                  <td className={`p-2 ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.profit?.toFixed(2) || '0.00'}</td>
                  <td className="p-2">
                    <button 
                      onClick={() => closePosition(p)}
                      className="bg-red-900/50 hover:bg-red-700 text-red-200 px-2 py-1 rounded text-[10px]"
                    >
                      Close
                    </button>
                  </td>
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
