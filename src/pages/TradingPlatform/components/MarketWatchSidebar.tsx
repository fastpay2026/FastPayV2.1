import React from 'react';
import MarketWatch from './MarketWatch';
import { TradeAsset } from '../../../../types';

interface MarketWatchSidebarProps {
  isSidebarOpen: boolean;
  setSymbol: (symbol: string) => void;
  symbol: string;
  assets: TradeAsset[];
  assetsLoading: boolean;
  spreads: Record<string, { value: number, mode: 'manual' | 'auto' }>;
}

const MarketWatchSidebar: React.FC<MarketWatchSidebarProps> = ({ isSidebarOpen, setSymbol, symbol, assets, assetsLoading, spreads }) => {
  return (
    <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-80 flex-col absolute md:relative z-20 h-full bg-[#0b0e11] border-r border-white/10`}>
      <MarketWatch
        onSelectAsset={setSymbol}
        selectedSymbol={symbol}
        assets={assets}
        loading={assetsLoading}
        spreads={spreads}
      />
    </div>
  );
};

export default MarketWatchSidebar;
