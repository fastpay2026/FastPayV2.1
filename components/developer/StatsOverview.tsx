
import React from 'react';
import { User, SiteConfig, WithdrawalRequest, TradeOrder } from '../types';

interface Props {
  accounts: User[];
  withdrawalRequests: WithdrawalRequest[];
  tradeOrders: TradeOrder[];
  siteConfig: SiteConfig;
}

const StatsOverview: React.FC<Props> = ({ accounts, withdrawalRequests, tradeOrders, siteConfig }) => {
  return (
    <div className="space-y-12 animate-in fade-in">
      <h2 className="text-6xl font-black tracking-tighter">مركز العمليات التنفيذي</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">إجمالي الأعضاء</p>
          <p className="text-6xl font-black text-sky-400">{accounts.length}</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">حوالات معلقة</p>
          <p className="text-6xl font-black text-red-400">{withdrawalRequests.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">صفقات مفتوحة</p>
          <p className="text-6xl font-black text-indigo-400">{tradeOrders.filter(o => o.status === 'open').length}</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">سيولة النظام</p>
          <p className="text-4xl font-black text-white font-mono">${siteConfig.networkBalance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
