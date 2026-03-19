import React, { useEffect, useState } from 'react';
import { TradeAsset } from '../../../types';
import { getSpreads, updateSpread } from '../../services/spreadService';

interface Props {
  tradeAssets: TradeAsset[];
}

const SpreadManager: React.FC<Props> = ({ tradeAssets }) => {
  const [spreads, setSpreads] = useState<Record<string, { value: number, mode: 'manual' | 'auto' }>>({});
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

  const handleUpdateSpread = (symbol: string, field: 'value' | 'mode', value: any) => {
    setSpreads(prev => ({
      ...prev,
      [symbol]: {
        ...(prev[symbol] || { value: 0, mode: 'manual' }),
        [field]: value
      }
    }));
  };

  const handleSave = async (symbol: string) => {
    await updateSpread(symbol, spreads[symbol]);
    alert(`تم حفظ الإعدادات لـ ${symbol}`);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black mb-6">Spread Manager (Hybrid)</h2>
      <div className="space-y-4">
        {tradeAssets.map(asset => {
          const spreadConfig = spreads[asset.symbol] || { value: 0, mode: 'manual' };
          return (
            <div key={asset.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 gap-4">
              <span className="font-bold w-20">{asset.symbol}</span>
              
              <div className="flex items-center gap-2">
                <select
                  value={spreadConfig.mode}
                  onChange={(e) => handleUpdateSpread(asset.symbol, 'mode', e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-xs"
                >
                  <option value="manual">Manual</option>
                  <option value="auto">Auto</option>
                </select>

                <input
                  type="number"
                  disabled={spreadConfig.mode === 'auto'}
                  value={spreadConfig.value}
                  onChange={(e) => handleUpdateSpread(asset.symbol, 'value', parseFloat(e.target.value))}
                  className="bg-slate-900 border border-white/10 rounded-lg p-2 text-white w-20 disabled:opacity-50"
                />
              </div>

              <button
                onClick={() => handleSave(asset.symbol)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Apply & Save
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpreadManager;
