
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, SiteConfig, RechargeCard, Transaction, Notification, FixedDeposit, TradeAsset, RaffleEntry, RaffleWinner, BankCard, WithdrawalRequest, UserAsset, DepositPlan, SalaryFinancing } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  siteConfig: SiteConfig;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  rechargeCards: RechargeCard[];
  setRechargeCards: React.Dispatch<React.SetStateAction<RechargeCard[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  onUpdateUser: (updatedUser: User) => void;
  fixedDeposits: FixedDeposit[];
  setFixedDeposits: React.Dispatch<React.SetStateAction<FixedDeposit[]>>;
  tradeAssets: TradeAsset[];
  raffleEntries: RaffleEntry[];
  setRaffleEntries: React.Dispatch<React.SetStateAction<RaffleEntry[]>>;
  raffleWinners: RaffleWinner[];
  withdrawalRequests: WithdrawalRequest[];
  setWithdrawalRequests: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  salaryPlans: SalaryFinancing[];
  setSalaryPlans: React.Dispatch<React.SetStateAction<SalaryFinancing[]>>;
}

const TradingViewWidget: React.FC<{ symbol: string }> = ({ symbol }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "1",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "ar",
      "enable_publishing": false,
      "allow_symbol_change": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });
    container.current.appendChild(script);
  }, [symbol]);

  return <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}></div>;
};

// مكون العد التنازلي الفرعي
const RaffleCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // نهاية الشهر الحالي الساعة 23:59:59
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const difference = endOfMonth.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  const timeBlocks = [
    { label: 'يوم', val: timeLeft.days },
    { label: 'ساعة', val: timeLeft.hours },
    { label: 'دقيقة', val: timeLeft.minutes },
    { label: 'ثانية', val: timeLeft.seconds }
  ];

  return (
    <div className="flex justify-center gap-4 md:gap-8">
      {timeBlocks.map((block, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-black/40 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent"></div>
             <span className="text-2xl md:text-5xl font-black font-mono text-amber-500 animate-pulse">{block.val.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] md:text-xs font-black text-slate-500 mt-2 uppercase tracking-widest">{block.label}</span>
        </div>
      ))}
    </div>
  );
};

const UserDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  transactions, setTransactions, addNotification, onUpdateUser, fixedDeposits, setFixedDeposits, tradeAssets,
  raffleEntries, setRaffleEntries, raffleWinners, withdrawalRequests, setWithdrawalRequests,
  salaryPlans, setSalaryPlans
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trading' | 'investment' | 'raffle' | 'salary' | 'profile'>('dashboard');
  const [modalType, setModalType] = useState<'coupon' | 'invest_form' | 'raffle_join' | 'add_card' | 'withdraw' | 'transfer' | 'salary_apply' | null>(null);
  
  // Logic States
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferStep, setTransferStep] = useState(0);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Form States
  const [transferData, setTransferData] = useState({ recipient: '', amount: '' });
  const [couponCode, setCouponCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<DepositPlan | null>(null);
  const [investAmount, setInvestAmount] = useState<number>(0);
  const [withdrawData, setWithdrawData] = useState({ amount: '', bankName: '', iban: '', swift: '' });
  const [salaryForm, setSalaryForm] = useState({ amount: 5000, duration: 12 });

  // Profile Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const bankingPhrases = [
    "جاري تهيئة الاتصال المشفر مع بوابة الدفع العالمية...",
    "التحقق من صحة بيانات المستلم في السجل المصرفي الموحد...",
    "بدء عملية المقاصة الرقمية عبر نظام FastPay المركزي...",
    "تأمين المعاملة ببروتوكول حماية من الدرجة العسكرية...",
    "فحص سجلات الامتثال ومنع غسيل الأموال...",
    "إتمام عملية التحويل وتحديث الأرصدة فورياً..."
  ];

  const handleStartTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferData.amount);
    const target = accounts.find(a => a.username === transferData.recipient);
    
    if (!target) return alert('اسم المستخدم المستلم غير موجود');
    if (amount > user.balance || amount <= 0) return alert('الرصيد غير كافٍ');
    
    setIsTransferring(true);
    setTransferProgress(0);
    setTransferStep(0);
    
    const duration = 8000;
    const intervalTime = 100;
    const increment = (100 / (duration / intervalTime));

    const timer = setInterval(() => {
      setTransferProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          finalizeTransfer();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    const stepTimer = setInterval(() => {
      setTransferStep(prev => (prev + 1) % bankingPhrases.length);
    }, 2000);
  };

  const finalizeTransfer = () => {
    const amount = parseFloat(transferData.amount);
    const target = accounts.find(a => a.username === transferData.recipient);
    
    if (target) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === user.id) return { ...acc, balance: acc.balance - amount };
        if (acc.id === target.id) return { ...acc, balance: acc.balance + amount };
        return acc;
      }));
      onUpdateUser({ ...user, balance: user.balance - amount });
      setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'send', amount: -amount, relatedUser: `تحويل إلى @${target.username}`, timestamp: new Date().toLocaleString() }, ...prev]);
      addNotification('تحويل ناجح', `تم تحويل مبلغ $${amount} إلى ${target.fullName} بنجاح.`, 'money');
      setTransferSuccess(true);
      setTimeout(() => { setModalType(null); setIsTransferring(false); setTransferSuccess(false); setTransferData({ recipient: '', amount: '' }); }, 3000);
    }
  };

  const handleApplySalary = (e: React.FormEvent) => {
    e.preventDefault();
    const deduction = (salaryForm.amount / salaryForm.duration) * 1.05;
    const newPlan: SalaryFinancing = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      beneficiaryName: user.fullName,
      amount: salaryForm.amount,
      deduction: Number(deduction.toFixed(2)),
      duration: salaryForm.duration,
      startDate: new Date().toLocaleDateString(),
      status: 'pending',
      requestedAt: new Date().toLocaleString()
    };
    setSalaryPlans(prev => [newPlan, ...prev]);
    addNotification('طلب تمويل', `تم إرسال طلب تمويل بقيمة $${salaryForm.amount}.`, 'system');
    setModalType(null);
    alert('تم إرسال طلب التمويل بنجاح لمراجعة الإدارة.');
  };

  const handleWithdrawSwift = (e: React.FormEvent) => {
     e.preventDefault();
     const amount = parseFloat(withdrawData.amount);
     if (amount > user.balance || amount <= 0) return alert('الرصيد غير كافٍ');
     
     const newRequest: WithdrawalRequest = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        amount,
        bankName: withdrawData.bankName,
        iban: withdrawData.iban,
        swiftCode: withdrawData.swift,
        status: 'pending',
        requestedAt: new Date().toLocaleString()
     };
     setWithdrawalRequests(prev => [newRequest, ...prev]);
     const newBalance = user.balance - amount;
     onUpdateUser({ ...user, balance: newBalance });
     setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: newBalance } : acc));
     setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'withdrawal', amount: -amount, timestamp: new Date().toLocaleString(), relatedUser: 'سحب Swift بنكي' }, ...prev]);
     addNotification('طلب سحب', `تم طلب سحب مبلغ $${amount} بنجاح.`, 'money');
     setModalType(null);
     alert('تم تقديم طلب السحب بنجاح.');
  };

  const handleRedeemCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const coupon = rechargeCards.find(c => c.code === couponCode && !c.isUsed);
    if (coupon) {
       setRechargeCards(prev => prev.map(c => c.code === couponCode ? { ...c, isUsed: true, usedBy: user.username, usedAt: new Date().toLocaleString() } : c));
       const newBalance = user.balance + coupon.amount;
       onUpdateUser({ ...user, balance: newBalance });
       setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: newBalance } : acc));
       setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'redeem', amount: coupon.amount, timestamp: new Date().toLocaleString(), relatedUser: 'شحن بطاقة' }, ...prev]);
       addNotification('شحن رصيد', `تم شحن $${coupon.amount} بنجاح.`, 'money');
       setModalType(null);
       setCouponCode('');
    } else {
       alert('الكود غير صحيح أو مستخدم مسبقاً');
    }
  };

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (investAmount < selectedPlan.minAmount) return alert(`الحد الأدنى لهذه الخطة هو $${selectedPlan.minAmount}`);
    if (investAmount > user.balance) return alert('رصيدك غير كافٍ');

    const profit = (investAmount * (selectedPlan.rate / 100)) * (selectedPlan.durationMonths / 12);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + selectedPlan.durationMonths);

    const newDeposit: FixedDeposit = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      amount: investAmount,
      interestRate: selectedPlan.rate,
      durationMonths: selectedPlan.durationMonths,
      startDate: new Date().toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
      expectedProfit: profit,
      status: 'active'
    };

    setFixedDeposits(prev => [newDeposit, ...prev]);
    const newBalance = user.balance - investAmount;
    onUpdateUser({ ...user, balance: newBalance });
    setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: newBalance } : acc));
    
    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'fixed_deposit', amount: -investAmount, timestamp: new Date().toLocaleString(), relatedUser: `استثمار: ${selectedPlan.name}` }, ...prev]);
    addNotification('بدء استثمار', `تم بدء خطة استثمار بقيمة $${investAmount}.`, 'money');
    setModalType(null);
    setSelectedPlan(null);
    setInvestAmount(0);
    alert('تم بدء الاستثمار بنجاح!');
  };

  const handleJoinRaffle = () => {
    if (user.balance < siteConfig.raffleEntryCost) return alert('رصيدك لا يكفي للمشاركة في القرعة');
    
    const newEntry: RaffleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      ticketNumber: `FP-RAFF-${Math.floor(100000 + Math.random() * 900000)}`,
      enteredAt: new Date().toLocaleString()
    };

    setRaffleEntries(prev => [...prev, newEntry]);
    const newBalance = user.balance - siteConfig.raffleEntryCost;
    onUpdateUser({ ...user, balance: newBalance });
    setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: newBalance } : acc));
    
    setTransactions(prev => [{ id: Math.random().toString(36).substr(2, 9), userId: user.id, type: 'raffle_entry', amount: -siteConfig.raffleEntryCost, timestamp: new Date().toLocaleString(), relatedUser: 'دخول سحب القرعة' }, ...prev]);
    addNotification('القرعة السيادية', 'تم حجز تذكرتك في السحب الشهري بنجاح.', 'system');
    alert(`تم الدخول بنجاح! رقم تذكرتك هو: ${newEntry.ticketNumber}`);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (oldPassword !== user.password) {
      setPasswordError('كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    onUpdateUser({ ...user, password: newPassword });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
    addNotification('أمن الحساب', 'تم تحديث كلمة المرور بنجاح.', 'security');
    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#020617] text-right text-white font-sans overflow-hidden flex flex-col" dir="rtl">
       <header className="h-16 bg-[#0f172a] border-b border-white/5 px-6 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-10">
             <img src={siteConfig.logoUrl} style={{ width: `100px` }} alt="Logo" className="cursor-pointer" onClick={() => setActiveTab('dashboard')} />
             <nav className="hidden xl:flex items-center h-full">
                {[
                  { id: 'dashboard', l: 'الرئيسية', i: '🏠' },
                  { id: 'trading', l: 'التداول', i: '📈' },
                  { id: 'investment', l: 'الاستثمار', i: '💎' },
                  { id: 'raffle', l: 'القرعة', i: '🎁' },
                  { id: 'salary', l: 'تمويل الرواتب', i: '🏦' },
                  { id: 'profile', l: 'الملف الشخصي', i: '⚙️' }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 font-bold px-6 h-16 border-b-2 transition-all duration-300 ${activeTab === t.id ? 'text-sky-400 border-sky-400 bg-sky-400/5' : 'text-slate-500 border-transparent hover:text-white'}`}>
                    <span className="text-xl">{t.i}</span>
                    <span className="text-sm">{t.l}</span>
                  </button>
                ))}
             </nav>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                <p className="text-sm font-black text-emerald-400 font-mono">${user.balance.toLocaleString()}</p>
             </div>
             <button onClick={onLogout} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-black hover:bg-red-600 hover:text-white transition-all">خروج</button>
          </div>
       </header>

       <main className="flex-1 overflow-hidden z-10 flex flex-col">
          {activeTab === 'dashboard' && (
             <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-12 animate-in fade-in duration-500 pb-40">
                <div className="max-w-7xl mx-auto space-y-12">
                   <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-16 rounded-[4rem] border border-sky-500/20 shadow-3xl text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                      <p className="text-sky-400 font-black tracking-widest text-sm uppercase mb-6 relative z-10">الرصيد السيادي المتوفر</p>
                      <h2 className="text-8xl font-black font-mono tracking-tighter mb-12 relative z-10">${user.balance.toLocaleString()}</h2>
                      <div className="flex flex-wrap justify-center gap-6 relative z-10">
                         <button onClick={() => setModalType('transfer')} className="bg-sky-600 px-10 py-6 rounded-3xl font-black text-xl hover:bg-sky-500 shadow-2xl transition-all">تحويل مالي فوري</button>
                         <button onClick={() => setModalType('coupon')} className="bg-emerald-600 px-10 py-6 rounded-3xl font-black text-xl hover:bg-emerald-500 transition-all shadow-2xl">إيداع بكوبون شحن</button>
                         <button onClick={() => setModalType('withdraw')} className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl font-black text-xl hover:bg-white/10 transition-all">طلب سحب Swift</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="bg-[#0f172a]/80 p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                         <h3 className="text-3xl font-black mb-8">أحدث العمليات</h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {transactions.filter(t=>t.userId===user.id).slice(0, 10).map(t => (
                               <div key={t.id} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5">
                                  <div><p className="font-bold text-white">{t.relatedUser || t.type}</p><p className="text-[10px] text-slate-500 uppercase font-black">{t.timestamp}</p></div>
                                  <p className={`text-2xl font-mono font-black ${t.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}</p>
                               </div>
                            ))}
                            {transactions.filter(t=>t.userId===user.id).length === 0 && <p className="text-center py-10 opacity-20 italic">لا توجد عمليات سابقة</p>}
                         </div>
                      </div>
                      <div className="bg-[#0f172a]/80 p-10 rounded-[4rem] border border-white/5 shadow-2xl">
                         <h3 className="text-3xl font-black mb-8">نشاطي الاستثماري</h3>
                         <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {fixedDeposits.filter(d=>d.userId===user.id).map(dep => (
                               <div key={dep.id} className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] border border-white/10">
                                  <div className="flex justify-between items-start mb-4">
                                     <h4 className="text-xl font-black text-sky-400">${dep.amount.toLocaleString()}</h4>
                                     <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-3 py-1 rounded-full font-black">نشط</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-bold mb-4">الربح المتوقع: <span className="text-emerald-400">${dep.expectedProfit.toFixed(2)}</span></p>
                                  <p className="text-[9px] text-slate-600 mt-2 font-black uppercase">تاريخ الاستحقاق: {dep.endDate}</p>
                               </div>
                            ))}
                            {fixedDeposits.filter(d=>d.userId===user.id).length === 0 && <p className="text-center py-10 opacity-20 italic">لا توجد استثمارات قائمة</p>}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'investment' && (
             <div className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-500 pb-40">
                <div className="max-w-7xl mx-auto space-y-16">
                   <div className="text-center space-y-4">
                      <h2 className="text-7xl font-black tracking-tighter">صناديق استثمار النخبة</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {siteConfig.depositPlans.map(plan => (
                         <div key={plan.id} className="group bg-slate-900/60 p-12 rounded-[4rem] border border-white/5 shadow-2xl hover:border-sky-500/40 transition-all text-center">
                            <h4 className="text-3xl font-black text-sky-400 mb-4">{plan.name}</h4>
                            <p className="text-7xl font-black font-mono mb-8">{plan.rate}%</p>
                            <ul className="space-y-4 mb-12 text-slate-400 font-bold text-right pr-6">
                               <li className="flex items-center gap-3">✅ مدة الاستثمار: {plan.durationMonths} أشهر</li>
                               <li className="flex items-center gap-3">✅ الحد الأدنى: ${plan.minAmount.toLocaleString()}</li>
                            </ul>
                            <button onClick={() => { setSelectedPlan(plan); setModalType('invest_form'); }} className="w-full py-6 bg-sky-600 rounded-3xl font-black text-xl hover:bg-sky-500 transition-all">استثمر الآن</button>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'raffle' && (
             <div className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 text-center pb-40">
                <div className="max-w-4xl mx-auto space-y-16">
                   <div className="bg-amber-500/10 p-12 md:p-20 rounded-[5rem] border border-amber-500/20 shadow-3xl space-y-12">
                      <div className="space-y-4">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-amber-500">مهرجان جوائز FastPay</h2>
                        <p className="text-xl md:text-2xl text-slate-300 font-bold">تذكرتك نحو الرفاهية. شارك في السحب الأكبر!</p>
                      </div>

                      {/* عداد القرعة الجديد */}
                      <div className="space-y-6">
                         <p className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.4em]">المتبقي على السحب المباشر</p>
                         <RaffleCountdown />
                      </div>

                      <button onClick={handleJoinRaffle} className="bg-amber-600 px-12 md:px-20 py-6 md:py-8 rounded-[3rem] font-black text-2xl md:text-3xl shadow-3xl hover:bg-amber-500 transition-all active:scale-95">احجز تذكرتك (${siteConfig.raffleEntryCost})</button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 text-right shadow-xl">
                         <h3 className="text-2xl font-black mb-6">تذاكري في السحب</h3>
                         <div className="space-y-3">
                            {raffleEntries.filter(e=>e.userId===user.id).map(e => (
                               <div key={e.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-amber-500/40 transition-all">
                                  <span className="font-mono text-amber-500 font-black tracking-widest">{e.ticketNumber}</span>
                                  <span className="text-[10px] text-slate-500 uppercase font-black">{e.enteredAt}</span>
                               </div>
                            ))}
                            {raffleEntries.filter(e=>e.userId===user.id).length === 0 && <p className="opacity-20 italic py-10 text-center">لم تشارك في أي سحب بعد</p>}
                         </div>
                      </div>
                      <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 text-right shadow-xl">
                         <h3 className="text-2xl font-black mb-6 text-emerald-400">آخر الفائزين الملكيين</h3>
                         <div className="space-y-3">
                            {raffleWinners.slice(0, 5).map(w => (
                               <div key={w.id} className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex justify-between items-center group">
                                  <span className="font-black text-white">@{w.username}</span>
                                  <span className="text-xs font-black text-emerald-500">{w.prizeTitle}</span>
                               </div>
                            ))}
                            {raffleWinners.length === 0 && <p className="opacity-20 italic py-10 text-center">بانتظار السحب القادم...</p>}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'trading' && (
             <div className="flex-1 flex flex-col animate-in zoom-in duration-500 h-full overflow-hidden">
                <TradingViewWidget symbol="BINANCE:BTCUSDT" />
             </div>
          )}

          {activeTab === 'salary' && (
             <div className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-500 pb-40">
                <div className="max-w-6xl mx-auto space-y-12">
                   <div className="bg-indigo-900/40 p-16 rounded-[4rem] border border-indigo-500/20 shadow-3xl flex justify-between items-center gap-12">
                      <div className="text-right space-y-6">
                         <h2 className="text-6xl font-black tracking-tighter">تمويل الرواتب المسبق</h2>
                         <p className="text-2xl text-slate-300 font-bold">احصل على سيولة نقدية فورية بضمان راتبك، مع تسديد مريح.</p>
                         <button onClick={() => setModalType('salary_apply')} className="bg-white text-indigo-900 px-12 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:scale-105 transition-all">اطلب التمويل الآن</button>
                      </div>
                      <div className="text-[10rem] animate-pulse opacity-20 hidden lg:block">🏦</div>
                   </div>
                   <div className="space-y-8">
                      <h3 className="text-3xl font-black">طلباتي الحالية</h3>
                      {salaryPlans.filter(p=>p.userId===user.id).map(plan => (
                         <div key={plan.id} className="p-10 bg-[#0f172a]/60 border border-white/5 rounded-[3rem] flex justify-between items-center">
                            <div><p className="text-3xl font-black text-white">تمويل بقيمة ${plan.amount.toLocaleString()}</p><p className="text-slate-500 font-bold">القسط الشهري: ${plan.deduction} / لمدة {plan.duration} شهر</p></div>
                            <div className={`px-10 py-4 rounded-3xl border font-black text-sm ${plan.status==='active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : plan.status==='pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                               {plan.status==='active' ? 'معتمد' : plan.status==='pending' ? 'قيد المراجعة' : 'ملغي'}
                            </div>
                         </div>
                      ))}
                      {salaryPlans.filter(p=>p.userId===user.id).length === 0 && <p className="opacity-20 italic text-center py-20">لا يوجد لديك طلبات تمويل</p>}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
             <div className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500 pb-40">
                <div className="max-w-4xl mx-auto space-y-12">
                   <h2 className="text-6xl font-black tracking-tighter">إعدادات الملف الشخصي</h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-[#0f172a]/60 p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                         <h3 className="text-2xl font-black border-r-4 border-sky-500 pr-4">بيانات الحساب</h3>
                         <div className="space-y-4">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">الاسم الكامل</p>
                               <p className="text-xl font-bold">{user.fullName}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">البريد الإلكتروني</p>
                               <p className="text-xl font-bold">{user.email}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">رقم الهاتف</p>
                               <p className="text-xl font-bold" dir="ltr">{user.phoneNumber || '—'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-[#0f172a]/60 p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                         <h3 className="text-2xl font-black border-r-4 border-emerald-500 pr-4">البطاقات المرتبطة</h3>
                         <div className="space-y-4">
                            {(user.linkedCards || []).map(card => (
                               <div key={card.id} className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl border border-white/10 flex justify-between items-center group">
                                  <div>
                                     <p className="text-lg font-mono tracking-widest">•••• {card.number.slice(-4)}</p>
                                     <p className="text-[10px] text-slate-500 uppercase font-black">{card.type}</p>
                                  </div>
                                  <button onClick={() => onUpdateUser({ ...user, linkedCards: user.linkedCards?.filter(c=>c.id!==card.id) })} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                               </div>
                            ))}
                            <button onClick={() => setModalType('add_card')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-sky-500/40 hover:text-sky-400 transition-all">+ ربط بطاقة جديدة</button>
                         </div>
                      </div>
                   </div>

                   <form onSubmit={handleUpdatePassword} className="bg-[#0f172a]/60 p-12 rounded-[4rem] border border-white/5 shadow-2xl space-y-10">
                      <h3 className="text-3xl font-black border-r-8 border-sky-500 pr-8">تغيير كلمة المرور</h3>
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">كلمة المرور الحالية</label>
                            <input type="password" required value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">الجديدة</label>
                               <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">تأكيد الجديدة</label>
                               <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" />
                            </div>
                         </div>
                      </div>
                      {passwordError && <p className="text-red-500 font-black text-xs">{passwordError}</p>}
                      {passwordSuccess && <p className="text-emerald-500 font-black text-xs">تم تحديث كلمة المرور بنجاح ✅</p>}
                      <button type="submit" className="w-full py-8 bg-sky-600 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">تحديث الأمان</button>
                   </form>
                </div>
             </div>
          )}
       </main>

       {/* MODALS */}
       
       {/* Modal: Withdraw Swift */}
       {modalType === 'withdraw' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleWithdrawSwift} className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-[5rem] p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black text-white">طلب سحب Swift بنكي</h3>
                <div className="space-y-4 text-right">
                   <input required value={withdrawData.bankName} onChange={e=>setWithdrawData({...withdrawData, bankName: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" placeholder="اسم البنك (Bank Name)" />
                   <input required value={withdrawData.iban} onChange={e=>setWithdrawData({...withdrawData, iban: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono" placeholder="رقم الآيبان (IBAN)" />
                   <input required value={withdrawData.swift} onChange={e=>setWithdrawData({...withdrawData, swift: e.target.value})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono uppercase" placeholder="كود السويفت (SWIFT Code)" />
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 pr-4 uppercase">المبلغ ($)</label>
                      <input required type="number" value={withdrawData.amount} onChange={e=>setWithdrawData({...withdrawData, amount: e.target.value})} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2rem] font-black text-5xl text-center text-sky-400 outline-none" placeholder="0.00" />
                   </div>
                </div>
                <button type="submit" className="w-full py-8 bg-sky-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all">تقديم طلب السحب 🏦</button>
                <button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4">إلغاء</button>
             </form>
          </div>
       )}

       {/* Modal: Salary Apply */}
       {modalType === 'salary_apply' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleApplySalary} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[5rem] p-16 space-y-10 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black text-white">طلب تمويل راتب مسبق</h3>
                <div className="space-y-6 text-right">
                   <div className="space-y-2"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">المبلغ المطلوب ($)</label><input type="number" required value={salaryForm.amount} onChange={e=>setSalaryForm({...salaryForm, amount: parseInt(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white text-3xl text-center outline-none focus:border-indigo-500" /></div>
                   <div className="space-y-2"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">مدة السداد (أشهر)</label><input type="number" required value={salaryForm.duration} onChange={e=>setSalaryForm({...salaryForm, duration: parseInt(e.target.value)})} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white text-2xl text-center outline-none focus:border-indigo-500" /></div>
                </div>
                <button type="submit" className="w-full py-8 bg-indigo-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-indigo-500 transition-all">تقديم الطلب للمراجعة ⚡</button>
                <button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4">إلغاء</button>
             </form>
          </div>
       )}

       {/* Modal: Investment Form */}
       {modalType === 'invest_form' && selectedPlan && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleInvestSubmit} className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-[5rem] p-16 space-y-12 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black text-sky-400">{selectedPlan.name}</h3>
                <div className="space-y-8 text-right">
                   <div className="space-y-3"><label className="text-xs font-black text-slate-500 mr-8 uppercase">المبلغ المراد استثماره ($)</label><input type="number" required min={selectedPlan.minAmount} value={investAmount || ''} onChange={e=>setInvestAmount(parseFloat(e.target.value))} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2.5rem] font-black text-center text-5xl text-white outline-none font-mono" /></div>
                   <div className="p-8 bg-sky-500/10 rounded-3xl border border-sky-500/20"><p className="text-slate-500 font-black text-xs uppercase mb-2">العائد المتوقع بعد {selectedPlan.durationMonths} شهر</p><p className="text-3xl font-black text-emerald-400 font-mono">+${((investAmount || 0) * (selectedPlan.rate/100) * (selectedPlan.durationMonths/12)).toFixed(2)}</p></div>
                </div>
                <button type="submit" className="w-full py-10 bg-sky-600 rounded-[4rem] font-black text-3xl shadow-3xl hover:bg-sky-500 transition-all">تأكيد بدء الاستثمار 🚀</button>
                <button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4">إلغاء</button>
             </form>
          </div>
       )}

       {/* Modal: Transfer */}
       {modalType === 'transfer' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <div className="bg-[#0f172a] border border-white/10 w-full max-w-3xl rounded-[6rem] p-16 md:p-24 overflow-hidden shadow-3xl text-center relative">
                <button onClick={()=>setModalType(null)} className={`absolute top-12 right-12 text-slate-500 hover:text-white text-3xl transition-all ${isTransferring ? 'hidden' : ''}`}>✕</button>
                {!isTransferring ? (
                   <form onSubmit={handleStartTransfer} className="space-y-12 animate-in zoom-in duration-500">
                      <div className="space-y-8 text-right">
                         <div className="space-y-3"><label className="text-xs font-black text-slate-500 mr-8 uppercase">اسم المستخدم المستلم</label><input required value={transferData.recipient} onChange={e=>setTransferData({...transferData, recipient: e.target.value})} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2.5rem] font-black text-center text-4xl text-white outline-none focus:border-sky-500" placeholder="@username" /></div>
                         <div className="space-y-3"><label className="text-xs font-black text-slate-500 mr-8 uppercase">المبلغ المراد تحويله ($)</label><input required type="number" value={transferData.amount} onChange={e=>setTransferData({...transferData, amount: e.target.value})} className="w-full p-10 bg-black/40 border border-white/10 rounded-[3rem] font-black text-center text-[5rem] text-sky-400 outline-none font-mono" placeholder="0.00" /></div>
                      </div>
                      <button type="submit" className="w-full py-10 bg-sky-600 rounded-[3.5rem] font-black text-3xl shadow-3xl hover:bg-sky-500 transition-all active:scale-95">تأكيد ومباشرة التحويل</button>
                   </form>
                ) : (
                   <div className="space-y-16 py-12">
                      {transferSuccess ? (
                         <div className="space-y-10 animate-in zoom-in duration-700"><div className="w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center text-[10rem] mx-auto shadow-3xl border-4 border-emerald-400 animate-pulse">✓</div><h3 className="text-6xl font-black text-white tracking-tighter">تم التحويل بنجاح</h3></div>
                      ) : (
                         <div className="space-y-16">
                            <div className="relative w-full h-16 bg-white/5 border border-white/10 rounded-full overflow-hidden shadow-inner">
                               <div className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 shadow-[0_0_40px_rgba(14,165,233,0.5)] transition-all duration-300" style={{ width: `${transferProgress}%` }}></div>
                               <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-2xl mix-blend-difference">{Math.floor(transferProgress)}%</div>
                            </div>
                            <p className="text-3xl font-black text-sky-400 animate-pulse h-20 leading-relaxed px-10">{bankingPhrases[transferStep]}</p>
                         </div>
                      )}
                   </div>
                )}
             </div>
          </div>
       )}

       {modalType === 'coupon' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleRedeemCoupon} className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-[5rem] p-16 md:p-24 space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
                <button type="button" onClick={()=>setModalType(null)} className="absolute top-12 right-12 text-slate-500 hover:text-white text-3xl">✕</button>
                <h3 className="text-5xl font-black text-white tracking-tighter">شحن رصيد الكوبون</h3>
                <div className="space-y-4">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">أدخل كود الشحن المكون من 12 رمزاً</label>
                   <input required value={couponCode} onChange={e=>setCouponCode(e.target.value)} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2.5rem] font-black text-center text-4xl text-sky-400 outline-none font-mono tracking-widest uppercase focus:border-sky-500" placeholder="FP-XXXX-XXXX" />
                </div>
                <button type="submit" className="w-full py-10 bg-emerald-600 rounded-[4rem] font-black text-3xl shadow-3xl hover:bg-emerald-500 transition-all active:scale-95">تفعيل وشحن الرصيد فوراً</button>
             </form>
          </div>
       )}

       {modalType === 'add_card' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={(e) => {
                e.preventDefault();
                const newCard: BankCard = {
                   id: Math.random().toString(36).substr(2, 9),
                   number: (document.getElementById('c_num') as HTMLInputElement).value,
                   holder: (document.getElementById('c_hold') as HTMLInputElement).value,
                   expiry: (document.getElementById('c_exp') as HTMLInputElement).value,
                   cvc: (document.getElementById('c_cvc') as HTMLInputElement).value,
                   type: 'visa'
                };
                onUpdateUser({ ...user, linkedCards: [...(user.linkedCards || []), newCard] });
                setModalType(null);
                addNotification('ربط بطاقة', 'تم ربط بطاقة بنكية جديدة بحسابك بنجاح.', 'security');
             }} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-4xl font-black text-white tracking-tighter">ربط بطاقة بنكية عالمية</h3>
                <div className="space-y-4 text-right">
                   <input id="c_hold" required className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none" placeholder="اسم حامل البطاقة" />
                   <input id="c_num" required className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none font-mono" placeholder="رقم البطاقة (16 رقم)" />
                   <div className="grid grid-cols-2 gap-4">
                      <input id="c_exp" required className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none font-mono" placeholder="MM/YY" />
                      <input id="c_cvc" required className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none font-mono" placeholder="CVC" />
                   </div>
                </div>
                <button type="submit" className="w-full py-6 bg-sky-600 rounded-3xl font-black text-xl shadow-2xl hover:bg-sky-500 transition-all">تأكيد الربط المشفر</button>
                <button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4">إلغاء</button>
             </form>
          </div>
       )}

       <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8); }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
       `}</style>
    </div>
  );
};

export default UserDashboard;
