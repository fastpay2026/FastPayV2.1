import React from 'react';
import LightweightChart from './LightweightChart';
import { getPrecision } from '../../../utils/marketUtils';
import { usePriceStore } from '../store/usePriceStore';

interface ChartConfig {
  id: string;
  symbol: string;
  timeframe: string;
}

interface MultiChartLayoutProps {
  layout: '1' | '2v' | '2h' | '4';
  charts: ChartConfig[];
  activeChartId: string;
  setActiveChartId: (id: string) => void;
  positions: any[];
  pendingOrders: any[];
  marketData: Record<string, any>;
  onUpdateOrders: () => void;
  onSelectOrder: (orderId: string | null) => void;
  onPriceChange: (orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => void;
  assets: any[];
  spreads: Record<string, any>;
  [key: string]: any;
}

const MultiChartLayout: React.FC<MultiChartLayoutProps> = ({ 
  layout, charts, activeChartId, setActiveChartId,
  positions, pendingOrders, marketData,
  onUpdateOrders, onSelectOrder, onPriceChange,
  assets, spreads, ...props
}) => {
  const prices = usePriceStore((state) => state.prices);

  const getGridClass = () => {
    switch (layout) {
      case '2v': return 'grid-cols-2';
      case '2h': return 'grid-rows-2';
      case '4': return 'grid-cols-2 grid-rows-2';
      default: return 'grid-cols-1';
    }
  };

  return (
    <div className={`grid h-full w-full gap-1 ${getGridClass()}`}>
      {charts.map((chart) => {
        const asset = assets.find(a => a.symbol === chart.symbol);
        const spreadConfig = spreads[chart.symbol] || { value: asset?.spread || 0 };
        const digits = asset?.digits !== undefined ? asset.digits : getPrecision(chart.symbol);
        const price = prices[chart.symbol] || Number(asset?.price || 0);
        
        return (
          <div 
            key={chart.id}
            className={`relative border ${activeChartId === chart.id ? 'border-sky-500' : 'border-white/10'}`}
            onClick={() => setActiveChartId(chart.id)}
          >
            <LightweightChart 
              {...props}
              symbol={chart.symbol}
              price={price}
              digits={digits}
              positions={positions}
              pendingOrders={pendingOrders}
              onUpdateOrders={onUpdateOrders}
              onSelectOrder={onSelectOrder}
              onPriceChange={onPriceChange}
              spread={spreadConfig.value}
              asset={asset}
              assetType={asset?.type || 'forex'}
            />
            {activeChartId === chart.id && (
              <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] px-1">ACTIVE</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MultiChartLayout;
