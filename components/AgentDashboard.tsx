import React from 'react';
import { User } from '../types';

interface Props {
  user: User;
}

const AgentDashboard: React.FC<Props> = ({ user }) => {
  // بيانات تجريبية (يجب استبدالها بجلب البيانات الفعلي من Supabase)
  const stats = {
    spreadCommission: 1250.50,
    totalCustomers: 45,
    referralLink: `https://fastpay-network.com/ref/${user.username}`
  };

  return (
    <div className="p-8 bg-[#0a0a0a] text-white min-h-screen">
      <h1 className="text-3xl font-black mb-8 text-sky-400">لوحة تحكم الوكيل</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-[#0f172a] border border-white/10 rounded-2xl">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">عمولات السبريد</h2>
          <p className="text-4xl font-black text-emerald-400">${stats.spreadCommission.toFixed(2)}</p>
        </div>
        <div className="p-6 bg-[#0f172a] border border-white/10 rounded-2xl">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">إجمالي الزبائن</h2>
          <p className="text-4xl font-black text-white">{stats.totalCustomers}</p>
        </div>
        <div className="p-6 bg-[#0f172a] border border-white/10 rounded-2xl">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">رابط الإحالة</h2>
          <p className="text-xs font-mono text-sky-300 break-all">{stats.referralLink}</p>
        </div>
      </div>

      <div className="p-6 bg-[#0f172a] border border-white/10 rounded-2xl">
        <h2 className="text-xl font-black mb-4">قائمة الزبائن التابعين</h2>
        <p className="text-slate-500">لا يوجد زبائن حالياً.</p>
      </div>
    </div>
  );
};

export default AgentDashboard;
