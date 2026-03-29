import React from 'react';
import LightweightChart from './LightweightChart';
import LiveMarketFeed from './LiveMarketFeed';
import { getPrecision, calculateBidAsk } from '../../../utils/marketUtils';
import { TradeAsset } from '../../../../types';
import { usePriceStore } from '../store/usePriceStore';

interface ChartAreaProps {
  assetsLoading: boolean;
  symbol: string;
  marketData: any;
  chartType: 'candlestick' | 'line';
  setChartType: (type: 'candlestick' | 'line') => void;
  currentSpread: number;
  currentAsset: any;
  candleSeriesRef: any;
  trades: any[];
  assets: TradeAsset[];
  positions?: any[];
  pendingOrders?: any[];
  selectedOrderId?: string | null;
  onUpdateOrders?: () => void;
  onPriceChange?: (orderId: string, type: 'sl' | 'tp' | 'entry', price: number) => void;
  onSelectOrder?: (orderId: string | null) => void;
  draftSL?: number | '';
  draftTP?: number | '';
  draftType?: 'buy' | 'sell';
  draftAmount?: number;
  draftEntryPrice?: number;
}

const ChartArea: React.FC<ChartAreaProps> = ({ 
  assetsLoading, symbol, marketData, chartType, setChartType, 
  currentSpread, currentAsset, candleSeriesRef, trades, assets,
  positions = [], pendingOrders = [], selectedOrderId, onUpdateOrders, onPriceChange, onSelectOrder,
  draftSL, draftTP, draftType, draftAmount, draftEntryPrice
}) => {
  const price = usePriceStore((state) => state.prices[symbol] || Number(currentAsset?.price || 0));
  const { bid } = calculateBidAsk(Number(price), currentSpread, symbol, currentAsset?.type, getPrecision(symbol));
  
  return (
    <div className="flex-1 p-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 relative">
        {assetsLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#161a1e] text-slate-400">
            Loading Chart...
          </div>
        ) : (
          <LightweightChart
            symbol={symbol}
            price={Number(bid)}
            digits={getPrecision(symbol)}
            chartType={chartType}
            setChartType={setChartType}
            spread={currentSpread}
            assetType={currentAsset?.type}
            seriesRef={candleSeriesRef}
            positions={positions}
            pendingOrders={pendingOrders}
            selectedOrderId={selectedOrderId}
            onUpdateOrders={onUpdateOrders}
            onPriceChange={onPriceChange}
            onSelectOrder={onSelectOrder}
            draftSL={draftSL}
            draftTP={draftTP}
            draftType={draftType}
            draftAmount={draftAmount}
            draftEntryPrice={draftEntryPrice}
          />
        )}
      </div>
    </div>
  );
};

export default ChartArea;
