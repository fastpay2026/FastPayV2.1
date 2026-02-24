
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
      id: uuidv4(),
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
    <div className="space-y-8 md:space-y-10 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">خطط الاستثمار السيادية</h2>
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-sky-600 px-6 md:px-8 py-3 rounded-xl md:rounded-2xl font-black shadow-lg hover:bg-sky-500 transition-all text-sm md:text-base">+ إضافة خطة</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {siteConfig.depositPlans.map(plan => (
          <div key={plan.id} className="p-8 md:p-10 bg-slate-900/60 border border-white/10 rounded-2xl md:rounded-[3rem] shadow-xl text-center group hover:border-sky-500/40 transition-all relative">
            <h4 className="text-xl md:text-2xl font-black text-sky-400 mb-2">{plan.name}</h4>
            <p className="text-5xl md:text-6xl font-black mb-6">{plan.rate}%</p>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">{plan.durationMonths} شهر / حد أدنى ${plan.minAmount.toLocaleString()}</p>
            <button onClick={() => deletePlan(plan.id)} className="text-red-500 font-black text-[10px] hover:bg-red-500/10 px-4 md:px-6 py-2 rounded-full transition-all border border-red-500/20">حذف الخطة 🗑️</button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={handleSavePlan} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 space-y-6 md:space-y-8 animate-in zoom-in text-center shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-3xl md:text-4xl font-black mb-4 md:mb-8 tracking-tighter">إضافة خطة استثمار جديدة</h3>
            <div className="space-y-4">
              <input required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all text-sm md:text-base" placeholder="اسم الخطة" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">نسبة الربح (%)</label><input type="number" required value={planForm.rate} onChange={e => setPlanForm({ ...planForm, rate: parseFloat(e.target.value) })} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white outline-none text-center text-sm md:text-base" /></div>
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">المدة (أشهر)</label><input type="number" required value={planForm.months} onChange={e => setPlanForm({ ...planForm, months: parseInt(e.target.value) })} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white outline-none text-center text-sm md:text-base" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">الحد الأدنى ($)</label><input type="number" required value={planForm.min} onChange={e => setPlanForm({ ...planForm, min: parseFloat(e.target.value) })} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-emerald-400 outline-none text-center text-xl md:text-2xl" /></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button type="submit" className="flex-1 py-4 md:py-6 bg-sky-600 rounded-xl md:rounded-3xl font-black text-lg md:text-xl shadow-2xl">حفظ الخطة</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 md:py-6 bg-white/5 border border-white/10 rounded-xl md:rounded-3xl font-black text-lg md:text-xl">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InvestmentPlans;
