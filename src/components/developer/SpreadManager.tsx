import React, { useEffect, useState } from 'react';
import { TradeAsset } from '../../../types';
import { getSpreads, updateSpread } from '../../services/spreadService';
import { getVolatility, fetchHistoricalData } from '../../services/marketService';

interface Props {
  tradeAssets: TradeAsset[];
}

const SpreadManager: React.FC<Props> = ({ tradeAssets }) => {
  const [spreads, setSpreads] = useState<Record<string, { value: number, commission: number, mode: 'manual' | 'auto' }>>({});
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

  const handleUpdateSpread = async (symbol: string, field: 'value' | 'mode', value: any) => {
    if (field === 'mode' && value === 'auto') {
      const data = await fetchHistoricalData(symbol);
      const vol = getVolatility(data);
      const newSpread = vol * 100; // Placeholder formula
      setSpreads(prev => ({
        ...prev,
        [symbol]: {
          ...(prev[symbol] || { value: 0, mode: 'manual' }),
          mode: 'auto',
          value: newSpread
        }
      }));
    } else {
      setSpreads(prev => ({
        ...prev,
        [symbol]: {
          ...(prev[symbol] || { value: 0, mode: 'manual' }),
          [field]: value
        }
      }));
    }
  };

  const handleSave = async (symbol: string) => {
    const spreadConfig = spreads[symbol];
    const configToSave = { 
      value: spreadConfig.value, 
      commission: spreadConfig.value, // Commission is now equal to spread
      mode: spreadConfig.mode
    };
    await updateSpread(symbol, configToSave);
    alert(`تم حفظ الإعدادات لـ ${symbol}`);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black mb-6">Spread Manager</h2>
      <div className="space-y-4">
        {tradeAssets.map(asset => {
          const spreadConfig = spreads[asset.symbol] || { value: 0, mode: 'manual' };
          return (
            <div key={asset.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 gap-4">
              <span className="font-bold w-20">{asset.symbol}</span>
              
              <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Mode</label>
                  <select
                    value={spreadConfig.mode || 'manual'}
                    onChange={(e) => handleUpdateSpread(asset.symbol, 'mode', e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="manual">Manual</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Spread (10 = $10.00 for 0.1 Lot)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={spreadConfig.mode === 'auto'}
                    value={isNaN(spreadConfig.value) ? '' : spreadConfig.value}
                    onChange={(e) => handleUpdateSpread(asset.symbol, 'value', parseFloat(e.target.value))}
                    className="bg-slate-900 border border-white/10 rounded-lg p-2 text-white w-48 text-xs"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave(asset.symbol)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all h-10 mt-4"
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpreadManager;
