import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { TradeAsset } from '../../../../types';
import { formatPrice, formatCurrency, getContractSize } from '../../../utils/marketUtils';
import { usePriceStore } from '../store/usePriceStore';
import LiveMarketFeed from './LiveMarketFeed';

interface PositionsTableProps {
  positions: any[];
  pendingOrders: any[];
  closedTrades: any[];
  trades: any[];
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string | null) => void;
  assets: TradeAsset[];
  balance: any;
  tradingStatus: any;
  closePositionAction: (position: any, isWin: boolean, profit: number) => void;
  cancelPendingOrder: (orderId: string) => void;
  refreshAll: () => void;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ 
  positions, 
  pendingOrders,
  closedTrades,
  trades,
  selectedOrderId,
  onSelectOrder,
  assets, 
  balance, 
  tradingStatus, 
  closePositionAction,
  cancelPendingOrder,
  refreshAll
}) => {
  const prices = usePriceStore((state) => state.prices);
  const [activeTab, setActiveTab] = useState<'positions' | 'pending' | 'history'>('positions');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex bg-[#1e2329] border-b border-white/5 items-center justify-between">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 ${activeTab === 'positions' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Open Positions ({positions.length})
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 ${activeTab === 'pending' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Pending Orders ({pendingOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 ${activeTab === 'history' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            History ({closedTrades.length})
          </button>
        </div>
        <button 
          onClick={refreshAll}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
            <tr>
              <th className="p-2">Symbol</th>
              <th className="p-2">Type</th>
              <th className="p-2">Volume</th>
              <th className="p-2">{activeTab === 'positions' ? 'Entry' : (activeTab === 'pending' ? 'Trigger' : 'Entry')}</th>
              <th className="p-2">SL</th>
              <th className="p-2">TP</th>
              {activeTab === 'positions' && <th className="p-2">Swap</th>}
              {activeTab === 'positions' && <th className="p-2">Comm</th>}
              {(activeTab === 'positions' || activeTab === 'history') && <th className="p-2">Profit</th>}
              {activeTab !== 'history' && <th className="p-2">Action</th>}
              {activeTab === 'history' && <th className="p-2">Closed At</th>}
            </tr>
          </thead>
          <tbody className="relative">
            <AnimatePresence>
              {activeTab === 'positions' ? (
                (positions || []).map(p => {
                  const asset = assets.find(a => a.symbol === p.asset_symbol);
                  const entryPriceFormatted = formatPrice(Number(p?.entry_price || 0), p.asset_symbol, asset?.digits);
                  const currentPrice = prices[p.asset_symbol] || p.entry_price;
                  const profit = (p.type === 'buy' ? (currentPrice - p.entry_price) : (p.entry_price - currentPrice)) 
                                 * p.amount;
                  
                  return (
                    <motion.tr
                      key={p?.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => onSelectOrder?.(p.id === selectedOrderId ? null : p.id)}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${p.id === selectedOrderId ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : ''} ${p.pending ? 'opacity-50' : ''}`}
                    >
                      <td className="p-2 font-bold text-white flex items-center gap-2">
                        {p.pending && <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>}
                        {p?.asset_symbol}
                      </td>
                      <td className={`p-2 font-bold uppercase ${(p?.type || 'buy') === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p?.type}</td>
                      <td className="p-2">{p?.amount}</td>
                      <td className="p-2 font-mono">
                        {entryPriceFormatted}
                      </td>
                      <td className="p-2 font-mono text-red-400/80">{p?.sl ? formatPrice(Number(p.sl), p.asset_symbol, asset?.digits) : '-'}</td>
                      <td className="p-2 font-mono text-emerald-400/80">{p?.tp ? formatPrice(Number(p.tp), p.asset_symbol, asset?.digits) : '-'}</td>
                      <td className="p-2 font-mono text-slate-400">0.00</td>
                      <td className="p-2 font-mono text-slate-400">{p?.commission != null ? formatCurrency(Number(p.commission)) : '0.00'}</td>
                      <td className={`p-2 font-mono ${profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="p-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); closePositionAction(p, profit > 0, profit); }} 
                          className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                        >
                          Close
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : activeTab === 'pending' ? (
                (pendingOrders || []).map(o => {
                  const asset = assets.find(a => a.symbol === o.asset_symbol);
                  const triggerPriceFormatted = formatPrice(Number(o?.trigger_price || o?.entry_price || 0), o.asset_symbol, asset?.digits);
                  
                  return (
                    <motion.tr
                      key={o?.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => onSelectOrder?.(o.id === selectedOrderId ? null : o.id)}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${o.id === selectedOrderId ? 'bg-sky-500/10 border-l-2 border-l-sky-500' : ''}`}
                    >
                      <td className="p-2 font-bold text-white">{o?.asset_symbol}</td>
                      <td className={`p-2 font-bold uppercase text-sky-400`}>{o?.order_type?.replace('_', ' ')}</td>
                      <td className="p-2">{o?.amount}</td>
                      <td className="p-2 font-mono">
                        {triggerPriceFormatted}
                      </td>
                      <td className="p-2 font-mono text-red-400/80">{o?.sl ? formatPrice(Number(o.sl), o.asset_symbol, asset?.digits) : '-'}</td>
                      <td className="p-2 font-mono text-emerald-400/80">{o?.tp ? formatPrice(Number(o.tp), o.asset_symbol, asset?.digits) : '-'}</td>
                      <td className="p-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); cancelPendingOrder(o.id); }} 
                          className="bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                (closedTrades || []).map(t => {
                  const asset = assets.find(a => a.symbol === t.asset_symbol);
                  const entryPriceFormatted = formatPrice(Number(t?.entry_price || 0), t.asset_symbol, asset?.digits);
                  const profit = Number(t.profit || 0);
                  
                  return (
                    <motion.tr
                      key={t?.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-2 font-bold text-white">{t?.asset_symbol}</td>
                      <td className={`p-2 font-bold uppercase ${(t?.type || 'buy') === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{t?.type}</td>
                      <td className="p-2">{t?.amount}</td>
                      <td className="p-2 font-mono">
                        {entryPriceFormatted}
                      </td>
                      <td className="p-2 font-mono text-red-400/80">{t?.sl ? formatPrice(Number(t.sl), t.asset_symbol, asset?.digits) : '-'}</td>
                      <td className="p-2 font-mono text-emerald-400/80">{t?.tp ? formatPrice(Number(t.tp), t.asset_symbol, asset?.digits) : '-'}</td>
                      <td className={`p-2 font-mono ${profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="p-2 text-[10px] text-slate-400">
                        {t.closed_at ? new Date(t.closed_at).toLocaleString() : '-'}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
            <tr className="bg-[#1e2329] text-slate-200 font-bold border-t-2 border-white/10">
              <td className="p-2" colSpan={2}>Account Summary</td>
              <td className="p-2">Bal: {formatCurrency(balance?.balance || 0)}$</td>
              <td className="p-2">Eq: {formatCurrency(tradingStatus?.equity || 0)}$</td>
              <td className="p-2">Mar: {formatCurrency(tradingStatus?.margin || 0)}$</td>
              <td className="p-2">Free: {formatCurrency(tradingStatus?.freeMargin || 0)}$</td>
              <td className="p-2">Lev: {(tradingStatus?.marginLevel || 0).toFixed(2)}%</td>
              <td className="p-2"></td>
              <td className="p-2"></td>
              <td className="p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PositionsTable;
