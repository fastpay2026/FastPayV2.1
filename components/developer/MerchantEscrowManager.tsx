
import React from 'react';
import { User, Transaction, Notification } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
}

const MerchantEscrowManager: React.FC<Props> = ({ transactions, setTransactions, setAccounts, addNotification }) => {
  const { t } = useI18n();
  const escrowTransactions = transactions.filter(t => t.status === 'escrow' || t.status === 'shipped');

  const handleAction = (transactionId: string, action: 'approve' | 'reject') => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    if (action === 'approve') {
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'completed' } : t));
      setAccounts(prev => prev.map(u => u.id === transaction.userId ? { ...u, balance: u.balance + transaction.amount } : u));
      addNotification(t('approve'), `${t('approve')} ${transaction.id} ${t('and_release_funds')}.`, 'money');
      alert(t('escrow_approved_success'));
    } else {
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'pending' } : t));
      addNotification(t('reject'), `${t('reject')} ${transaction.id}.`, 'security');
      alert(t('escrow_rejected_success'));
    }
  };

  return (
    <div className="space-y-12 animate-in zoom-in">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-black tracking-tighter text-teal-400">{t('merchant_escrow_mgmt')}</h2>
        <div className="bg-teal-500/10 border border-teal-500/20 px-6 py-2 rounded-full">
          <span className="text-xs font-black text-teal-500 uppercase tracking-widest">{t('financial_control_system')}</span>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-bold min-w-[1000px]">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr>
                <th className="p-8">{t('merchant')}</th>
                <th className="p-8">{t('buyer')}</th>
                <th className="p-8">{t('amount')}</th>
                <th className="p-8">{t('status')}</th>
                <th className="p-8">{t('hash')}</th>
                <th className="p-8 text-center">{t('advanced_control')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {escrowTransactions.length > 0 ? (
                escrowTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-all">
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-400 text-xs">🏪</div>
                        <span>ID: {t.userId.substr(0, 5)}</span>
                      </div>
                    </td>
                    <td className="p-8 text-white">{t.relatedUser}</td>
                    <td className="p-8 text-teal-400 font-mono">${t.amount.toLocaleString()}</td>
                    <td className="p-8">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                        t.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        t.status === 'escrow' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {t.status === 'shipped' ? 'Shipped (بانتظار المراجعة)' : t.status === 'escrow' ? 'Escrow (محجوز)' : t.status}
                      </span>
                    </td>
                    <td className="p-8">
                      <code className="text-[10px] font-mono text-slate-500 truncate max-w-[100px] block">{t.hash || 'N/A'}</code>
                    </td>
                    <td className="p-8">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleAction(t.id, 'approve')}
                          className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-emerald-900/20"
                        >
                          {t('approve_release')}
                        </button>
                        <button 
                          onClick={() => handleAction(t.id, 'reject')}
                          className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-red-900/20"
                        >
                          {t('reject_cancel')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center opacity-20 italic font-black">{t('no_escrow_requests')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-10 bg-teal-500/5 border border-teal-500/10 rounded-[3rem] space-y-4">
        <h3 className="text-xl font-black text-white flex items-center gap-3">
          <span>🛡️</span> {t('lc_policy_guide')}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed font-bold">
          {t('lc_policy_description')}
        </p>
      </div>
    </div>
  );
};

export default MerchantEscrowManager;
