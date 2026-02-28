
import React from 'react';
import { User, TradeAsset, TradeOrder } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  tradeAssets: TradeAsset[];
  setTradeAssets: React.Dispatch<React.SetStateAction<TradeAsset[]>>;
  tradeOrders: TradeOrder[];
  setTradeOrders: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
}

const DealsEngine: React.FC<Props> = ({ tradeAssets, setTradeAssets, tradeOrders, setTradeOrders, setAccounts }) => {
  const { t } = useI18n();
  const updateAsset = (id: string, updates: Partial<TradeAsset>) => {
    setTradeAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleCloseOrder = (orderId: string, result: 'profit' | 'loss') => {
    const order = tradeOrders.find(o => o.id === orderId);
    if (!order) return;
    const finalAmount = result === 'profit' ? order.amount * 1.8 : 0;
    setTradeOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: result === 'profit' ? 'closed_profit' : 'closed_loss' } : o));
    if (result === 'profit') setAccounts(prev => prev.map(u => u.id === order.userId ? { ...u, balance: u.balance + finalAmount } : u));
    alert(result === 'profit' ? t('closed_profit_success') : t('closed_loss_success'));
  };

  return (
    <div className="space-y-12 animate-in zoom-in">
      <h2 className="text-4xl font-black tracking-tighter">{t('asset_price_control')}</h2>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-bold min-w-[800px]">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr><th className="p-8">{t('asset')}</th><th className="p-8 text-center">{t('real_price')}</th><th className="p-8 text-center">{t('bias')}</th><th className="p-8 text-center">{t('status')}</th></tr>
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
                    <button onClick={() => updateAsset(a.id, { isFrozen: !a.isFrozen })} className={`px-6 py-2 rounded-xl text-[10px] font-black ${a.isFrozen ? 'bg-red-600' : 'bg-sky-600'}`}>{a.isFrozen ? t('unfreeze') : t('freeze_price')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <h2 className="text-3xl font-black tracking-tighter text-indigo-400">{t('open_deals_mgmt')}</h2>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-bold min-w-[600px]">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr><th className="p-8">{t('trader')}</th><th className="p-8">{t('amount')}</th><th className="p-8 text-center">{t('decision')}</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-black">
              {tradeOrders.filter(o => o.status === 'open').map(o => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="p-8">@{o.username}<br /><span className="text-xs text-sky-400 font-mono">{o.assetSymbol}</span></td>
                  <td className="p-8 text-white font-mono">${o.amount.toLocaleString()}</td>
                  <td className="p-8 flex justify-center gap-3">
                    <button onClick={() => handleCloseOrder(o.id, 'profit')} className="bg-emerald-600 px-6 py-2 rounded-xl text-xs">{t('close_profit')}</button>
                    <button onClick={() => handleCloseOrder(o.id, 'loss')} className="bg-red-600 px-6 py-2 rounded-xl text-xs">{t('close_loss')}</button>
                  </td>
                </tr>
              ))}
              {tradeOrders.filter(o => o.status === 'open').length === 0 && <tr><td colSpan={3} className="p-20 text-center opacity-20 italic">{t('no_live_deals')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DealsEngine;
