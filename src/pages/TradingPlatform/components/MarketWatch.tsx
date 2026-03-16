import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { TradeAsset } from '../../../types';

interface MarketWatchProps {
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
}

const MarketWatch: React.FC<MarketWatchProps> = ({ onSelectAsset, selectedSymbol }) => {
  const [assets, setAssets] = useState<TradeAsset[]>([
    { id: '1', symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'Forex Major', price: 1.0850, digits: 5, spread: 12, change_24h: 0.15, is_frozen: false },
    { id: '2', symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'Metals', price: 2155.20, digits: 2, spread: 35, change_24h: -0.45, is_frozen: false },
    { id: '3', symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'Crypto', price: 68450.00, digits: 2, spread: 500, change_24h: 2.5, is_frozen: false }
  ]);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Forex Major', 'Forex Crosses', 'Metals', 'Indices', 'Energies', 'Crypto'];

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        console.log('[MarketWatch] Fetching assets from Supabase...');
        const { data, error } = await supabase
          .from('trade_assets')
          .select('*');

        if (error) {
          console.error('[MarketWatch] Supabase Error:', error.message);
        } else if (data) {
          console.log('[MarketWatch] Raw assets received:', data.length, data);
          setAssets(data as TradeAsset[]);
        } else {
          console.warn('[MarketWatch] No data returned from Supabase.');
        }
      } catch (err: any) {
        console.error('[MarketWatch] Unexpected Error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();

    // Realtime subscription for immediate UI updates
    const channel = supabase
      .channel('market_watch_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_assets' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAssets(prev => [...prev, payload.new as TradeAsset].sort((a, b) => a.symbol.localeCompare(b.symbol)));
        } else if (payload.eventType === 'UPDATE') {
          setAssets(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        } else if (payload.eventType === 'DELETE') {
          setAssets(prev => prev.filter(a => a.id !== payload.old.id));
        }
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
      matchesCategory = a.category === category;
    }

    const matchesSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || 
                         (a.description && a.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#131722] border-r border-white/10">
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
          <thead className="sticky top-0 bg-[#131722] z-10 shadow-sm">
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
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 text-xs italic">No assets found</td>
              </tr>
            ) : (
              filteredAssets.map(asset => {
                const isSelected = selectedSymbol === asset.symbol;
                const isPositive = (asset.change_24h || 0) >= 0;
                
                return (
                  <tr
                    key={asset.id}
                    onClick={() => onSelectAsset(asset.symbol)}
                    className={`group cursor-pointer border-b border-white/5 transition-all duration-200 ${
                      isSelected ? 'bg-sky-500/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-sky-400' : 'text-slate-200 group-hover:text-white'}`}>
                          {asset.symbol}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[80px]">
                          {asset.description || asset.category}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                          isSelected ? 'text-sky-400' : 'text-white'
                        }`}>
                          {asset.price?.toFixed(asset.digits || 2)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                        {asset.spread}
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
};

export default MarketWatch;
