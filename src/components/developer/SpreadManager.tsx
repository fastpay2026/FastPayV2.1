import React, { useEffect, useState } from 'react';
import { TradeAsset } from '../../../types';
import { getSpreads, updateSpread } from '../../services/spreadService';

interface Props {
  tradeAssets: TradeAsset[];
}

const SpreadManager: React.FC<Props> = ({ tradeAssets }) => {
  const [spreads, setSpreads] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpreads();
  }, []);

  const loadSpreads = async () => {
    setLoading(true);
    const data = await getSpreads();
    setSpreads(data);
    setLoading(false);
  };

  const handleUpdateSpread = async (symbol: string, value: string) => {
    const spread = parseFloat(value);
    if (isNaN(spread)) return;
    await updateSpread(symbol, spread);
    setSpreads(prev => ({ ...prev, [symbol]: spread }));
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black mb-6">Spread Manager</h2>
      <div className="space-y-4">
        {tradeAssets.map(asset => (
          <div key={asset.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
            <span className="font-bold">{asset.symbol}</span>
            <input
              type="number"
              value={spreads[asset.symbol] || 0}
              onChange={(e) => handleUpdateSpread(asset.symbol, e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg p-2 text-white w-24"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpreadManager;
