import React from 'react';
import { LayoutDashboard, Activity } from 'lucide-react';
import { TradeAsset } from '../../../../types';
import { getPrecision } from '../../../utils/marketUtils';
import { usePriceStore } from '../store/usePriceStore';

interface TradingHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  assets: TradeAsset[];
  isFeedActive: boolean;
  layout: '1' | '2v' | '2h' | '4';
  setLayout: (layout: '1' | '2v' | '2h' | '4') => void;
}

const TradingHeader: React.FC<TradingHeaderProps> = ({ isSidebarOpen, setIsSidebarOpen, assets, isFeedActive, layout, setLayout }) => {
  const prices = usePriceStore((state) => state.prices);

  return (
    <div className="h-10 bg-[#161a1e] border-b border-white/10 flex items-center px-2 gap-2 shrink-0">
      <button className="md:hidden p-1" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <LayoutDashboard size={18} className="text-white" />
      </button>
      <div className="flex items-center gap-2 text-[10px] font-light text-slate-400">
        <Activity size={12} className="text-emerald-500 animate-pulse" />
        <span>Equinix LD4 - London Gateway [Connected]</span>
      </div>
      <div className="flex-1" />
      <div className="flex gap-1">
        {(['1', '2v', '2h', '4'] as const).map((l) => (
          <button 
            key={l}
            onClick={() => setLayout(l)}
            className={`px-2 py-1 text-[10px] rounded ${layout === l ? 'bg-sky-600 text-white' : 'bg-[#1e2329] text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TradingHeader;
