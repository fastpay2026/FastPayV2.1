import React from 'react';

interface OrderBookProps {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, bids, asks }) => {
  return (
    <div className="bg-[#131722] border-l border-white/10 p-4 flex flex-col gap-2 text-xs">
      <h3 className="text-white font-bold text-sm mb-2">Order Book: {symbol}</h3>
      <div className="flex flex-col-reverse">
        {asks.map((ask, i) => (
          <div key={i} className="flex justify-between text-red-400">
            <span>{ask[0].toFixed(2)}</span>
            <span>{ask[1].toFixed(4)}</span>
          </div>
        ))}
      </div>
      <div className="text-center font-bold text-white py-1">Spread</div>
      <div className="flex flex-col">
        {bids.map((bid, i) => (
          <div key={i} className="flex justify-between text-emerald-400">
            <span>{bid[0].toFixed(2)}</span>
            <span>{bid[1].toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderBook;
