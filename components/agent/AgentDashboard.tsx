import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { User, DollarSign, Users, Activity, ShieldAlert, Send, FileCheck, Upload, QrCode } from 'lucide-react';
import { User as UserType } from '../../types';

interface AgentDashboardProps {
  currentUser: UserType | null;
  accounts: UserType[];
  onUpdateUser: (user: UserType) => Promise<void>;
  siteConfig: any;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ currentUser, accounts, onUpdateUser, siteConfig }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transfer' | 'verify' | 'qr'>('dashboard');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferUser, setTransferUser] = useState('');
  const [qrCode, setQrCode] = useState('');
  
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

    // Deduct from agent
    await onUpdateUser({ ...currentUser, balance: currentUser.balance - amount });
    // Add to target user
    await onUpdateUser({ ...targetUser, balance: targetUser.balance + amount });
    
    alert('Transfer successful');
    setTransferAmount('');
    setTransferUser('');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <img src={siteConfig.logoUrl} alt="Logo" className="h-16" />
        <div className="flex gap-2 bg-[#111827] p-2 rounded-2xl border border-white/5">
          {(['dashboard', 'transfer', 'verify', 'qr'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-black uppercase text-xs ${activeTab === tab ? 'bg-sky-600 text-white' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-xl">
              <h3 className="font-bold text-slate-400 mb-2">Referred Users</h3>
              <p className="text-4xl font-black">{referredUsers.length}</p>
            </div>
            <div className="bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-xl">
              <h3 className="font-bold text-slate-400 mb-2">Total Earnings</h3>
              <p className="text-4xl font-black text-emerald-400">${(currentUser.balance + totalEarnings).toFixed(2)}</p>
            </div>
            <div className="bg-[#111827] p-6 rounded-3xl border border-white/5 shadow-xl">
              <h3 className="font-bold text-slate-400 mb-2">Commission Rate</h3>
              <p className="text-4xl font-black text-sky-400">{currentUser.agent_percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 space-y-6">
          <h3 className="text-2xl font-black">Transfer Balance</h3>
          <input type="text" placeholder="Username" value={transferUser} onChange={e => setTransferUser(e.target.value)} className="w-full p-4 bg-black/40 rounded-xl border border-white/10" />
          <input type="number" placeholder="Amount" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-full p-4 bg-black/40 rounded-xl border border-white/10" />
          <button onClick={handleTransfer} className="w-full py-4 bg-emerald-600 rounded-xl font-black">Transfer</button>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 space-y-6">
          <h3 className="text-2xl font-black">Account Verification</h3>
          <p className="text-slate-400">Upload your documents to verify your account.</p>
          <button className="flex items-center gap-2 px-6 py-4 bg-sky-600 rounded-xl font-black">
            <Upload className="w-5 h-5" /> Upload Documents
          </button>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 space-y-6 flex flex-col items-center">
          <h3 className="text-2xl font-black">Referral QR Code</h3>
          <p className="text-slate-400">Scan this QR code to register under your account.</p>
          {qrCode && <img src={qrCode} alt="Referral QR Code" className="w-64 h-64" />}
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
