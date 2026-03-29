import React from 'react';
import { formatCurrency } from '../../../utils/marketUtils';

interface MarginBarProps {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
}

const MarginBar: React.FC<MarginBarProps> = ({ balance, equity, margin, freeMargin }) => {
  return (
    <div className="bg-[#161a1e] border-t border-white/10 p-2 grid grid-cols-4 gap-4 text-xs">
      <div className="flex flex-col">
        <span className="text-slate-400">Balance</span>
        <span className="text-white font-bold">${formatCurrency(balance)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400">Equity</span>
        <span className="text-white font-bold">${formatCurrency(equity)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400">Used Margin</span>
        <span className="text-white font-bold">${formatCurrency(margin)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400">Free Margin</span>
        <span className="text-white font-bold">${formatCurrency(freeMargin)}</span>
      </div>
    </div>
  );
};

export default MarginBar;
