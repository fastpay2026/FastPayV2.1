import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { User, TradeOrder } from '../../types';

interface Props {
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  onUpdateUser: (user: User) => void;
  tradeOrders: TradeOrder[];
}

const AdminTradingBot: React.FC<Props> = ({ accounts, setAccounts, onUpdateUser, tradeOrders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);

  const positions = tradeOrders.filter(o => o.status === 'open' && (o.is_bot || accounts.find(u => u.id === o.userId)?.isBot));

  const updatePosition = async (id: string, updates: any) => {
    await supabase.from('trade_orders').update(updates).eq('id', id);
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser) return;
    const updatedUser = { ...selectedUser, balance: newBalance };
    await onUpdateUser(updatedUser);
    setSelectedUser(null);
    setNewBalance(0);
    alert('تم تحديث الرصيد بنجاح');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">لوحة تحكم البوت والأدمن</h1>

      {/* User Balance Section */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
        <h2 className="text-lg font-bold text-white mb-4">تعديل رصيد المستخدم</h2>
        <div className="flex gap-4">
          <select 
            className="bg-slate-900 text-white p-2 rounded"
            onChange={(e) => setSelectedUser(accounts.find(u => u.id === e.target.value) || null)}
          >
            <option value="">اختر مستخدم</option>
            {accounts.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
          {selectedUser && (
            <>
              <input 
                type="number" 
                value={newBalance} 
                onChange={(e) => setNewBalance(Number(e.target.value))}
                className="bg-slate-900 text-white p-2 rounded"
              />
              <button onClick={handleBalanceUpdate} className="bg-sky-600 text-white px-4 py-2 rounded">تحديث</button>
            </>
          )}
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-white/5">
        <h2 className="text-lg font-bold text-white mb-4">الصفقات المفتوحة</h2>
        <table className="w-full text-white">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="p-2">اسم البوت</th>
              <th className="p-2">الرمز</th>
              <th className="p-2">Take Profit</th>
              <th className="p-2">Stop Loss</th>
              <th className="p-2">البوت</th>
              <th className="p-2">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(pos => {
              const isBot = pos.is_bot || accounts.find(u => u.id === pos.userId)?.isBot;
              const username = pos.username || accounts.find(u => u.id === pos.userId)?.username || pos.userId;

              return (
                <tr key={pos.id} className="border-b border-white/5">
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="font-bold">{username}</span>
                      {isBot && <span className="text-emerald-400 text-[10px] font-black uppercase tracking-tighter">🤖 BOT</span>}
                    </div>
                  </td>
                  <td className="p-2">{pos.assetSymbol}</td>
                <td className="p-2">
                  <input type="number" defaultValue={pos.forced_take_profit} onBlur={(e) => updatePosition(pos.id, { forced_take_profit: Number(e.target.value) })} className="bg-slate-900 w-20 p-1 rounded" />
                </td>
                <td className="p-2">
                  <input type="number" defaultValue={pos.forced_stop_loss} onBlur={(e) => updatePosition(pos.id, { forced_stop_loss: Number(e.target.value) })} className="bg-slate-900 w-20 p-1 rounded" />
                </td>
                <td className="p-2">
                  <input type="checkbox" defaultChecked={pos.is_bot_enabled} onChange={(e) => updatePosition(pos.id, { is_bot_enabled: e.target.checked })} />
                </td>
                <td className="p-2">
                  <button onClick={() => updatePosition(pos.id, { status: 'closed_profit' })} className="bg-red-600 px-2 py-1 rounded">إغلاق</button>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTradingBot;
