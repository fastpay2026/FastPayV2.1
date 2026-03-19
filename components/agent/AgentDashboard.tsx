import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { User, DollarSign, Users, Activity, ShieldAlert, Send, FileCheck, Upload, QrCode, X } from 'lucide-react';
import { User as UserType, TradeOrder } from '../../types';

interface AgentDashboardProps {
  currentUser: UserType | null;
  accounts: UserType[];
  onUpdateUser: (user: UserType) => Promise<void>;
  siteConfig: any;
  tradeOrders: TradeOrder[];
  onLogout: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ currentUser, accounts, onUpdateUser, siteConfig, tradeOrders, onLogout }) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferUser, setTransferUser] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [showReferredUsers, setShowReferredUsers] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      const link = `${window.location.origin}/?ref=${currentUser.id}`;
      QRCode.toDataURL(link).then(url => setQrCode(url));
    }
  }, [currentUser]);
  
  if (!currentUser || currentUser.role !== 'AGENT') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black">Access Denied</h2>
      </div>
    );
  }

  const referredUsers = accounts.filter(a => a.referred_by === currentUser.id);
  const totalEarnings = referredUsers.reduce((sum, user) => sum + (user.balance * (currentUser.agent_percentage || 0) / 100), 0);

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    const targetUser = accounts.find(u => u.username === transferUser);
    
    if (!targetUser || amount <= 0 || amount > currentUser.balance) {
      alert('Invalid transfer details or insufficient balance');
      return;
    }

    await onUpdateUser({ ...currentUser, balance: currentUser.balance - amount });
    await onUpdateUser({ ...targetUser, balance: targetUser.balance + amount });
    
    alert('Transfer successful');
    setTransferAmount('');
    setTransferUser('');
  };

  const getUserLots = (userId: string) => {
    return tradeOrders.filter(o => o.userId === userId).reduce((sum, o) => sum + o.amount, 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white p-8 animate-in fade-in duration-500">
      {/* Logout Button */}
      <div className="absolute top-8 right-8">
        <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-2xl font-black transition-all border border-red-500/20">
          <X className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Header with Centered Logo - Enlarged */}
      <div className="flex justify-center mb-16 mt-16">
        <img src={siteConfig.logoUrl} alt="Logo" className="h-40 md:h-64 drop-shadow-2xl" />
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Stats Cards */}
        <div onClick={() => setShowReferredUsers(true)} className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-sky-500/30 transition-all cursor-pointer">
          <h3 className="font-bold text-slate-400 mb-2">Referred Users</h3>
          <p className="text-5xl font-black">{referredUsers.length}</p>
        </div>
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-emerald-500/30 transition-all">
          <h3 className="font-bold text-slate-400 mb-2">Total Earnings</h3>
          <p className="text-5xl font-black text-emerald-400">${(currentUser.balance + totalEarnings).toFixed(2)}</p>
        </div>
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-sky-500/30 transition-all">
          <h3 className="font-bold text-slate-400 mb-2">Commission Rate</h3>
          <p className="text-5xl font-black text-sky-400">{currentUser.agent_percentage}%</p>
        </div>

        {/* Transfer Card */}
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl md:col-span-2 lg:col-span-1">
          <h3 className="text-xl font-black mb-6">Transfer Balance</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Username" value={transferUser} onChange={e => setTransferUser(e.target.value)} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
            <input type="number" placeholder="Amount" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
            <button onClick={handleTransfer} className="w-full py-4 bg-emerald-600 rounded-2xl font-black hover:bg-emerald-500 transition-all">Transfer</button>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h3 className="text-xl font-black mb-6">Verification</h3>
          <p className="text-slate-400 mb-6">Upload your documents to verify your account.</p>
          <button className="flex items-center justify-center gap-2 w-full py-4 bg-sky-600 rounded-2xl font-black hover:bg-sky-500 transition-all">
            <Upload className="w-5 h-5" /> Upload Documents
          </button>
        </div>

        {/* QR Card */}
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
          <h3 className="text-xl font-black mb-6">Referral QR Code</h3>
          {qrCode && <img src={qrCode} alt="Referral QR Code" className="w-48 h-48 bg-white p-2 rounded-2xl" />}
        </div>
      </div>

      {/* Referred Users Modal */}
      {showReferredUsers && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 w-full max-w-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">Referred Users</h3>
              <button onClick={() => setShowReferredUsers(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="p-4">Username</th>
                    <th className="p-4">Lots</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="p-4 font-bold">{user.username}</td>
                      <td className="p-4 font-mono text-sky-400">{getUserLots(user.id).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
