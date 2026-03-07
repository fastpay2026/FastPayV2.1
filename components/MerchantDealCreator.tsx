
import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, Transaction, Notification, VerificationRequest, AdExchangeItem, AdNegotiation, SiteConfig } from '../types';
import { MerchantVerification } from './VerificationManager';
import { AdExchange } from './AdExchange';

interface Props {
  user: User;
  onLogout: () => void;
  addNotification: (title: string, message: string, type: Notification['type'], targetUserId?: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  transactions: Transaction[];
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  verificationRequests: VerificationRequest[];
  setVerificationRequests: React.Dispatch<React.SetStateAction<VerificationRequest[]>>;
  adExchangeItems: AdExchangeItem[];
  setAdExchangeItems: React.Dispatch<React.SetStateAction<AdExchangeItem[]>>;
  adNegotiations: AdNegotiation[];
  setAdNegotiations: React.Dispatch<React.SetStateAction<AdNegotiation[]>>;
  siteConfig: SiteConfig;
}

const MerchantDealCreator: React.FC<Props> = ({ 
  user, onLogout, addNotification, onUpdateUser, setTransactions, transactions, accounts, setAccounts,
  verificationRequests, setVerificationRequests, adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations, siteConfig
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'history' | 'verification' | 'ads'>('overview');
  const [dealForm, setDealForm] = useState({
    buyerName: '',
    goodsType: 'معادن تجارية',
    quantity: '',
    totalAmount: '',
    notes: ''
  });
  const isLCEnabled = true; // Forced
  const [isProcessing, setIsProcessing] = useState(false);

  // Upload States
  const [uploadModalTransactionId, setUploadModalTransactionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhraseIndex, setUploadPhraseIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const uploadPhrases = [
    "Starting document encryption via FastPay-Secure-Tunnel protocol...",
    "Scanning digital fingerprint and ensuring data integrity...",
    "Syncing shipping document with Global Ledger...",
    "Verifying quantities and specifications via AI...",
    "Securing rights via immutable Smart Contract...",
    "Sending instant notification to Riyadh-Node-01 audit center...",
    "Preparing final audit file for human review..."
  ];

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(dealForm.totalAmount);
    
    // Validate buyer existence
    const buyerExists = accounts.some(acc => acc.username === dealForm.buyerName);
    if (!buyerExists) {
      return alert('Sorry, the buyer name was not found in the network. Please enter a valid Username.');
    }

    if (isNaN(amount) || amount <= 0) {
      return alert('Please enter a valid amount');
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      const ts = new Date().toLocaleString('en-US');
      const transactionHash = isLCEnabled ? `0x${Math.random().toString(16).substr(2, 32)}` : undefined;
      
      const newTransaction: Transaction = {
        id: uuidv4(),
        userId: user.id,
        type: 'trade_sell',
        amount: amount,
        relatedUser: dealForm.buyerName,
        timestamp: ts,
        status: isLCEnabled ? 'escrow' : 'completed',
        hash: transactionHash,
        notes: dealForm.notes
      };

      setTransactions(prev => [newTransaction, ...prev]);
      addNotification(
        'Deal Created', 
        `Deal created for ${dealForm.goodsType} with ${dealForm.buyerName} for $${amount.toLocaleString()}${isLCEnabled ? ' (LC System Active)' : ''}`, 
        'money'
      );
      
      setIsProcessing(false);
      setDealForm({ buyerName: '', goodsType: 'Commercial Metals', quantity: '', totalAmount: '', notes: '' });
      setActiveTab('history');
      alert('Deal created successfully and sent to buyer ✅');
    }, 2000);
  };

  const handleUploadShippingDoc = (transactionId: string) => {
    setUploadModalTransactionId(transactionId);
    setUploadProgress(0);
    setUploadPhraseIndex(0);
    setIsUploading(false);
    setUploadComplete(false);
  };

  const startUploadAnimation = () => {
    setIsUploading(true);
    const duration = 40000; // 40 seconds
    const interval = 100;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setUploadComplete(true);
          finalizeUpload();
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    const phraseTimer = setInterval(() => {
      setUploadPhraseIndex(prev => (prev + 1) % uploadPhrases.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(phraseTimer);
    };
  };

  const finalizeUpload = () => {
    if (!uploadModalTransactionId) return;
    
    setTransactions(prev => prev.map(t => {
      if (t.id === uploadModalTransactionId) {
        return { ...t, status: 'shipped' };
      }
      return t;
    }));
    addNotification('Shipping Update', 'Shipping document uploaded successfully and deal status changed to Shipped. Awaiting administrative review.', 'system');
  };

  const merchantTransactions = useMemo(() => 
    transactions.filter(t => t.userId === user.id && t.type === 'trade_sell'),
  [transactions, user.id]);

  const stats = useMemo(() => {
    const escrowDeals = merchantTransactions.filter(t => t.status === 'escrow' || t.status === 'shipped');
    const reservedAmount = escrowDeals.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    
    return {
      totalVolume: merchantTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0),
      dealsCount: merchantTransactions.length,
      activeLC: escrowDeals.length,
      reservedAmount
    };
  }, [merchantTransactions]);

  const hasEscrow = stats.activeLC > 0;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col lg:flex-row bg-[#0a0a0a] text-white text-left font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden h-20 bg-[#111] border-b border-white/5 px-6 flex justify-between items-center z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white text-2xl p-2">
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏪</span>
            </div>
            <h1 className="text-lg font-black tracking-tighter">Merchant Suite</h1>
          </div>
        </div>
        <button onClick={onLogout} className="text-red-500 font-black text-sm">Logout</button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-[#111] border-r border-white/5 flex flex-col z-[200] transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 border-b border-white/5 hidden lg:block">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              <span className="text-xl">🏪</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">Merchant Suite</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Infrastructure 2026</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-20 lg:mt-0">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'create', label: 'Create New Deal', icon: '➕' },
            { id: 'history', label: 'Deal History', icon: '📜' },
            { id: 'ads', label: 'Ad Exchange', icon: '📢' },
            { id: 'verification', label: 'Account Verification', icon: '🛡️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all font-bold ${activeTab === tab.id ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-6">
          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            {hasEscrow && (
              <div className="absolute top-0 left-0 bg-amber-500 text-[8px] font-black px-2 py-0.5 rounded-br-lg animate-pulse">
                Reserved (Escrow)
              </div>
            )}
            <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Available Liquidity</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-teal-400">${user.balance.toLocaleString()}</p>
              {hasEscrow && <span className="text-[10px] text-amber-500 font-bold">(+${stats.reservedAmount.toLocaleString()} Reserved)</span>}
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all hidden lg:block">Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-black/20 backdrop-blur-xl border-b border-white/5 px-6 lg:px-12 flex justify-between items-center z-10 hidden lg:flex">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tighter">
              {activeTab === 'overview' && 'Merchant Dashboard'}
              {activeTab === 'create' && 'Deal Creation Portal'}
              {activeTab === 'history' && 'Transaction History'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-left border-l border-white/10 pl-6">
              <p className="font-black text-white flex items-center gap-2">
                {user.fullName}
                {user.isVerified && <span className="text-sky-400 text-sm" title="Verified Account">☑️</span>}
              </p>
              <p className="text-[10px] text-teal-500 font-black uppercase">Certified FastPay Merchant</p>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-xl">🛡️</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-12 overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  { label: 'Total Trading Volume', value: `$${stats.totalVolume.toLocaleString()}`, icon: '💰', color: 'text-teal-400' },
                  { label: 'Executed Deals', value: stats.dealsCount, icon: '🤝', color: 'text-sky-400' },
                  { label: 'Active LC Credits', value: stats.activeLC, icon: '🔒', color: 'text-amber-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#111] p-6 lg:p-10 rounded-3xl lg:rounded-[3rem] border border-white/5 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-3xl lg:text-4xl">{s.icon}</span>
                      <p className="text-[9px] lg:text-[10px] text-slate-500 font-black uppercase tracking-widest">{s.label}</p>
                    </div>
                    <p className={`text-3xl lg:text-4xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="bg-[#111] p-6 lg:p-12 rounded-3xl lg:rounded-[4rem] border border-white/5 space-y-6 lg:space-y-8">
                  <h3 className="text-xl lg:text-2xl font-black text-white">Recent Activities</h3>
                  <div className="space-y-4">
                    {merchantTransactions.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 bg-black/40 rounded-2xl lg:rounded-3xl border border-white/5 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center">🤝</div>
                          <div>
                            <p className="font-bold text-white text-sm lg:text-base">Deal with {t.relatedUser}</p>
                            <p className="text-[10px] text-slate-500">{t.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-lg lg:text-xl font-black text-teal-400">${Math.abs(t.amount).toLocaleString()}</p>
                      </div>
                    ))}
                    {merchantTransactions.length === 0 && <p className="text-center py-10 text-slate-600 font-bold">No previous transactions</p>}
                  </div>
                </div>

                <div className="bg-teal-500/5 border border-teal-500/10 rounded-3xl lg:rounded-[4rem] p-6 lg:p-12 flex flex-col justify-center items-center text-center space-y-6 lg:space-y-8">
                  <div className="w-16 lg:w-24 h-16 lg:h-24 bg-teal-500/20 rounded-full flex items-center justify-center text-3xl lg:text-5xl shadow-[0_0_40px_rgba(20,184,166,0.2)]">🛡️</div>
                  <div className="space-y-4">
                    <h3 className="text-2xl lg:text-3xl font-black text-white">Integrated Protection System</h3>
                    <p className="text-slate-400 font-bold text-sm lg:text-base leading-relaxed max-w-md mx-auto">
                      All your deals are protected by AES-256 military-grade encryption. Every transaction is verified via the central Riyadh node to ensure the highest levels of reliability.
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('create')} className="w-full sm:w-auto px-10 py-4 bg-teal-600 rounded-2xl font-black hover:bg-teal-500 transition-all shadow-xl">Start New Deal Now</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
              <div className="bg-[#111] p-6 lg:p-16 rounded-3xl lg:rounded-[4rem] border border-white/5 shadow-2xl space-y-8 lg:space-y-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-teal-500 to-transparent"></div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl lg:text-4xl font-black tracking-tighter">Commercial Deal Details</h3>
                  <p className="text-sm lg:text-base text-slate-500 font-bold">Enter the required data to create an LC-guaranteed payment request.</p>
                </div>

                <form onSubmit={handleCreateDeal} className="space-y-6 lg:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 ml-4 uppercase tracking-widest">Buyer Name (Username)</label>
                      <input 
                        required
                        type="text" 
                        value={dealForm.buyerName}
                        onChange={e => setDealForm({...dealForm, buyerName: e.target.value})}
                        className="w-full p-4 lg:p-6 bg-black/40 border border-white/10 rounded-2xl lg:rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all"
                        placeholder="e.g.: user123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 ml-4 uppercase tracking-widest">Goods Type</label>
                      <select 
                        value={dealForm.goodsType}
                        onChange={e => setDealForm({...dealForm, goodsType: e.target.value})}
                        className="w-full p-4 lg:p-6 bg-black/40 border border-white/10 rounded-2xl lg:rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all cursor-pointer text-left"
                      >
                        <option value="Commercial Metals">Commercial Metals</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Car Tires">Car Tires</option>
                        <option value="Construction Materials">Construction Materials</option>
                        <option value="Car Spare Parts">Car Spare Parts</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 ml-4 uppercase tracking-widest">Quantity</label>
                      <input 
                        required
                        type="text" 
                        value={dealForm.quantity}
                        onChange={e => setDealForm({...dealForm, quantity: e.target.value})}
                        className="w-full p-4 lg:p-6 bg-black/40 border border-white/10 rounded-2xl lg:rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all"
                        placeholder="e.g.: 1000 units"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 ml-4 uppercase tracking-widest">Total Amount ($)</label>
                      <input 
                        required
                        type="number" 
                        value={dealForm.totalAmount}
                        onChange={e => setDealForm({...dealForm, totalAmount: e.target.value})}
                        className="w-full p-4 lg:p-6 bg-black/60 border border-teal-500/30 rounded-2xl lg:rounded-3xl font-black text-2xl lg:text-3xl text-teal-400 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 ml-4 uppercase tracking-widest">Additional Notes (Optional)</label>
                    <textarea 
                      maxLength={500}
                      value={dealForm.notes}
                      onChange={e => setDealForm({...dealForm, notes: e.target.value})}
                      className="w-full p-4 lg:p-6 bg-black/40 border border-white/10 rounded-2xl lg:rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all min-h-[120px] resize-none"
                      placeholder="Write any additional notes here (max 500 characters)..."
                    />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-600 font-bold">{dealForm.notes.length}/500</span>
                    </div>
                  </div>

                  <div className="p-6 lg:p-8 bg-teal-500/5 border border-teal-500/10 rounded-2xl lg:rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <p className="font-black text-teal-400 text-base lg:text-lg">Documentary Credit System (FastPay)</p>
                      <p className="text-[10px] lg:text-xs text-slate-500 font-bold">This system is mandatory to ensure the rights of both parties; the amount will be held from the buyer and only released upon uploading the shipping document.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full border border-teal-500/30 shrink-0">
                      <span className="text-teal-400 text-[10px] lg:text-xs font-black">Always Active</span>
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className={`w-full py-6 lg:py-8 bg-teal-600 rounded-2xl lg:rounded-[3rem] font-black text-xl lg:text-2xl shadow-2xl hover:bg-teal-500 transition-all active:scale-95 flex items-center justify-center gap-4 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></span>
                        <span>Processing data...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm and Create Deal</span>
                        <span className="text-2xl lg:text-3xl">🤝</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-[#111] rounded-3xl lg:rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                <table className="w-full text-right min-w-[800px]">
                  <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                    <tr>
                      <th className="p-6 lg:p-10">Buyer</th>
                      <th className="p-6 lg:p-10">Amount</th>
                      <th className="p-6 lg:p-10">Timestamp</th>
                      <th className="p-6 lg:p-10 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {merchantTransactions.map((t, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-all">
                        <td className="p-6 lg:p-10">
                          <div className="flex flex-col">
                            <span className="text-lg lg:text-xl text-white">{t.relatedUser}</span>
                            {t.hash && <span className="text-[8px] font-mono text-teal-500/50 truncate max-w-[150px]">{t.hash}</span>}
                            {t.notes && <span className="text-[10px] text-slate-500 italic mt-1 truncate max-w-[200px]" title={t.notes}>{t.notes}</span>}
                          </div>
                        </td>
                        <td className="p-6 lg:p-10 text-xl lg:text-2xl font-black text-teal-400">${Math.abs(t.amount).toLocaleString()}</td>
                        <td className="p-6 lg:p-10 text-[10px] lg:text-xs text-slate-500 font-mono">{t.timestamp}</td>
                        <td className="p-6 lg:p-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`px-4 lg:px-6 py-1.5 lg:py-2 rounded-full text-[9px] lg:text-[10px] font-black uppercase border ${
                              t.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              t.status === 'escrow' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {t.status === 'shipped' ? 'Shipped' : t.status === 'escrow' ? 'Escrow' : 'Completed'}
                            </span>
                            {t.status === 'escrow' && (
                              <button 
                                onClick={() => handleUploadShippingDoc(t.id)}
                                className="text-[9px] lg:text-[10px] text-teal-400 hover:text-white underline transition-colors"
                              >
                                Upload Shipping Document
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {merchantTransactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 lg:p-40 text-center opacity-30">
                          <div className="text-6xl lg:text-8xl mb-4">📜</div>
                          <p className="text-xl lg:text-2xl font-black">No deals registered</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <MerchantVerification 
              user={user} 
              onUpdateUser={onUpdateUser} 
              verificationRequests={verificationRequests} 
              setVerificationRequests={setVerificationRequests} 
              addNotification={addNotification} 
            />
          )}

          {activeTab === 'ads' && (
            <AdExchange 
              user={user} 
              adExchangeItems={adExchangeItems} 
              setAdExchangeItems={setAdExchangeItems} 
              adNegotiations={adNegotiations} 
              setAdNegotiations={setAdNegotiations} 
              accounts={accounts} 
              setAccounts={setAccounts} 
              transactions={transactions} 
              setTransactions={setTransactions} 
              addNotification={addNotification} 
              onUpdateUser={onUpdateUser}
              siteConfig={siteConfig}
            />
          )}
        </div>

        {/* Security Footer */}
        <footer className="h-16 bg-black/40 border-t border-white/5 px-12 flex items-center justify-between z-10">
          <div className="flex gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            <span>AES-256 ENCRYPTION</span>
            <span>RIYADH-NODE-01</span>
            <span>SECURE SESSION</span>
          </div>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Final FastPay Global Financial Infrastructure</p>
        </footer>
      </main>

      {/* Upload Modal */}
      {uploadModalTransactionId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 md:p-20 shadow-3xl text-center relative overflow-hidden">
            {!isUploading && !uploadComplete ? (
              <div className="space-y-10">
                <button 
                  onClick={() => setUploadModalTransactionId(null)}
                  className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
                <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center text-5xl mx-auto border border-teal-500/30">
                  📄
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black tracking-tighter">Upload Shipping Document</h3>
                  <p className="text-slate-500 font-bold">Please upload the shipping bill in PDF format only to verify the transaction.</p>
                </div>
                
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          return alert('Sorry, only PDF files are allowed.');
                        }
                        startUploadAnimation();
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full py-12 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/5 group-hover:bg-white/10 group-hover:border-teal-500/40 transition-all flex flex-col items-center gap-4">
                    <span className="text-4xl">📤</span>
                    <span className="font-black text-teal-400">Click here or drag file to upload</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">PDF ONLY - MAX 10MB</span>
                  </div>
                </div>
              </div>
            ) : isUploading && !uploadComplete ? (
              <div className="space-y-16 py-10">
                <div className="relative w-40 h-40 mx-auto">
                  <div className="absolute inset-0 border-8 border-white/5 rounded-full"></div>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="72"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-teal-500"
                      strokeDasharray={452.39}
                      strokeDashoffset={452.39 - (452.39 * uploadProgress) / 100}
                      style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black font-mono">{Math.floor(uploadProgress)}%</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all duration-100 linear"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="min-h-[60px] flex items-center justify-center px-6">
                    <p className="text-2xl font-black text-teal-400 animate-pulse leading-relaxed">
                      {uploadPhrases[uploadPhraseIndex]}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                  <span>Verifying Rights</span>
                  <span>Smart Audit</span>
                  <span>AES-256</span>
                </div>
              </div>
            ) : (
              <div className="space-y-12 py-10 animate-in zoom-in duration-700">
                <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-7xl mx-auto shadow-[0_0_60px_rgba(16,185,129,0.4)] border-4 border-emerald-400">
                  ✓
                </div>
                <div className="space-y-6">
                  <h3 className="text-5xl font-black tracking-tighter">Document Uploaded Successfully</h3>
                  <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] space-y-2">
                    <p className="text-xl font-black text-emerald-400">Audit will be completed within 4 hours</p>
                    <p className="text-sm text-slate-500 font-bold">Thank you for adhering to FastPay Global standards to ensure the rights of both parties.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUploadModalTransactionId(null)}
                  className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl font-black text-xl hover:bg-white/10 transition-all"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20, 184, 166, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MerchantDealCreator;
