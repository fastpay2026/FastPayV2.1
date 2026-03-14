import React from 'react';
import AdminTradingBot from './AdminTradingBot';
import DealsEngine from './DealsEngine';
import TradingControl from './TradingControl';
import GhostTraders from './GhostTraders';
import { User, TradeAsset, TradeOrder } from '../../types';

interface Props {
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  onUpdateUser: (user: User) => void;
  tradeAssets: TradeAsset[];
  setTradeAssets: React.Dispatch<React.SetStateAction<TradeAsset[]>>;
  tradeOrders: TradeOrder[];
  setTradeOrders: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
}

const SmartControlCenter: React.FC<Props> = ({ 
  accounts, setAccounts, onUpdateUser, 
  tradeAssets, setTradeAssets, tradeOrders, setTradeOrders 
}) => {
  const botUsers = accounts.filter(u => u.isBot);
  
  // Identify bots that have active trades
  const activeBotIds = new Set(tradeOrders.filter(o => o.status === 'open').map(o => o.userId));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">مركز التحكم الذكي</h1>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold text-white mb-4">البوتات النشطة حالياً ({activeBotIds.size})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {botUsers.map(bot => {
            const isActive = activeBotIds.has(bot.id);
            return (
              <div key={bot.id} className={`p-4 rounded-xl border transition-all ${isActive ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-slate-900 border-white/5 opacity-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{bot.username}</span>
                    <span className="text-[10px] text-slate-500">{bot.id.substring(0, 8)}...</span>
                  </div>
                  {isActive ? (
                    <div className="flex flex-col items-end">
                      <span className="text-emerald-400 text-[10px] font-black animate-pulse">● نشط الآن</span>
                      <span className="text-[9px] text-emerald-500/70">يفتح صفقات</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-[10px]">خامل</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
          <AdminTradingBot accounts={accounts} setAccounts={setAccounts} onUpdateUser={onUpdateUser} tradeOrders={tradeOrders} />
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
          <DealsEngine 
            tradeAssets={tradeAssets} 
            setTradeAssets={setTradeAssets} 
            tradeOrders={tradeOrders} 
            setTradeOrders={setTradeOrders} 
            setAccounts={setAccounts} 
            onUpdateUser={onUpdateUser} 
          />
        </div>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
        <TradingControl />
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
        <GhostTraders />
      </div>
    </div>
  );
};

export default SmartControlCenter;
