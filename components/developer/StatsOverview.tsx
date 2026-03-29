
import React from 'react';
import { User, SiteConfig, WithdrawalRequest, TradeOrder } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  accounts: User[];
  withdrawalRequests: WithdrawalRequest[];
  tradeOrders: TradeOrder[];
  siteConfig: SiteConfig;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

const StatsOverview: React.FC<Props> = ({ accounts, withdrawalRequests, tradeOrders, siteConfig, onManualSync, isSyncing }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="flex justify-between items-end">
        <h2 className="text-6xl font-black tracking-tighter">{t('executive_ops_center')}</h2>
        {onManualSync && (
          <button 
            onClick={onManualSync}
            disabled={isSyncing}
            className={`px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-3 ${isSyncing ? 'bg-white/5 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'}`}
          >
            {isSyncing ? t('syncing') : t('manual_sync')}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">{t('total_members')}</p>
          <p className="text-6xl font-black text-sky-400">{accounts.length}</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">{t('pending_transfers')}</p>
          <p className="text-6xl font-black text-red-400">{withdrawalRequests.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">{t('open_deals')}</p>
          <p className="text-6xl font-black text-indigo-400">{tradeOrders.filter(o => o.status === 'open').length}</p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
          <p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">{t('system_liquidity')}</p>
          <p className="text-4xl font-black text-white font-mono">${siteConfig.networkBalance?.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5">
        <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Open Positions Monitoring</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="text-[10px] text-slate-500 uppercase font-black border-b border-white/5">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Symbol</th>
                <th className="p-4">Type</th>
                <th className="p-4">Volume</th>
                <th className="p-4">Entry</th>
                <th className="p-4 text-red-400">SL</th>
                <th className="p-4 text-emerald-400">TP</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tradeOrders.filter(o => o.status === 'open').map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sky-400 font-bold">@{order.username || 'Unknown'}</td>
                  <td className="p-4 font-black">{order.asset_symbol}</td>
                  <td className={`p-4 font-black uppercase ${order.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{order.type}</td>
                  <td className="p-4 font-mono">{order.amount}</td>
                  <td className="p-4 font-mono">{order.entry_price}</td>
                  <td className="p-4 font-mono text-red-400/80">{order.sl || '-'}</td>
                  <td className="p-4 font-mono text-emerald-400/80">{order.tp || '-'}</td>
                  <td className="p-4 text-xs text-slate-500">{new Date(order.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {tradeOrders.filter(o => o.status === 'open').length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500 font-bold italic">No open positions at the moment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
