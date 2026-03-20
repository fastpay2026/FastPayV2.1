import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

interface PlatformRevenue {
  id: string;
  tradeId: string;
  userId: string;
  username: string;
  assetSymbol: string;
  amount: number;
  timestamp: string;
}

const PlatformEarnings: React.FC = () => {
  const [earnings, setEarnings] = useState<PlatformRevenue[]>([]);
  const [totalProfits, setTotalProfits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
    fetchTotalProfits();
  }, []);

  const fetchEarnings = async () => {
    console.log('PlatformEarnings: Fetching earnings from Supabase...');
    const { data, error } = await supabase
      .from('platform_revenues')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('PlatformEarnings: Error fetching earnings:', error);
    } else {
      console.log('PlatformEarnings: Fetched earnings:', data);
      setEarnings(data || []);
    }
    setLoading(false);
  };

  const fetchTotalProfits = async () => {
    const { data, error } = await supabase
      .from('platform_stats')
      .select('total_profits')
      .eq('id', 1)
      .single();
    
    if (data) {
      setTotalProfits(Number(data.total_profits));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="bg-emerald-900/20 p-4 rounded-lg mb-6 border border-emerald-500/20">
        <h3 className="text-sm text-emerald-400 font-bold uppercase">Cumulative Platform Profits</h3>
        <p className="text-3xl font-mono text-white mt-1">${totalProfits.toFixed(2)}</p>
      </div>
      <h2 className="text-xl font-bold mb-4">Recent Trade Commissions</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Trade ID</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Asset</th>
            <th className="border p-2">Net Profit ($)</th>
            <th className="border p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning) => (
            <tr key={earning.id}>
              <td className="border p-2">{earning.tradeId}</td>
              <td className="border p-2">{earning.username}</td>
              <td className="border p-2">{earning.assetSymbol}</td>
              <td className="border p-2">{earning.amount.toFixed(2)}</td>
              <td className="border p-2">{new Date(earning.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlatformEarnings;
