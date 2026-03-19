import React from 'react';
import { User, DollarSign, Users, Activity, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../../types';

interface AgentDashboardProps {
  currentUser: UserType | null;
  accounts: UserType[];
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ currentUser, accounts }) => {
  // حماية الوصول: التأكد من أن المستخدم وكيل
  if (!currentUser || currentUser.role !== 'AGENT') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black">Access Denied</h2>
        <p className="text-slate-400 mt-2">You do not have permission to access this dashboard.</p>
      </div>
    );
  }

  const referredUsers = accounts.filter(a => a.referred_by === currentUser.id);
  const totalEarnings = referredUsers.reduce((sum, user) => sum + (user.balance * (currentUser.agent_percentage || 0) / 100), 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">Agent Dashboard</h2>
          <p className="text-slate-400">Welcome back, {currentUser.fullName}</p>
        </div>
        <div className="bg-emerald-600/10 border border-emerald-500/20 px-6 py-3 rounded-2xl text-emerald-400 font-black">
          Commission Rate: {currentUser.agent_percentage}%
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-sky-600/20 rounded-2xl text-sky-400"><Users /></div>
            <h3 className="font-bold text-slate-400">Referred Users</h3>
          </div>
          <p className="text-4xl font-black">{referredUsers.length}</p>
        </div>
        <div className="bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-600/20 rounded-2xl text-emerald-400"><DollarSign /></div>
            <h3 className="font-bold text-slate-400">Total Earnings</h3>
          </div>
          <p className="text-4xl font-black text-emerald-400">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-600/20 rounded-2xl text-amber-400"><Activity /></div>
            <h3 className="font-bold text-slate-400">Status</h3>
          </div>
          <p className="text-2xl font-black text-emerald-400">Active</p>
        </div>
      </div>

      {/* Referred Users Table */}
      <div className="bg-[#111827] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-black">Your Referred Users</h3>
        </div>
        <table className="w-full text-right font-bold">
          <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
            <tr>
              <th className="p-6">User</th>
              <th className="p-6">Balance</th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {referredUsers.map(u => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="p-6">{u.fullName}</td>
                <td className="p-6 text-emerald-400">${u.balance.toLocaleString()}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentDashboard;