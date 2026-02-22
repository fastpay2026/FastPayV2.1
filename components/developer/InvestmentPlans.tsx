
import React, { useState } from 'react';
import { SiteConfig, DepositPlan } from '../../types';

interface Props {
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
}

const InvestmentPlans: React.FC<Props> = ({ siteConfig, onUpdateConfig }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', rate: 15, months: 12, min: 1000 });

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: DepositPlan = {
      id: Math.random().toString(36).substr(2, 9),
      name: planForm.name,
      rate: planForm.rate,
      durationMonths: planForm.months,
      minAmount: planForm.min
    };
    onUpdateConfig({ ...siteConfig, depositPlans: [...siteConfig.depositPlans, newPlan] });
    setIsModalOpen(false);
    setPlanForm({ name: '', rate: 15, months: 12, min: 1000 });
  };

  const deletePlan = (id: string) => {
    onUpdateConfig({ ...siteConfig, depositPlans: siteConfig.depositPlans.filter(x => x.id !== id) });
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-black tracking-tighter">خطط الاستثمار السيادية</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-sky-500 transition-all">+ إضافة خطة</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {siteConfig.depositPlans.map(plan => (
          <div key={plan.id} className="p-10 bg-slate-900/60 border border-white/10 rounded-[3rem] shadow-xl text-center group hover:border-sky-500/40 transition-all relative">
            <h4 className="text-2xl font-black text-sky-400 mb-2">{plan.name}</h4>
            <p className="text-6xl font-black mb-6">{plan.rate}%</p>
            <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">{plan.durationMonths} شهر / حد أدنى ${plan.minAmount.toLocaleString()}</p>
            <button onClick={() => deletePlan(plan.id)} className="text-red-500 font-black text-[10px] hover:bg-red-500/10 px-6 py-2 rounded-full transition-all border border-red-500/20">حذف الخطة 🗑️</button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleSavePlan} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
            <h3 className="text-4xl font-black mb-8 tracking-tighter">إضافة خطة استثمار جديدة</h3>
            <div className="space-y-4">
              <input required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="اسم الخطة" />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">نسبة الربح (%)</label><input type="number" required value={planForm.rate} onChange={e => setPlanForm({ ...planForm, rate: parseFloat(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">المدة (أشهر)</label><input type="number" required value={planForm.months} onChange={e => setPlanForm({ ...planForm, months: parseInt(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">الحد الأدنى ($)</label><input type="number" required value={planForm.min} onChange={e => setPlanForm({ ...planForm, min: parseFloat(e.target.value) })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-emerald-400 outline-none text-center text-2xl" /></div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-6 bg-sky-600 rounded-3xl font-black text-xl shadow-2xl">حفظ الخطة</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-xl">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InvestmentPlans;
