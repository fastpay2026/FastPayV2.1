import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import { TradeAsset } from '../../../../types';
import { getPrecision, calculateBidAsk, formatPrice } from '../../../utils/marketUtils';
import { usePriceStore } from '../store/usePriceStore';

interface MarketWatchProps {
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
  assets: TradeAsset[];
  loading?: boolean;
  spreads?: Record<string, { value: number, mode: 'manual' | 'auto', commission?: number }>;
}

const MarketWatch = React.memo(({ onSelectAsset, selectedSymbol, assets, loading = false, spreads = {} }: MarketWatchProps) => {
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = React.useRef<Record<string, number>>({});
  const prices = usePriceStore((state) => state.prices);
  const lastUpdated = usePriceStore((state) => state.lastUpdated);

  useEffect(() => {
    // Track price changes for visual flash effect
    const newFlash: Record<string, 'up' | 'down' | null> = {};
    let hasChanges = false;

    assets.forEach(asset => {
      const currentPrice = prices[asset.symbol] || asset.price;
      const prevPrice = prevPricesRef.current[asset.symbol];
      if (prevPrice !== undefined && prevPrice !== currentPrice) {
        newFlash[asset.symbol] = currentPrice > prevPrice ? 'up' : 'down';
        hasChanges = true;
      }
      prevPricesRef.current[asset.symbol] = currentPrice;
    });

    if (hasChanges) {
      setPriceFlash(prev => ({ ...prev, ...newFlash }));
      const timer = setTimeout(() => {
        setPriceFlash({});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [assets, prices]);

  const categories = ['All', 'Forex Major', 'Forex Crosses', 'Metals', 'Indices', 'Energies', 'Crypto'];

  useEffect(() => {
    // Realtime subscription for immediate UI updates
    const channel = supabase
      .channel('market_watch_realtime_local')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'trade_assets' 
      }, (payload) => {
        setLastUpdatedId(payload.new.id);
        setTimeout(() => setLastUpdatedId(null), 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredAssets = assets.filter(a => {
    let matchesCategory = false;
    if (category === 'All') {
      matchesCategory = true;
    } else {
      // Fallback to type if category is missing
      const assetCategory = a.category || (
        a.type === 'crypto' ? 'Crypto' :
        a.type === 'forex' ? 'Forex Major' :
        a.type === 'metal' ? 'Metals' :
        a.type === 'index' ? 'Indices' :
        a.type === 'energy' ? 'Energies' : 'Other'
      );
      matchesCategory = assetCategory === category;
    }

    const matchesSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || 
                         (a.description && a.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#161a1e] border-r border-white/10">
      {/* Header & Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1e2329] border border-white/5 rounded py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-white/10 bg-[#0b0e11]">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              category === cat ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-400/5' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat.replace('Forex ', '')}
          </button>
        ))}
      </div>

      {/* Assets Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#161a1e] z-10 shadow-sm">
            <tr className="text-[10px] text-slate-500 uppercase font-bold border-b border-white/5">
              <th className="p-3 font-medium">Symbol</th>
              <th className="p-3 font-medium text-right">Price</th>
              <th className="p-3 font-medium text-right">Spread</th>
              <th className="p-3 font-medium text-right">24h%</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Loading Market...</span>
                  </div>
                </td>
              </tr>
            ) : (Array.isArray(filteredAssets) && filteredAssets.length === 0) ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 text-xs italic">No assets found</td>
              </tr>
            ) : (
              (Array.isArray(filteredAssets) ? filteredAssets : []).map(asset => {
                const isSelected = selectedSymbol === asset.symbol;
                const isPositive = (asset.change_24h || 0) >= 0;
                
                const spreadConfig = spreads[asset.symbol] || { value: asset.spread || 0 };
                let currentPrice;
                if (prices[asset.symbol]) {
                  currentPrice = prices[asset.symbol];
                } else {
                  currentPrice = asset.symbol === 'XAUUSD' ? Number(asset.price) * 1.94377 : Number(asset.price);
                }
                
                const { bid, ask } = calculateBidAsk(Number(currentPrice), spreadConfig.value, asset.symbol, asset.type, asset.digits);
                
                const formattedBid = formatPrice(Number(bid), asset.symbol, asset.digits);
                const formattedAsk = formatPrice(Number(ask), asset.symbol, asset.digits);
                
                // Format spread for display: show the direct value from the database
                const displaySpread = spreadConfig.value.toString();
                
                return (
                  <tr
                    key={asset.id}
                    onClick={() => onSelectAsset(asset.symbol)}
                    className={`group cursor-pointer border-b border-white/5 transition-all duration-500 ${
                      isSelected ? 'bg-sky-500/10' : 
                      (priceFlash[asset.symbol] === 'up' ? 'bg-emerald-500/5' :
                      priceFlash[asset.symbol] === 'down' ? 'bg-red-500/5' :
                      lastUpdatedId === asset.id ? 'bg-emerald-500/10' : 'hover:bg-white/5')
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold transition-colors ${
                          isSelected ? 'text-sky-400' : 
                          (priceFlash[asset.symbol] === 'up' ? 'text-emerald-400' :
                          priceFlash[asset.symbol] === 'down' ? 'text-red-400' : 'text-slate-200 group-hover:text-white')
                        }`}>
                          {asset.symbol}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[80px]">
                          {asset.description || asset.category}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono font-bold transition-colors duration-300 text-red-400`}>
                          {formattedBid}
                        </span>
                        <span className={`font-mono font-bold transition-colors duration-300 text-emerald-400`}>
                          {formattedAsk}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {displaySpread}
                      </span>
                    </td>
                    <td className={`p-3 text-right text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(asset.change_24h || 0).toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#0b0e11] border-t border-white/10 flex justify-between items-center">
        <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Live Market Feed</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-bold uppercase">Active</span>
        </div>
      </div>
    </div>
  );
});

export default MarketWatch;
