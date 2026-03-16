import React from 'react';

interface Trade {
  username: string;
  asset_symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
}

interface LiveMarketFeedProps {
  trades: Trade[];
}

const LiveMarketFeed: React.FC<LiveMarketFeedProps> = ({ trades }) => {
  console.log('LiveMarketFeed: Rendering with trades:', trades.length);
  return (
    <div className="h-64 bg-[#131722] border-t border-white/10 overflow-y-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
          <tr>
            <th className="p-2">Trader</th>
            <th className="p-2">Symbol</th>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {trades.length > 0 ? (
            trades.map((trade, index) => (
              <tr key={index} className="border-b border-white/5">
                <td className="p-2 text-white font-bold">{trade.username || 'Trader'}</td>
                <td className="p-2">{trade.asset_symbol}</td>
                <td className={`p-2 font-bold ${(trade.type || 'buy').toLowerCase() === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(trade.type || 'BUY').toUpperCase()}
                </td>
                <td className="p-2">${Number(trade.amount || 0).toFixed(2)}</td>
                <td className="p-2">${Number(trade.entry_price || 0).toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-500">No active trades</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LiveMarketFeed;
