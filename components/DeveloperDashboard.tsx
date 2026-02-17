
import React, { useState } from 'react';
import { User, SiteConfig, LandingService, CustomPage, Transaction, Notification, TradeAsset, WithdrawalRequest, Role, SalaryFinancing, TradeOrder, RechargeCard, DepositPlan, RaffleEntry, RaffleWinner, FixedDeposit } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  services: LandingService[];
  setServices: React.Dispatch<React.SetStateAction<LandingService[]>>;
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  tradeAssets: TradeAsset[];
  setTradeAssets: React.Dispatch<React.SetStateAction<TradeAsset[]>>;
  withdrawalRequests: WithdrawalRequest[];
  setWithdrawalRequests: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  salaryPlans: SalaryFinancing[];
  setSalaryPlans: React.Dispatch<React.SetStateAction<SalaryFinancing[]>>;
  tradeOrders: TradeOrder[];
  setTradeOrders: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  rechargeCards: RechargeCard[];
  setRechargeCards: React.Dispatch<React.SetStateAction<RechargeCard[]>>;
  raffleEntries: RaffleEntry[];
  setRaffleEntries: React.Dispatch<React.SetStateAction<RaffleEntry[]>>;
  raffleWinners: RaffleWinner[];
  setRaffleWinners: React.Dispatch<React.SetStateAction<RaffleWinner[]>>;
  fixedDeposits: FixedDeposit[];
  setFixedDeposits: React.Dispatch<React.SetStateAction<FixedDeposit[]>>;
}

const DeveloperDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, onUpdateConfig, accounts, setAccounts, 
  services, setServices, pages, setPages, addNotification, 
  transactions, setTransactions, notifications, setNotifications, tradeAssets, setTradeAssets,
  withdrawalRequests, setWithdrawalRequests, salaryPlans, setSalaryPlans,
  tradeOrders, setTradeOrders, rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries,
  raffleWinners, setRaffleWinners, fixedDeposits, setFixedDeposits
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'withdrawals' | 'salary' | 'cards' | 'invest' | 'trading' | 'raffle' | 'content'>('home');
  const [userSearch, setUserSearch] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  // Modals Visibility States
  const [modal, setModal] = useState<'user' | 'card' | 'salary' | 'invest' | null>(null);

  // Form States
  const [userForm, setUserForm] = useState({ fullName: '', username: '', password: '', role: 'USER' as Role, balance: 0 });
  const [cardForm, setCardForm] = useState({ amount: 100, quantity: 10 });
  const [salaryForm, setSalaryForm] = useState({ username: '', amount: 5000, duration: 12, benName: '' });
  const [planForm, setPlanForm] = useState({ name: '', rate: 15, months: 12, min: 1000 });
  const [tempConfig, setTempConfig] = useState<SiteConfig>(siteConfig);

  // --- Core Action Handlers ---

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: userForm.username.trim(),
      fullName: userForm.fullName,
      password: userForm.password,
      role: userForm.role,
      balance: userForm.balance,
      status: 'active',
      email: `${userForm.username}@fastpay.com`,
      createdAt: new Date().toLocaleDateString()
    };
    setAccounts(prev => [...prev, newUser]);
    setModal(null);
    setUserForm({ fullName: '', username: '', password: '', role: 'USER', balance: 0 });
    alert(`تمت إضافة ${newUser.role} بنجاح ✅`);
  };

  const adjustBalance = (id: string) => {
    const amt = prompt('أدخل المبلغ (موجب للإضافة، سالب للخصم):', '0');
    if (amt) {
      const p = parseFloat(amt);
      if (!isNaN(p)) setAccounts(prev => prev.map(u => u.id === id ? { ...u, balance: u.balance + p } : u));
    }
  };

  const handleSwiftAction = (id: string, status: 'approved' | 'rejected') => {
    const req = withdrawalRequests.find(r => r.id === id);
    if (!req) return;
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status, processedAt: new Date().toLocaleString() } : r));
    if (status === 'rejected') setAccounts(prev => prev.map(u => u.id === req.userId ? { ...u, balance: u.balance + req.amount } : u));
    alert(status === 'approved' ? 'تم اعتماد الحوالة بنجاح ✅' : 'تم الرفض وإرجاع الرصيد ❌');
  };

  const handleCloseOrder = (orderId: string, result: 'profit' | 'loss') => {
    const order = tradeOrders.find(o => o.id === orderId);
    if (!order) return;
    const finalAmount = result === 'profit' ? order.amount * 1.8 : 0;
    setTradeOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: result === 'profit' ? 'closed_profit' : 'closed_loss' } : o));
    if (result === 'profit') setAccounts(prev => prev.map(u => u.id === order.userId ? { ...u, balance: u.balance + finalAmount } : u));
    alert(result === 'profit' ? 'أغلقت بربح ✅' : 'أغلقت بخسارة ❌');
  };

  const drawRaffleWinner = () => {
    if (raffleEntries.length === 0) return alert('لا يوجد مشاركون في القرعة حالياً ⚠️');
    const prize = prompt('أدخل اسم الجائزة (مثلاً: سيارة بورش أو رحلة عمرة):', 'جائزة كبرى');
    if (!prize) return;

    setIsDrawing(true);
    // Simulate a delay for dramatic effect
    setTimeout(() => {
      const winnerIdx = Math.floor(Math.random() * raffleEntries.length);
      const winner = raffleEntries[winnerIdx];
      
      const winnerData: RaffleWinner = { 
        ...winner, 
        id: Math.random().toString(36).substr(2, 9),
        wonAt: new Date().toLocaleString('ar-SA'), 
        prizeTitle: prize 
      };

      setRaffleWinners(prev => [winnerData, ...prev]);
      setRaffleEntries(prev => prev.filter((_, i) => i !== winnerIdx));
      setIsDrawing(false);
      
      addNotification('إعلان فائز', `الفائز بالقرعة هو: ${winner.fullName} - الجائزة: ${prize}`, 'system');
      alert(`🎉 ألف مبروك للفائز: ${winner.fullName}\nالجائزة: ${prize}`);
    }, 2500);
  };

  const updateAsset = (id: string, updates: Partial<TradeAsset>) => {
    setTradeAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const generateCards = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: RechargeCard[] = Array.from({ length: cardForm.quantity }, () => ({
      code: `FP-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: cardForm.amount,
      isUsed: false,
      generatedBy: user.id,
      createdAt: new Date().toLocaleString()
    }));
    setRechargeCards(prev => [...prev, ...newBatch]);
    setModal(null);
    alert('تم توليد البطاقات 🎫');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(tempConfig);
    alert('تم تحديث هوية النظام بنجاح 📡');
  };

  const filteredUsers = accounts.filter(u => u.username.includes(userSearch) || u.fullName.includes(userSearch));

  return (
    <div className="fixed inset-0 z-[150] flex bg-[#020617] text-white text-right font-sans overflow-hidden" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar">
        <div className="p-10 border-b border-white/5 text-center">
           <img src={siteConfig.logoUrl} style={{ width: `120px` }} className="mx-auto mb-4" alt="Logo" />
           <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">إدارة العمليات السيادية v28.5 Elite</p>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'home', l: 'نظرة عامة', i: '🛰️' },
            { id: 'users', l: 'إدارة الأعضاء', i: '👥' },
            { id: 'withdrawals', l: 'حوالات Swift', i: '🏦' },
            { id: 'trading', l: 'محرك الصفقات', i: '📈' },
            { id: 'salary', l: 'تمويل الرواتب', i: '💵' },
            { id: 'cards', l: 'توليد البطاقات', i: '🎫' },
            { id: 'invest', l: 'خطط الاستثمار', i: '💎' },
            { id: 'raffle', l: 'إدارة القرعة', i: '🎁' },
            { id: 'content', l: 'هوية الموقع', i: '⚙️' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === t.id ? 'bg-sky-600 shadow-xl text-white scale-105' : 'hover:bg-white/5 text-slate-400'}`}>
              <span className="text-xl ml-4">{t.i}</span>
              <span className="font-black text-sm">{t.l}</span>
            </button>
          ))}
        </nav>
        <div className="p-8"><button onClick={onLogout} className="w-full p-4 bg-red-600/10 text-red-500 rounded-xl font-black border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">خروج آمن</button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto p-12 custom-scrollbar relative">
        
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-12 animate-in fade-in">
             <h2 className="text-6xl font-black tracking-tighter">مركز العمليات التنفيذي</h2>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5"><p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">إجمالي الأعضاء</p><p className="text-6xl font-black text-sky-400">{accounts.length}</p></div>
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5"><p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">حوالات معلقة</p><p className="text-6xl font-black text-red-400">{withdrawalRequests.filter(r=>r.status==='pending').length}</p></div>
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5"><p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">صفقات مفتوحة</p><p className="text-6xl font-black text-indigo-400">{tradeOrders.filter(o=>o.status==='open').length}</p></div>
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5"><p className="text-slate-500 text-xs font-black mb-2 uppercase tracking-widest">سيولة النظام</p><p className="text-4xl font-black text-white font-mono">${siteConfig.networkBalance.toLocaleString()}</p></div>
             </div>
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-10 animate-in slide-in-from-bottom">
             <div className="flex justify-between items-center">
                <h2 className="text-5xl font-black tracking-tighter">إدارة حسابات النخبة</h2>
                <div className="flex gap-4">
                   <button onClick={() => setModal('user')} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all">+ إضافة عضو</button>
                   <input type="text" placeholder="بحث..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} className="bg-white/5 p-4 rounded-2xl border border-white/10 w-80 outline-none" />
                </div>
             </div>
             <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right font-bold">
                   <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black"><tr><th className="p-8">العضو</th><th className="p-8">الرصيد</th><th className="p-8">الرتبة</th><th className="p-8 text-center">التحكم</th></tr></thead>
                   <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                           <td className="p-8">{u.fullName}<br/><span className="text-xs text-sky-400 font-mono">@{u.username}</span></td>
                           <td className="p-8 text-emerald-400 font-mono text-xl">${u.balance.toLocaleString()}</td>
                           <td className="p-8 text-xs text-slate-500 font-black uppercase tracking-widest">{u.role}</td>
                           <td className="p-8 flex justify-center gap-3">
                              <button onClick={()=>adjustBalance(u.id)} className="bg-sky-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">إدارة الرصيد</button>
                              <button onClick={()=>{ if(confirm('حذف الحساب نهائياً؟')) setAccounts(p=>p.filter(x=>x.id!==u.id))}} className="bg-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">حذف</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* TAB: WITHDRAWALS (SWIFT) */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-10 animate-in fade-in">
             <h2 className="text-5xl font-black tracking-tighter text-sky-400">حوالات Swift البنكية</h2>
             <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right font-bold text-sm">
                   <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black"><tr><th className="p-8">المستفيد</th><th className="p-8">المبلغ</th><th className="p-8">التفاصيل</th><th className="p-8">الحالة</th><th className="p-8 text-center">الإجراء</th></tr></thead>
                   <tbody className="divide-y divide-white/5">
                      {withdrawalRequests.map(r => (
                        <tr key={r.id} className="hover:bg-white/5">
                           <td className="p-8">@{r.username}</td>
                           <td className="p-8 text-emerald-400 font-mono">${r.amount.toLocaleString()}</td>
                           <td className="p-8 text-[10px] font-mono">{r.bankName}<br/>{r.iban}</td>
                           <td className="p-8"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${r.status==='pending' ? 'bg-amber-500/10 text-amber-500':'bg-emerald-500/10 text-emerald-500'}`}>{r.status}</span></td>
                           <td className="p-8 flex justify-center gap-3">
                              {r.status === 'pending' && (
                                <><button onClick={()=>handleSwiftAction(r.id, 'approved')} className="bg-emerald-600 px-4 py-1.5 rounded-lg text-[9px] font-black">قبول</button><button onClick={()=>handleSwiftAction(r.id, 'rejected')} className="bg-red-600 px-4 py-1.5 rounded-lg text-[9px] font-black">رفض</button></>
                              )}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* TAB: RAFFLE (ACTIVATE DRAW BUTTON) */}
        {activeTab === 'raffle' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-5xl font-black tracking-tighter text-amber-500">إدارة مهرجان الجوائز</h2>
                <button 
                  disabled={isDrawing || raffleEntries.length === 0}
                  onClick={drawRaffleWinner} 
                  className={`bg-amber-600 px-10 py-5 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all flex items-center gap-4 ${isDrawing ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:bg-amber-500 hover:scale-105 active:scale-95'}`}
                >
                  {isDrawing ? (
                    <>
                       <span>جاري إجراء السحب...</span>
                       <span className="animate-spin text-3xl">🌀</span>
                    </>
                  ) : (
                    <>
                       <span>سحب فائز عشوائي 🎰</span>
                       <span className="text-3xl">✨</span>
                    </>
                  )}
                </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col">
                   <h3 className="text-2xl font-black mb-8 border-b border-white/5 pb-4">المشاركون النشطون ({raffleEntries.length})</h3>
                   <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                      {raffleEntries.map(e => (
                        <div key={e.id} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-sky-500/30 transition-all">
                           <div>
                              <p className="font-black text-white text-lg">{e.fullName}</p>
                              <p className="text-xs text-slate-500 font-mono">@{e.username}</p>
                           </div>
                           <span className="text-sky-400 font-mono text-sm tracking-widest">{e.ticketNumber}</span>
                        </div>
                      ))}
                      {raffleEntries.length === 0 && <p className="text-center opacity-20 py-20 italic">لا يوجد مشاركون في السحب الحالي</p>}
                   </div>
                </div>
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col">
                   <h3 className="text-2xl font-black mb-8 text-emerald-400 border-b border-white/5 pb-4">سجل الفائزين الملكي</h3>
                   <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
                      {raffleWinners.map(w => (
                        <div key={w.id} className="p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex justify-between items-center group relative overflow-hidden">
                           <div className="relative z-10">
                              <p className="text-[10px] text-emerald-400 font-black mb-1 uppercase tracking-[0.3em]">فاز بـ {w.prizeTitle}</p>
                              <p className="text-2xl font-black text-white">{w.fullName}</p>
                              <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase">{w.wonAt}</p>
                           </div>
                           <span className="text-5xl group-hover:scale-125 transition-transform duration-500">👑</span>
                        </div>
                      ))}
                      {raffleWinners.length === 0 && <p className="text-center opacity-20 py-20 italic">بانتظار تتويج أول فائز لهذا الشهر...</p>}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB: TRADING ENGINE */}
        {activeTab === 'trading' && (
          <div className="space-y-12 animate-in zoom-in">
             <h2 className="text-4xl font-black tracking-tighter">التحكم في أسعار الأصول والصفقات</h2>
             <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right font-bold">
                   <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black"><tr><th className="p-8">الأصل</th><th className="p-8 text-center">السعر الحقيقي</th><th className="p-8 text-center">الانحياز</th><th className="p-8 text-center">الحالة</th></tr></thead>
                   <tbody className="divide-y divide-white/5">
                      {tradeAssets.map(a => (
                        <tr key={a.id} className="hover:bg-white/5">
                           <td className="p-8 flex items-center gap-4"><span className="text-3xl">{a.icon}</span><div><p>{a.name}</p><p className="text-xs text-slate-500">{a.symbol}</p></div></td>
                           <td className="p-8 text-center font-mono text-sky-400">${a.price.toLocaleString()}</td>
                           <td className="p-8 text-center">
                              <div className="flex justify-center gap-2">
                                {(['up', 'neutral', 'down'] as const).map(b => (
                                  <button key={b} onClick={()=>updateAsset(a.id, {trendBias: b})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border ${a.trendBias===b ? 'bg-sky-600' : 'bg-white/5 text-slate-500'}`}>{b}</button>
                                ))}
                              </div>
                           </td>
                           <td className="p-8 text-center">
                              <button onClick={()=>updateAsset(a.id, {isFrozen: !a.isFrozen})} className={`px-6 py-2 rounded-xl text-[10px] font-black ${a.isFrozen ? 'bg-red-600' : 'bg-sky-600'}`}>{a.isFrozen ? 'فك التجميد' : 'تجميد السعر'}</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <h2 className="text-3xl font-black tracking-tighter text-indigo-400">إدارة الصفقات المفتوحة</h2>
             <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right font-bold">
                   <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black"><tr><th className="p-8">المتداول</th><th className="p-8">المبلغ</th><th className="p-8 text-center">القرار</th></tr></thead>
                   <tbody className="divide-y divide-white/5 font-black">
                      {tradeOrders.filter(o=>o.status==='open').map(o => (
                        <tr key={o.id} className="hover:bg-white/5">
                           <td className="p-8">@{o.username}<br/><span className="text-xs text-sky-400 font-mono">{o.assetSymbol}</span></td>
                           <td className="p-8 text-white font-mono">${o.amount.toLocaleString()}</td>
                           <td className="p-8 flex justify-center gap-3">
                              <button onClick={()=>handleCloseOrder(o.id, 'profit')} className="bg-emerald-600 px-6 py-2 rounded-xl text-xs">إغلاق بربح ✅</button>
                              <button onClick={()=>handleCloseOrder(o.id, 'loss')} className="bg-red-600 px-6 py-2 rounded-xl text-xs">بخسارة ❌</button>
                           </td>
                        </tr>
                      ))}
                      {tradeOrders.filter(o=>o.status==='open').length === 0 && <tr><td colSpan={3} className="p-20 text-center opacity-20 italic">لا توجد صفقات حية حالياً</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* TAB: SALARY */}
        {activeTab === 'salary' && (
          <div className="space-y-10 animate-in slide-in-from-bottom">
             <div className="flex justify-between items-center">
                <h2 className="text-5xl font-black tracking-tighter text-indigo-400">تمويل الرواتب المسبق</h2>
                <button onClick={() => setModal('salary')} className="bg-indigo-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-500 transition-all">+ تمويل مباشر</button>
             </div>
             <div className="grid grid-cols-1 gap-6">
                {salaryPlans.map(p => (
                   <div key={p.id} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 flex justify-between items-center shadow-xl hover:border-indigo-500/30 transition-all">
                      <div>
                         <p className="font-black text-2xl text-white">{p.beneficiaryName} <span className="text-xs text-slate-500">@{p.username}</span></p>
                         <p className="text-indigo-400 font-black text-4xl font-mono">${p.amount.toLocaleString()}</p>
                         <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-2">{p.requestedAt}</p>
                      </div>
                      <div className="flex gap-4">
                         {p.status === 'pending' ? (
                            <><button onClick={()=>setSalaryPlans(prev=>prev.map(x=>x.id===p.id?{...x,status:'active'}:x))} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-500">تفعيل</button><button onClick={()=>setSalaryPlans(prev=>prev.map(x=>x.id===p.id?{...x,status:'cancelled'}:x))} className="bg-red-600 px-8 py-3 rounded-2xl font-black text-xs hover:bg-red-500">إلغاء</button></>
                         ) : (
                            <span className={`px-8 py-3 rounded-full text-xs font-black uppercase border ${p.status==='active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500'}`}>{p.status}</span>
                         )}
                      </div>
                   </div>
                ))}
                {salaryPlans.length === 0 && <div className="p-24 text-center opacity-20 italic font-black text-2xl">لا توجد طلبات تمويل نشطة</div>}
             </div>
          </div>
        )}

        {/* TAB: INVEST PLANS */}
        {activeTab === 'invest' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-5xl font-black tracking-tighter">خطط الاستثمار السيادية</h2>
                <button onClick={() => setModal('invest')} className="bg-sky-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-sky-500 transition-all">+ إضافة خطة</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {siteConfig.depositPlans.map(plan => (
                   <div key={plan.id} className="p-10 bg-slate-900/60 border border-white/10 rounded-[3rem] shadow-xl text-center group hover:border-sky-500/40 transition-all relative">
                      <h4 className="text-2xl font-black text-sky-400 mb-2">{plan.name}</h4>
                      <p className="text-6xl font-black mb-6">{plan.rate}%</p>
                      <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">{plan.durationMonths} شهر / حد أدنى ${plan.minAmount.toLocaleString()}</p>
                      <button onClick={()=>onUpdateConfig({...siteConfig, depositPlans: siteConfig.depositPlans.filter(x=>x.id!==plan.id)})} className="text-red-500 font-black text-[10px] hover:bg-red-500/10 px-6 py-2 rounded-full transition-all border border-red-500/20">حذف الخطة 🗑️</button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB: CONTENT / IDENTITY */}
        {activeTab === 'content' && (
           <div className="space-y-10 animate-in slide-in-from-right pb-40">
              <h2 className="text-5xl font-black tracking-tighter">تخصيص هوية النظام</h2>
              <form onSubmit={handleSaveConfig} className="bg-[#0f172a] p-12 rounded-[4rem] border border-white/5 shadow-2xl space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h3 className="text-2xl font-black border-r-8 border-sky-500 pr-6 uppercase tracking-widest">العلامة التجارية</h3>
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">رابط الشعار</label><input value={tempConfig.logoUrl} onChange={e=>setTempConfig({...tempConfig, logoUrl: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">اسم الشبكة</label><input value={tempConfig.siteName} onChange={e=>setTempConfig({...tempConfig, siteName: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all" /></div>
                    </div>
                    <div className="space-y-6">
                       <h3 className="text-2xl font-black border-r-8 border-emerald-500 pr-6 uppercase tracking-widest">نصوص الواجهة</h3>
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">عنوان Hero</label><input value={tempConfig.heroTitle} onChange={e=>setTempConfig({...tempConfig, heroTitle: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all" /></div>
                       <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">وصف Hero</label><textarea value={tempConfig.heroSubtitle} onChange={e=>setTempConfig({...tempConfig, heroSubtitle: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none h-32 focus:border-sky-500 transition-all" /></div>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">البريد</label><input value={tempConfig.contactEmail} onChange={e=>setTempConfig({...tempConfig, contactEmail: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">الهاتف</label><input value={tempConfig.contactPhone} onChange={e=>setTempConfig({...tempConfig, contactPhone: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500" dir="ltr" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">العنوان</label><input value={tempConfig.contactAddress} onChange={e=>setTempConfig({...tempConfig, contactAddress: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500" /></div>
                 </div>
                 <button type="submit" className="w-full py-10 bg-sky-600 rounded-[4rem] font-black text-3xl shadow-xl hover:bg-sky-500 transition-all">حفظ وتطبيق الهوية التنفيذية 📡</button>
              </form>
           </div>
        )}

        {/* TAB: CARDS */}
        {activeTab === 'cards' && (
          <div className="space-y-10 animate-in zoom-in">
             <div className="flex justify-between items-center"><h2 className="text-5xl font-black tracking-tighter">توليد بطاقات الشحن</h2><button onClick={() => setModal('card')} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all">توليد بطاقات جديدة 🎫</button></div>
             <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right font-mono">
                   <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black"><tr><th className="p-8">الكود الفريد</th><th className="p-8 text-center">القيمة المادية</th><th className="p-8 text-center">الحالة</th></tr></thead>
                   <tbody className="divide-y divide-white/5 text-lg font-black">
                      {rechargeCards.slice().reverse().slice(0, 50).map((c, i) => (
                        <tr key={i} className="hover:bg-white/5 group transition-all">
                          <td className="p-8 text-sky-400 tracking-widest group-hover:text-white transition-colors">{c.code}</td>
                          <td className="p-8 text-center text-white font-mono">${c.amount.toLocaleString()}</td>
                          <td className="p-8 text-center">{c.isUsed ? <span className="text-red-500 bg-red-500/10 px-4 py-1 rounded-full text-[10px] font-black uppercase">مستخدمة</span> : <span className="text-emerald-500 bg-emerald-500/10 px-4 py-1 rounded-full text-[10px] font-black uppercase">نشطة</span>}</td>
                        </tr>
                      ))}
                      {rechargeCards.length === 0 && <tr><td colSpan={3} className="p-24 text-center opacity-20 italic text-2xl font-black">لا توجد بطاقات مصدرة حالياً</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- MODALS --- */}
        
        {modal === 'user' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
             <form onSubmit={handleSaveUser} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black mb-8 tracking-tighter">إضافة عضو جديد للنظام</h3>
                <div className="space-y-4">
                   <input required value={userForm.fullName} onChange={e=>setUserForm({...userForm, fullName: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all text-white" placeholder="الاسم الثلاثي الكامل" />
                   <input required value={userForm.username} onChange={e=>setUserForm({...userForm, username: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all font-mono text-white" placeholder="اسم المستخدم" />
                   <input required type="password" value={userForm.password} onChange={e=>setUserForm({...userForm, password: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all text-white" placeholder="كلمة المرور" />
                </div>
                
                <div className="space-y-3 text-right">
                   <label className="text-xs text-slate-500 mr-6 font-black uppercase tracking-widest">تحديد رتبة العضو</label>
                   <select 
                     value={userForm.role} 
                     onChange={e=>setUserForm({...userForm, role: e.target.value as Role})}
                     className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-sky-400 outline-none cursor-pointer"
                   >
                      <option value="USER">مستخدم (User)</option>
                      <option value="MERCHANT">تاجر معتمد (Merchant)</option>
                      <option value="ACCOUNTANT">محاسب نظام (Accountant)</option>
                      <option value="DEVELOPER">مدير تنفيذي (Admin)</option>
                   </select>
                </div>

                <div className="space-y-2 text-right"><label className="text-xs text-slate-500 mr-6 font-black uppercase">الرصيد الافتتاحي ($)</label><input type="number" required value={userForm.balance} onChange={e=>setUserForm({...userForm, balance: parseFloat(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-emerald-400 outline-none text-2xl text-center" /></div>
                
                <div className="flex gap-4 pt-4">
                   <button type="submit" className="flex-1 py-6 bg-sky-600 rounded-3xl font-black text-xl shadow-2xl hover:bg-sky-500 transition-all">حفظ الحساب</button>
                   <button type="button" onClick={()=>setModal(null)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-xl hover:bg-white/10 transition-all">إلغاء</button>
                </div>
             </form>
          </div>
        )}

        {modal === 'card' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
             <form onSubmit={generateCards} className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-12 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black text-white tracking-tighter">توليد بطاقات شحن</h3>
                <div className="space-y-8 text-right">
                   <div className="space-y-2"><label className="text-xs font-black text-slate-500 mr-8 uppercase">قيمة البطاقة ($)</label><input type="number" required value={cardForm.amount} onChange={e=>setCardForm({...cardForm, amount: parseInt(e.target.value)})} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2.5rem] font-black text-center text-5xl text-sky-400 outline-none" /></div>
                   <div className="space-y-2"><label className="text-xs font-black text-slate-500 mr-8 uppercase">الكمية</label><input type="number" required value={cardForm.quantity} onChange={e=>setCardForm({...cardForm, quantity: parseInt(e.target.value)})} className="w-full p-6 bg-black/40 border border-white/10 rounded-[2rem] font-black text-center text-3xl text-white outline-none" /></div>
                </div>
                <button type="submit" className="w-full py-10 bg-emerald-600 rounded-[4rem] font-black text-3xl shadow-3xl hover:bg-emerald-500 transition-all active:scale-95">مباشرة التوليد 🚀</button>
                <button type="button" onClick={()=>setModal(null)} className="text-slate-500 font-bold hover:text-white transition-colors">إغلاق</button>
             </form>
          </div>
        )}

        {modal === 'invest' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
             <form onSubmit={(e)=>{ e.preventDefault(); const newPlan: DepositPlan = { id: Math.random().toString(36).substr(2, 9), name: planForm.name, rate: planForm.rate, durationMonths: planForm.months, minAmount: planForm.min }; onUpdateConfig({...siteConfig, depositPlans: [...siteConfig.depositPlans, newPlan]}); setModal(null); }} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black mb-8 tracking-tighter">إضافة خطة استثمار جديدة</h3>
                <div className="space-y-4">
                  <input required value={planForm.name} onChange={e=>setPlanForm({...planForm, name: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="اسم الخطة" />
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">نسبة الربح (%)</label><input type="number" required value={planForm.rate} onChange={e=>setPlanForm({...planForm, rate: parseFloat(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">المدة (أشهر)</label><input type="number" required value={planForm.months} onChange={e=>setPlanForm({...planForm, months: parseInt(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase tracking-widest">الحد الأدنى ($)</label><input type="number" required value={planForm.min} onChange={e=>setPlanForm({...planForm, min: parseFloat(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-emerald-400 outline-none text-center text-2xl" /></div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-6 bg-sky-600 rounded-3xl font-black text-xl shadow-2xl">حفظ الخطة</button>
                  <button type="button" onClick={()=>setModal(null)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black text-xl">إلغاء</button>
                </div>
             </form>
          </div>
        )}

        {modal === 'salary' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
             <form onSubmit={(e)=>{ e.preventDefault(); const t = accounts.find(a=>a.username===salaryForm.username); if(!t) return alert('اسم المستخدم غير موجود'); const np: SalaryFinancing = { id: Math.random().toString(36).substr(2, 9), userId: t.id, username: t.username, beneficiaryName: salaryForm.benName || t.fullName, amount: salaryForm.amount, deduction: Number(((salaryForm.amount/salaryForm.duration)*1.05).toFixed(2)), duration: salaryForm.duration, startDate: new Date().toLocaleDateString(), status: 'active', requestedAt: new Date().toLocaleString() }; setSalaryPlans(p=>[np, ...p]); setAccounts(accs=>accs.map(ax=>ax.id===t.id?{...ax, balance: ax.balance+salaryForm.amount}:ax)); setModal(null); alert('تم منح التمويل بنجاح 🏦'); }} className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-10 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black text-white tracking-tighter">منح تمويل فوري</h3>
                <div className="space-y-4">
                  <input required value={salaryForm.username} onChange={e=>setSalaryForm({...salaryForm, username: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all font-mono" placeholder="اسم المستخدم" />
                  <input required value={salaryForm.benName} onChange={e=>setSalaryForm({...salaryForm, benName: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" placeholder="اسم المستفيد" />
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">المبلغ ($)</label><input type="number" required value={salaryForm.amount} onChange={e=>setSalaryForm({...salaryForm, amount: parseInt(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-indigo-400 outline-none text-2xl text-center" /></div>
                    <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">المدة (أشهر)</label><input type="number" required value={salaryForm.duration} onChange={e=>setSalaryForm({...salaryForm, duration: parseInt(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none text-center" /></div>
                  </div>
                </div>
                <button type="submit" className="w-full py-8 bg-indigo-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-indigo-500 transition-all active:scale-95">تأكيد التمويل 🏦</button>
                <button type="button" onClick={()=>setModal(null)} className="text-slate-500 font-bold hover:text-white transition-colors">إغلاق</button>
             </form>
          </div>
        )}

      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8); }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
      `}</style>
    </div>
  );
};

export default DeveloperDashboard;
