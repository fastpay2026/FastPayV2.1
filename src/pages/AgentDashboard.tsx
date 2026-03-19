import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { User } from '../../types';
import { motion } from 'framer-motion';

const AgentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState({ totalCommission: 0, clientsCount: 0 });
  const [clients, setClients] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. جلب ملخص العمولات
      const { data: revs } = await supabase
        .from('platform_revenues')
        .select('agent_profit')
        .eq('agent_id', user.id);
      
      const total = revs?.reduce((acc, r) => acc + (r.agent_profit || 0), 0) || 0;

      // 2. جلب الزبائن
      const { data: clientsData } = await supabase
        .from('users')
        .select('username, created_at')
        .eq('referred_by', user.id);

      // 3. جلب سجل العمولات
      const { data: commData } = await supabase
        .from('platform_revenues')
        .select('amount, agent_profit, created_at, asset_symbol')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      setStats({ totalCommission: total, clientsCount: clientsData?.length || 0 });
      setClients(clientsData || []);
      setCommissions(commData || []);
    };
    fetchData();
  }, [user.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-white min-h-screen bg-[#0b0e11]">
      <h1 className="text-3xl font-black mb-8">Agent Dashboard</h1>
      
      {/* ملخص مالي */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#161a1e] p-6 rounded-xl border border-white/5">
          <p className="text-slate-400">Total Commission</p>
          <h2 className="text-4xl font-bold text-emerald-400">${stats.totalCommission.toFixed(2)}</h2>
        </div>
        <div className="bg-[#161a1e] p-6 rounded-xl border border-white/5">
          <p className="text-slate-400">Total Clients</p>
          <h2 className="text-4xl font-bold">{stats.clientsCount}</h2>
        </div>
      </div>

      {/* رابط الإحالة */}
      <div className="bg-[#161a1e] p-6 rounded-xl mb-8 border border-white/5">
        <p className="text-slate-400 mb-2">Referral Link</p>
        <code className="bg-black p-3 rounded block font-mono">{window.location.origin}/register?ref={user.id}</code>
      </div>

      {/* سجل العمولات */}
      <div className="bg-[#161a1e] rounded-xl border border-white/5 overflow-hidden">
        <h3 className="p-6 text-xl font-bold">Commission History</h3>
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Symbol</th>
              <th className="p-4">Commission</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="p-4">{c.asset_symbol}</td>
                <td className="p-4 text-emerald-400 font-mono">+${c.agent_profit.toFixed(2)}</td>
                <td className="p-4 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AgentDashboard;
