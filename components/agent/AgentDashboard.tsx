import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { User, DollarSign, Users, Activity, ShieldAlert, Send, FileCheck, Upload, QrCode, X } from 'lucide-react';
import { User as UserType, TradeOrder, Transaction } from '../../types';

interface AgentDashboardProps {
  currentUser: UserType | null;
  accounts: UserType[];
  onUpdateUser: (user: UserType) => Promise<void>;
  siteConfig: any;
  tradeOrders: TradeOrder[];
  transactions: Transaction[];
  onLogout: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ currentUser, accounts, onUpdateUser, siteConfig, tradeOrders, transactions, onLogout }) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferUser, setTransferUser] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [showReferredUsers, setShowReferredUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async () => {
    if (!file) return;
    try {
      const path = await supabaseService.uploadDocument(file, currentUser.id);
      // Create a verification request record
      await supabaseService.upsertVerification({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        idFront: path,
        idBack: '',
        commercialRegister: '',
        submittedAt: new Date().toISOString(),
        status: 'pending',
        rejectionReason: ''
      });
      alert('تم رفع المستند بنجاح');
      setFile(null);
    } catch (error: any) {
      console.error(error);
      alert('حدث خطأ أثناء رفع المستند: ' + (error.message || error));
    }
  };
  
  useEffect(() => {
    if (file) handleFileUpload();
  }, [file]);

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
    
    console.log('[AgentDashboard] handleTransfer - Target User Found:', targetUser);
    
    if (!targetUser) {
      alert('اسم المستخدم غير موجود في النظام');
      return;
    }
    
    // التحقق من أن معرف المستخدم صالح
    if (!targetUser.id || targetUser.id === 'null' || targetUser.id === null) {
      console.error('[AgentDashboard] handleTransfer - Invalid target user ID:', targetUser);
      alert('خطأ: بيانات المستخدم المستهدف غير صالحة (معرف مفقود). يرجى التواصل مع الدعم.');
      return;
    }

    if (amount <= 0 || amount > currentUser.balance) {
      alert('المبلغ غير صالح أو الرصيد غير كافٍ');
      return;
    }

    try {
      // Update balances
      await onUpdateUser({ ...currentUser, balance: currentUser.balance - amount });
      await onUpdateUser({ ...targetUser, balance: targetUser.balance + amount });
      
      alert('تمت عملية التحويل بنجاح');
      setTransferAmount('');
      setTransferUser('');
    } catch (error) {
      console.error('[AgentDashboard] handleTransfer - Error during update:', error);
      alert('حدث خطأ أثناء عملية التحويل. يرجى المحاولة مرة أخرى.');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    await onUpdateUser({ ...currentUser, password: newPassword });
    alert('Password updated successfully');
    setNewPassword('');
    setConfirmPassword('');
  };

  const getUserLots = (userId: string) => {
    return tradeOrders.filter(o => o.userId === userId).reduce((sum, o) => sum + o.amount, 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white p-8 animate-in fade-in duration-500">
      {/* Header with Centered Logo and Logout Button */}
      <div className="relative flex justify-center items-center mb-8 mt-4">
        <div className="relative">
          <img src={siteConfig.logoUrl} alt="Logo" className="h-40 md:h-64 drop-shadow-2xl" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-sky-500 rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9]" />
        </div>
        <div className="absolute top-0 right-0">
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-2xl font-black transition-all border border-red-500/20">
            <X className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-12">
        <button onClick={() => setActiveTab('dashboard')} className={`px-8 py-4 rounded-2xl font-black transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-[#111827] text-slate-400'}`}>Dashboard</button>
        <button onClick={() => setActiveTab('profile')} className={`px-8 py-4 rounded-2xl font-black transition-all ${activeTab === 'profile' ? 'bg-sky-600 text-white' : 'bg-[#111827] text-slate-400'}`}>Profile</button>
      </div>

      {activeTab === 'dashboard' ? (
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
            <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-4 bg-sky-600 rounded-2xl font-black hover:bg-sky-500 transition-all">
              <Upload className="w-5 h-5" /> Upload Documents
            </button>
          </div>

          {/* QR Card */}
          <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-black mb-6">Referral QR Code</h3>
            {qrCode && <img src={qrCode} alt="Referral QR Code" className="w-48 h-48 bg-white p-2 rounded-2xl" />}
          </div>
          {/* Transaction History */}
          <div className="bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl md:col-span-3">
            <h3 className="text-xl font-black mb-6">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => t.userId === currentUser.id).map(t => (
                    <tr key={t.id} className="border-b border-white/5">
                      <td className="p-4 font-bold capitalize">{t.type}</td>
                      <td className={`p-4 font-mono ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-400">{new Date(t.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-[#111827] p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-black mb-8">Profile Settings</h3>
          <div className="space-y-6">
            <div>
              <p className="text-slate-400 font-bold">Full Name</p>
              <p className="text-xl font-black">{currentUser.fullName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Username</p>
              <p className="text-xl font-black">{currentUser.username}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Email</p>
              <p className="text-xl font-black">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Phone Number</p>
              <p className="text-xl font-black">{currentUser.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Verification Status</p>
              <p className={`text-xl font-black ${currentUser.verificationStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentUser.verificationStatus || 'unverified'}
              </p>
            </div>
            <div className="pt-8 border-t border-white/10">
              <h4 className="text-xl font-black mb-4">Change Password</h4>
              <div className="space-y-4">
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
                <button onClick={handlePasswordChange} className="w-full py-4 bg-sky-600 rounded-2xl font-black hover:bg-sky-500 transition-all">Update Password</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
