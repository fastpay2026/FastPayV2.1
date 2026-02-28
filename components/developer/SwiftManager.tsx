
import React from 'react';
import { User, WithdrawalRequest } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  withdrawalRequests: WithdrawalRequest[];
  setWithdrawalRequests: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  onUpdateUser: (user: User) => void;
}

const SwiftManager: React.FC<Props> = ({ withdrawalRequests, setWithdrawalRequests, setAccounts, onUpdateUser }) => {
  const { t } = useI18n();
  const handleSwiftAction = (id: string, status: 'approved' | 'rejected') => {
    const req = withdrawalRequests.find(r => r.id === id);
    if (!req) return;
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status, processedAt: new Date().toLocaleString() } : r));
    if (status === 'rejected') {
      const user = (window as any).accounts?.find((u: User) => u.id === req.userId);
      if (user) onUpdateUser({ ...user, balance: user.balance + req.amount });
    }
    alert(status === 'approved' ? t('swift_approved_success') : t('swift_rejected_success'));
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      <h2 className="text-5xl font-black tracking-tighter text-sky-400">{t('swift_bank_transfers')}</h2>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right font-bold text-sm min-w-[800px]">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr><th className="p-8">{t('beneficiary')}</th><th className="p-8">{t('amount')}</th><th className="p-8">{t('details')}</th><th className="p-8">{t('status')}</th><th className="p-8 text-center">{t('advanced_control')}</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {withdrawalRequests.map(r => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="p-8">@{r.username}</td>
                  <td className="p-8 text-emerald-400 font-mono">${r.amount.toLocaleString()}</td>
                  <td className="p-8 text-[10px] font-mono">{r.bankName}<br />{r.iban}</td>
                  <td className="p-8">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${r.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-8 flex justify-center gap-3">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => handleSwiftAction(r.id, 'approved')} className="bg-emerald-600 px-4 py-1.5 rounded-lg text-[9px] font-black">{t('approve')}</button>
                        <button onClick={() => handleSwiftAction(r.id, 'rejected')} className="bg-red-600 px-4 py-1.5 rounded-lg text-[9px] font-black">{t('reject')}</button>
                      </>
                    )}
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

export default SwiftManager;
