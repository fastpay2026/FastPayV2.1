import React from 'react';
import { formatPrice } from '../../../utils/marketUtils';
import { TradeAsset } from '../../../../types';

interface Trade {
  id: string;
  username: string;
  asset_symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
  status: string;
  digits?: number;
}

interface LiveMarketFeedProps {
  trades: Trade[];
  assets: TradeAsset[];
}

const maskUsername = (username: string) => {
  if (!username) return 'User***';
  if (username.length <= 2) return username + '***';
  return username.substring(0, 2) + '****';
};

const LiveMarketFeed: React.FC<LiveMarketFeedProps> = React.memo(({ trades, assets }) => {
  return (
    <div className="h-full w-full bg-black flex flex-col select-none overflow-hidden border border-white/10 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#050505]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.9)]" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Live Execution</span>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-y-auto scrollbar-hide bg-black">
        <div className="flex flex-col">
          {(trades || [])
            .filter(t => t.status === 'open')
            .map((trade) => {
              const asset = assets.find(a => a.symbol === trade.asset_symbol);
              const isBuy = (trade?.type || 'buy').toLowerCase() === 'buy';
              
              return (
                <div key={trade?.id} className="flex items-center justify-between px-3 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black text-[14px] tracking-tight">{trade?.asset_symbol}</span>
                      <span className={`text-[13px] font-black uppercase ${
                        isBuy ? 'text-[#00ff00] drop-shadow-[0_0_5px_rgba(0,255,0,0.6)]' : 'text-[#ff3333] drop-shadow-[0_0_5px_rgba(255,51,51,0.6)]'
                      }`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between opacity-80">
                      <span className="text-slate-400 font-bold text-[11px] uppercase tracking-tighter">
                        {maskUsername(trade?.username || '')}
                      </span>
                      <span className="text-white/90 font-mono font-bold text-[11px]">
                        {Number(trade?.amount || 0).toFixed(2)} LOTS
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          {(trades || []).filter(t => t.status === 'open').length === 0 && (
            <div className="p-10 text-center text-slate-500 text-[10px] uppercase tracking-widest opacity-30">
              No Active Trades
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
});

export default LiveMarketFeed;
