
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, SalaryFinancing } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  salaryPlans: SalaryFinancing[];
  setSalaryPlans: React.Dispatch<React.SetStateAction<SalaryFinancing[]>>;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
}

const SalaryFunding: React.FC<Props> = ({ salaryPlans, setSalaryPlans, accounts, setAccounts }) => {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ username: '', amount: 5000, duration: 12, benName: '' });

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const t_user = accounts.find(a => a.username === salaryForm.username);
    if (!t_user) return alert(t('username_not_found'));
    const np: SalaryFinancing = {
      id: uuidv4(),
      userId: t_user.id,
      username: t_user.username,
      beneficiaryName: salaryForm.benName || t_user.fullName,
      amount: salaryForm.amount,
      deduction: Number(((salaryForm.amount / salaryForm.duration) * 1.05).toFixed(2)),
      duration: salaryForm.duration,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      requestedAt: new Date().toISOString()
    };
    setSalaryPlans(p => [np, ...p]);
    setAccounts(accs => accs.map(ax => ax.id === t_user.id ? { ...ax, balance: ax.balance + salaryForm.amount } : ax));
    setIsModalOpen(false);
    alert(t('funding_granted_success'));
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-indigo-400">{t('salary_advance_funding')}</h2>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-indigo-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-500 transition-all">+ {t('direct_funding')}</button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {salaryPlans.map(p => (
          <div key={p.id} className="bg-slate-900/40 p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl hover:border-indigo-500/30 transition-all">
            <div>
              <p className="font-black text-xl md:text-2xl text-white">{p.beneficiaryName} <span className="text-xs text-slate-500">@{p.username}</span></p>
              <p className="text-indigo-400 font-black text-3xl md:text-4xl font-mono">${p.amount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-2">{p.requestedAt}</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              {p.status === 'pending' ? (
                <>
                  <button onClick={() => setSalaryPlans(prev => prev.map(x => x.id === p.id ? { ...x, status: 'active' } : x))} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-500">{t('activate')}</button>
                  <button onClick={() => setSalaryPlans(prev => prev.map(x => x.id === p.id ? { ...x, status: 'cancelled' } : x))} className="bg-red-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-red-500">{t('cancel')}</button>
                </>
              ) : (
                <span className={`px-8 py-3 rounded-full text-xs font-black uppercase border ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500'}`}>{p.status}</span>
              )}
            </div>
          </div>
        ))}
        {salaryPlans.length === 0 && <div className="p-24 text-center opacity-20 italic font-black text-2xl">{t('no_active_funding_requests')}</div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleSaveSalary} className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-10 animate-in zoom-in text-center shadow-3xl">
            <h3 className="text-4xl font-black text-white tracking-tighter">{t('grant_instant_funding')}</h3>
            <div className="space-y-4">
              <input required value={salaryForm.username} onChange={e => setSalaryForm({ ...salaryForm, username: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all font-mono" placeholder={t('username_placeholder')} />
              <input required value={salaryForm.benName} onChange={e => setSalaryForm({ ...salaryForm, benName: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder={t('beneficiary_name_placeholder')} />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">{t('amount')} ($)</label><input type="number" required value={salaryForm.amount} onChange={e => setSalaryForm({ ...salaryForm, amount: parseInt(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-indigo-400 outline-none text-2xl text-center" /></div>
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">{t('duration_months')}</label><input type="number" required value={salaryForm.duration} onChange={e => setSalaryForm({ ...salaryForm, duration: parseInt(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
              </div>
            </div>
            <button type="submit" className="w-full py-8 bg-indigo-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-indigo-500 transition-all active:scale-95">{t('confirm_funding')}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 font-bold hover:text-white transition-colors">{t('close')}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalaryFunding;
