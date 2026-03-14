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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">مركز التحكم الذكي</h1>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold text-white mb-4">البوتات المفعلة ({botUsers.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {botUsers.map(bot => (
            <div key={bot.id} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex justify-between items-center">
              <span className="text-white font-bold">{bot.username}</span>
              <span className="text-emerald-400 text-xs font-bold">مفعل</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
          <AdminTradingBot accounts={accounts} setAccounts={setAccounts} onUpdateUser={onUpdateUser} />
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
