
import React from 'react';
import { User, TradeAsset, TradeOrder } from '../types';

interface Props {
  tradeAssets: TradeAsset[];
  setTradeAssets: React.Dispatch<React.SetStateAction<TradeAsset[]>>;
  tradeOrders: TradeOrder[];
  setTradeOrders: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
}

const DealsEngine: React.FC<Props> = ({ tradeAssets, setTradeAssets, tradeOrders, setTradeOrders, setAccounts }) => {
  const updateAsset = (id: string, updates: Partial<TradeAsset>) => {
    setTradeAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleCloseOrder = (orderId: string, result: 'profit' | 'loss') => {
    const order = tradeOrders.find(o => o.id === orderId);
    if (!order) return;
    const finalAmount = result === 'profit' ? order.amount * 1.8 : 0;
    setTradeOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: result === 'profit' ? 'closed_profit' : 'closed_loss' } : o));
    if (result === 'profit') setAccounts(prev => prev.map(u => u.id === order.userId ? { ...u, balance: u.balance + finalAmount } : u));
    alert(result === 'profit' ? 'أغلقت بربح ✅' : 'أغلقت بخسارة ❌');
  };

  return (
    <div className="space-y-12 animate-in zoom-in">
      <h2 className="text-4xl font-black tracking-tighter">التحكم في أسعار الأصول والصفقات</h2>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-right font-bold">
          <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
            <tr><th className="p-8">الأصل</th><th className="p-8 text-center">السعر الحقيقي</th><th className="p-8 text-center">الانحياز</th><th className="p-8 text-center">الحالة</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tradeAssets.map(a => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="p-8 flex items-center gap-4"><span className="text-3xl">{a.icon}</span><div><p>{a.name}</p><p className="text-xs text-slate-500">{a.symbol}</p></div></td>
                <td className="p-8 text-center font-mono text-sky-400">${a.price.toLocaleString()}</td>
                <td className="p-8 text-center">
                  <div className="flex justify-center gap-2">
                    {(['up', 'neutral', 'down'] as const).map(b => (
                      <button key={b} onClick={() => updateAsset(a.id, { trendBias: b })} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border ${a.trendBias === b ? 'bg-sky-600' : 'bg-white/5 text-slate-500'}`}>{b}</button>
                    ))}
                  </div>
                </td>
                <td className="p-8 text-center">
                  <button onClick={() => updateAsset(a.id, { isFrozen: !a.isFrozen })} className={`px-6 py-2 rounded-xl text-[10px] font-black ${a.isFrozen ? 'bg-red-600' : 'bg-sky-600'}`}>{a.isFrozen ? 'فك التجميد' : 'تجميد السعر'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-3xl font-black tracking-tighter text-indigo-400">إدارة الصفقات المفتوحة</h2>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-right font-bold">
          <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
            <tr><th className="p-8">المتداول</th><th className="p-8">المبلغ</th><th className="p-8 text-center">القرار</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-black">
            {tradeOrders.filter(o => o.status === 'open').map(o => (
              <tr key={o.id} className="hover:bg-white/5">
                <td className="p-8">@{o.username}<br /><span className="text-xs text-sky-400 font-mono">{o.assetSymbol}</span></td>
                <td className="p-8 text-white font-mono">${o.amount.toLocaleString()}</td>
                <td className="p-8 flex justify-center gap-3">
                  <button onClick={() => handleCloseOrder(o.id, 'profit')} className="bg-emerald-600 px-6 py-2 rounded-xl text-xs">إغلاق بربح ✅</button>
                  <button onClick={() => handleCloseOrder(o.id, 'loss')} className="bg-red-600 px-6 py-2 rounded-xl text-xs">بخسارة ❌</button>
                </td>
              </tr>
            ))}
            {tradeOrders.filter(o => o.status === 'open').length === 0 && <tr><td colSpan={3} className="p-20 text-center opacity-20 italic">لا توجد صفقات حية حالياً</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsEngine;
