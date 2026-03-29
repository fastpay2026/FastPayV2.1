import React from 'react';
import { formatCurrency } from '../../../utils/marketUtils';
import { usePriceStore } from '../store/usePriceStore';

interface TradeControlsProps {
  volume: number;
  setVolume: (volume: number) => void;
  sl: number | '';
  setSl: (sl: number | '') => void;
  tp: number | '';
  setTp: (tp: number | '') => void;
  orderMode: 'market' | 'pending';
  setOrderMode: (mode: 'market' | 'pending') => void;
  pendingType: 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';
  setPendingType: (type: 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop') => void;
  triggerPrice: number | '';
  setTriggerPrice: (price: number | '') => void;
  commission: number;
  handleTradeAction: (type: 'Buy' | 'Sell') => void;
  symbol: string;
  formattedBid: string;
  formattedAsk: string;
  selectedOrder?: any;
}

const TradeControls: React.FC<TradeControlsProps> = ({ 
  volume, setVolume, sl, setSl, tp, setTp, 
  orderMode, setOrderMode, pendingType, setPendingType, triggerPrice, setTriggerPrice,
  commission, handleTradeAction, symbol, formattedBid, formattedAsk, selectedOrder
}) => {

  return (
    <div className="flex flex-col gap-4">
      <div className="flex bg-[#1e2329] p-1 rounded-lg">
        <button 
          onClick={() => setOrderMode('market')}
          className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${orderMode === 'market' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Market
        </button>
        <button 
          onClick={() => setOrderMode('pending')}
          className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${orderMode === 'pending' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Pending
        </button>
      </div>

      {orderMode === 'pending' && (
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Order Type</label>
          <select 
            value={pendingType} 
            onChange={(e) => setPendingType(e.target.value as any)}
            className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 focus:border-sky-500 outline-none"
          >
            <option value="buy_limit">Buy Limit</option>
            <option value="sell_limit">Sell Limit</option>
            <option value="buy_stop">Buy Stop</option>
            <option value="sell_stop">Sell Stop</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="text-xs text-slate-400 font-bold uppercase">Bid</div>
        <div className="font-mono font-bold text-red-400 text-2xl">
          {formattedBid}
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase mt-2">Ask</div>
        <div className="font-mono font-bold text-emerald-400 text-2xl">
          {formattedAsk}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-slate-400 font-bold uppercase">Lot Size</label>
        <input type="number" step="0.01" value={isNaN(volume) ? '' : volume} onChange={(e) => { const val = parseFloat(e.target.value); setVolume(isNaN(val) ? 0 : val); }} className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 focus:border-sky-500 outline-none" />
      </div>

      {orderMode === 'pending' && (
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Entry Price</label>
          <input 
            type="number" 
            step="0.00001" 
            value={triggerPrice} 
            onChange={(e) => setTriggerPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} 
            className="bg-[#1e2329] text-white p-2 rounded text-sm w-full border border-white/5 focus:border-sky-500 outline-none" 
            placeholder="0.00000"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Stop Loss</label>
          <input 
            type="number" 
            step="0.00001" 
            min="0"
            value={sl} 
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
              if (val === '' || val >= 0) setSl(val);
            }} 
            className="bg-[#1e2329] text-white p-2 rounded text-xs w-full border border-red-500 focus:border-red-500 outline-none" 
            placeholder="None" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Take Profit</label>
          <input 
            type="number" 
            step="0.00001" 
            min="0"
            value={tp} 
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
              if (val === '' || val >= 0) setTp(val);
            }} 
            className="bg-[#1e2329] text-white p-2 rounded text-xs w-full border border-emerald-500 focus:border-emerald-500 outline-none" 
            placeholder="None" 
          />
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Commission:</span>
        <span className="text-white font-bold">${formatCurrency(commission || 0)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button onClick={() => handleTradeAction('Buy')} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded text-sm font-bold transition-colors uppercase">Buy</button>
        <button onClick={() => handleTradeAction('Sell')} className="bg-red-600 hover:bg-red-500 text-white py-3 rounded text-sm font-bold transition-colors uppercase">Sell</button>
      </div>
    </div>
  );
};

export default TradeControls;
