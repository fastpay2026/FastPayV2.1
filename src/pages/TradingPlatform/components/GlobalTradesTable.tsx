import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradeAsset } from '../../../../types';
import { formatPrice } from '../../../utils/marketUtils';

interface Trade {
  id: string;
  username: string;
  asset_symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  entry_price: number;
}

interface GlobalTradesTableProps {
  trades: Trade[];
  assets: TradeAsset[];
}

const maskUsername = (username: string) => {
  if (!username) return 'User***';
  return username.substring(0, Math.min(username.length, 2)) + '****';
};

const GlobalTradesTable: React.FC<GlobalTradesTableProps> = React.memo(({ trades, assets }) => {
  return (
    <div className="h-full overflow-y-auto bg-[#161a1e]">
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
        <tbody className="relative">
          <AnimatePresence>
            {(trades || []).map(t => {
              const asset = assets.find(a => a.symbol === t.asset_symbol);
              const priceFormatted = formatPrice(Number(t?.entry_price || 0), t.asset_symbol, asset?.digits);
              
              return (
                <motion.tr
                  key={t?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-2 text-slate-300">{maskUsername(t.username)}</td>
                  <td className="p-2 font-bold text-white">{t?.asset_symbol}</td>
                  <td className={`p-2 font-bold uppercase ${(t?.type || 'buy') === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{t?.type}</td>
                  <td className="p-2 text-slate-300">{t?.amount}</td>
                  <td className="p-2 font-mono text-slate-300">{priceFormatted}</td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
});

export default GlobalTradesTable;
