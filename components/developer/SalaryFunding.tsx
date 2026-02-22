
import React, { useState } from 'react';
import { User, SalaryFinancing } from '../../types';

interface Props {
  salaryPlans: SalaryFinancing[];
  setSalaryPlans: React.Dispatch<React.SetStateAction<SalaryFinancing[]>>;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
}

const SalaryFunding: React.FC<Props> = ({ salaryPlans, setSalaryPlans, accounts, setAccounts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ username: '', amount: 5000, duration: 12, benName: '' });

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const t = accounts.find(a => a.username === salaryForm.username);
    if (!t) return alert('اسم المستخدم غير موجود');
    const np: SalaryFinancing = {
      id: Math.random().toString(36).substr(2, 9),
      userId: t.id,
      username: t.username,
      beneficiaryName: salaryForm.benName || t.fullName,
      amount: salaryForm.amount,
      deduction: Number(((salaryForm.amount / salaryForm.duration) * 1.05).toFixed(2)),
      duration: salaryForm.duration,
      startDate: new Date().toLocaleDateString(),
      status: 'active',
      requestedAt: new Date().toLocaleString()
    };
    setSalaryPlans(p => [np, ...p]);
    setAccounts(accs => accs.map(ax => ax.id === t.id ? { ...ax, balance: ax.balance + salaryForm.amount } : ax));
    setIsModalOpen(false);
    alert('تم منح التمويل بنجاح 🏦');
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom">
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-black tracking-tighter text-indigo-400">تمويل الرواتب المسبق</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-500 transition-all">+ تمويل مباشر</button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {salaryPlans.map(p => (
          <div key={p.id} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 flex justify-between items-center shadow-xl hover:border-indigo-500/30 transition-all">
            <div>
              <p className="font-black text-2xl text-white">{p.beneficiaryName} <span className="text-xs text-slate-500">@{p.username}</span></p>
              <p className="text-indigo-400 font-black text-4xl font-mono">${p.amount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-2">{p.requestedAt}</p>
            </div>
            <div className="flex gap-4">
              {p.status === 'pending' ? (
                <>
                  <button onClick={() => setSalaryPlans(prev => prev.map(x => x.id === p.id ? { ...x, status: 'active' } : x))} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-500">تفعيل</button>
                  <button onClick={() => setSalaryPlans(prev => prev.map(x => x.id === p.id ? { ...x, status: 'cancelled' } : x))} className="bg-red-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-red-500">إلغاء</button>
                </>
              ) : (
                <span className={`px-8 py-3 rounded-full text-xs font-black uppercase border ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500'}`}>{p.status}</span>
              )}
            </div>
          </div>
        ))}
        {salaryPlans.length === 0 && <div className="p-24 text-center opacity-20 italic font-black text-2xl">لا توجد طلبات تمويل نشطة</div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleSaveSalary} className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-10 animate-in zoom-in text-center shadow-3xl">
            <h3 className="text-4xl font-black text-white tracking-tighter">منح تمويل فوري</h3>
            <div className="space-y-4">
              <input required value={salaryForm.username} onChange={e => setSalaryForm({ ...salaryForm, username: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all font-mono" placeholder="اسم المستخدم" />
              <input required value={salaryForm.benName} onChange={e => setSalaryForm({ ...salaryForm, benName: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="اسم المستفيد" />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">المبلغ ($)</label><input type="number" required value={salaryForm.amount} onChange={e => setSalaryForm({ ...salaryForm, amount: parseInt(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-indigo-400 outline-none text-2xl text-center" /></div>
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">المدة (أشهر)</label><input type="number" required value={salaryForm.duration} onChange={e => setSalaryForm({ ...salaryForm, duration: parseInt(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
              </div>
            </div>
            <button type="submit" className="w-full py-8 bg-indigo-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-indigo-500 transition-all active:scale-95">تأكيد التمويل 🏦</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 font-bold hover:text-white transition-colors">إغلاق</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalaryFunding;
