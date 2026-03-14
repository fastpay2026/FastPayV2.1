import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { TradeOrder } from '../../types';

const TradingControl: React.FC = () => {
  const [positions, setPositions] = useState<TradeOrder[]>([]);
  const [spread, setSpread] = useState(0.0001);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trading_positions')
      .select('*')
      .eq('status', 'OPEN');
    
    if (error) {
      console.error('Error fetching positions:', error);
    } else {
      setPositions(data || []);
    }
    setLoading(false);
  };

  const closePosition = async (id: string) => {
    const { error } = await supabase
      .from('trading_positions')
      .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Error closing position:', error);
      alert('Failed to close position');
    } else {
      fetchPositions();
    }
  };

  return (
    <div className="p-6 bg-[#0b0e11] text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Risk Management</h1>
      
      <div className="mb-8 p-4 bg-[#131722] rounded border border-white/10 flex items-center justify-between">
        <div>
          <label className="block text-sm font-bold mb-2">Global Spread Adjustment: </label>
          <input 
            type="number" 
            step="0.0001"
            value={spread} 
            onChange={(e) => setSpread(parseFloat(e.target.value))}
            className="bg-black p-2 rounded border border-white/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Live Notifications: </label>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`px-4 py-2 rounded font-bold ${notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-600'}`}
          >
            {notificationsEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <div className="bg-[#131722] rounded border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1e2329] text-slate-400">
            <tr>
              <th className="p-4">User ID</th>
              <th className="p-4">Symbol</th>
              <th className="p-4">Type</th>
              <th className="p-4">Volume</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
            ) : positions.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center">No open positions</td></tr>
            ) : (
              positions.map((p: any) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">{p.user_id}</td>
                  <td className="p-4">{p.symbol}</td>
                  <td className={`p-4 ${p.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{p.type}</td>
                  <td className="p-4">{p.volume}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => closePosition(p.id)} 
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-xs font-bold"
                    >
                      Emergency Close
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradingControl;
