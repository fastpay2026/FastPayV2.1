
import React from 'react';
import { User, SiteConfig, WithdrawalRequest, TradeOrder } from '../../types';

interface Props {
  accounts: User[];
  withdrawalRequests: WithdrawalRequest[];
  tradeOrders: TradeOrder[];
  siteConfig: SiteConfig;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

const StatsOverview: React.FC<Props> = ({ accounts, withdrawalRequests, tradeOrders, siteConfig, onManualSync, isSyncing }) => {
  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="flex justify-between items-end">
        <h2 className="text-6xl font-black tracking-tighter">مركز العمليات التنفيذي</h2>
        {onManualSync && (
          <button 
            onClick={onManualSync}
            disabled={isSyncing}
            className={`px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-3 ${isSyncing ? 'bg-white/5 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'}`}
          >
            {isSyncing ? 'جاري المزامنة...' : 'مزامنة يدوية مع Supabase 🔄'}
          </button>
        )}
      </div>
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
