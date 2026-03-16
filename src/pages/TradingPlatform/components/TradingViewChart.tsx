import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const TradingViewChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  return (
    <div className="w-full h-full bg-[#131722] rounded-lg overflow-hidden border border-white/10">
      <AdvancedRealTimeChart
        symbol={symbol}
        theme="dark"
        interval="1"
        autosize
        hide_side_toolbar={false}
        allow_symbol_change={true}
      />
    </div>
  );
};

export default TradingViewChart;
