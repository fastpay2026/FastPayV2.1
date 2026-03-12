import React, { useState } from 'react';
import TradingViewChart from './components/TradingViewChart';
import { LayoutDashboard, BarChart3, ListChecks, Settings, Bell } from 'lucide-react';

const TradingPlatform: React.FC = () => {
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  const [activeTab, setActiveTab] = useState('Trade');

  const balance = { balance: 10000, equity: 10050, margin: 500, freeMargin: 9550 };
  const positions = [
    { id: 1, symbol: 'BTCUSDT', type: 'Buy', volume: 0.1, price: 50000, sl: 49000, tp: 52000, profit: 50 },
    { id: 2, symbol: 'EURUSD', type: 'Sell', volume: 1.0, price: 1.05, sl: 1.06, tp: 1.04, profit: -20 },
  ];

  return (
    <div className="flex h-screen bg-[#0b0e11] text-slate-300 font-sans overflow-hidden">
      {/* القائمة الجانبية للأدوات */}
      <div className="w-64 bg-[#131722] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 font-bold text-white flex items-center gap-2">
          <BarChart3 size={20} /> Market Watch
        </div>
        <div className="flex-1 overflow-y-auto">
          {['BTCUSDT', 'EURUSD', 'XAUUSD'].map(s => (
            <button 
              key={s} 
              onClick={() => setSymbol(`BINANCE:${s}`)}
              className="w-full p-4 hover:bg-white/5 text-left border-b border-white/5"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* الشارت في المنتصف */}
      <div className="flex-1 flex flex-col">
        {/* أيقونات MT5 */}
        <div className="h-12 bg-[#131722] border-b border-white/10 flex items-center px-4 gap-4">
          <LayoutDashboard size={20} className="text-sky-400" />
          <BarChart3 size={20} className="text-slate-400" />
          <ListChecks size={20} className="text-slate-400" />
          <div className="flex-1" />
          <Bell size={20} className="text-slate-400" />
          <Settings size={20} className="text-slate-400" />
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 p-2">
            <TradingViewChart symbol={symbol} />
          </div>
          
          {/* لوحة تنفيذ الصفقات الجانبية */}
          <div className="w-48 bg-[#131722] border-l border-white/10 p-4 flex flex-col gap-4">
            <h3 className="text-white font-bold text-sm">Order</h3>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-sm font-bold">BUY</button>
            <button className="w-full bg-red-600 hover:bg-red-500 text-white py-1.5 rounded text-sm font-bold">SELL</button>
          </div>
        </div>
        
        {/* منطقة الرصيد */}
        <div className="h-10 bg-[#1e2329] border-t border-white/10 flex items-center px-4 gap-6 text-xs font-mono">
          <span>Balance: <span className="text-white">${balance.balance}</span></span>
          <span>Equity: <span className="text-white">${balance.equity}</span></span>
          <span>Margin: <span className="text-white">${balance.margin}</span></span>
          <span>Free Margin: <span className="text-white">${balance.freeMargin}</span></span>
        </div>

        {/* جدول الصفقات (Terminal) */}
        <div className="h-48 bg-[#131722] border-t border-white/10 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e2329] text-slate-400 sticky top-0">
              <tr>
                <th className="p-2">Symbol</th>
                <th className="p-2">Type</th>
                <th className="p-2">Volume</th>
                <th className="p-2">Price</th>
                <th className="p-2">S/L</th>
                <th className="p-2">T/P</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-white font-bold">{p.symbol}</td>
                  <td className={`p-2 ${p.type === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>{p.type}</td>
                  <td className="p-2">{p.volume}</td>
                  <td className="p-2">{p.price}</td>
                  <td className="p-2">{p.sl}</td>
                  <td className="p-2">{p.tp}</td>
                  <td className={`p-2 ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.profit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingPlatform;
