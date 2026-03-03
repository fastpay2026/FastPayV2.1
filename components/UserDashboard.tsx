
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, SiteConfig, RechargeCard, Transaction, Notification, FixedDeposit, TradeAsset, RaffleEntry, RaffleWinner, BankCard, WithdrawalRequest, UserAsset, DepositPlan, SalaryFinancing, AdExchangeItem, AdNegotiation } from '../types';
import { AdExchange } from './AdExchange';
import { useI18n } from '../i18n/i18n';

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
  addNotification: (title: string, message: string, type: Notification['type'], targetUserId?: string) => void;
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
  adExchangeItems: AdExchangeItem[];
  setAdExchangeItems: React.Dispatch<React.SetStateAction<AdExchangeItem[]>>;
  adNegotiations: AdNegotiation[];
  setAdNegotiations: React.Dispatch<React.SetStateAction<AdNegotiation[]>>;
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

const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 justify-center" dir="ltr">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-20 text-center">
          <p className="text-2xl font-black text-amber-500 font-mono">{String(item.value).padStart(2, '0')}</p>
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

const UserDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  transactions, setTransactions, addNotification, onUpdateUser, fixedDeposits, setFixedDeposits, tradeAssets,
  raffleEntries, setRaffleEntries, raffleWinners, withdrawalRequests, setWithdrawalRequests,
  salaryPlans, setSalaryPlans, adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations
}) => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trading' | 'investment' | 'raffle' | 'salary' | 'profile' | 'ads'>('dashboard');
  const [modalType, setModalType] = useState<'coupon' | 'invest_form' | 'raffle_join' | 'add_card' | 'withdraw' | 'transfer' | 'salary_apply' | 'withdraw_warning' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Logic States
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferStep, setTransferStep] = useState(0);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const [isLinkingCard, setIsLinkingCard] = useState(false);
  const [linkingProgress, setLinkingProgress] = useState(0);
  const [linkingStep, setLinkingStep] = useState(0);
  const [linkingSuccess, setLinkingSuccess] = useState(false);
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'unknown'>('unknown');
  const [cardData, setCardData] = useState({ number: '', holder: '', expiry: '', cvc: '' });

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
    t('transfer_phrase_1'),
    t('transfer_phrase_2'),
    t('transfer_phrase_3'),
    t('transfer_phrase_4'),
    t('transfer_phrase_5'),
    t('transfer_phrase_6')
  ];

  const cardLinkingPhrases = [
    t('card_link_phrase_1'),
    t('card_link_phrase_2'),
    t('card_link_phrase_3'),
    t('card_link_phrase_4'),
    t('card_link_phrase_5'),
    t('card_link_phrase_6'),
    t('card_link_phrase_7')
  ];

  const handleStartTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferData.amount);
    const target = accounts.find(a => a.username === transferData.recipient);
    
    if (!target) return alert(t('recipient_not_found'));
    if (amount > user.balance || amount <= 0) return alert(t('insufficient_balance'));
    
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
      setTransactions(prev => [{ id: uuidv4(), userId: user.id, type: 'send', amount: -amount, relatedUser: `${t('transfer_to')} @${target.username}`, timestamp: new Date().toLocaleString() }, ...prev]);
      addNotification(t('transfer_success_title'), t('transfer_success_msg', { amount, name: target.fullName }), 'money');
      setTransferSuccess(true);
      setTimeout(() => { setModalType(null); setIsTransferring(false); setTransferSuccess(false); setTransferData({ recipient: '', amount: '' }); }, 3000);
    }
  };

  const detectCardType = (number: string) => {
    const cleanNumber = number.replace(/\s+/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNumber) || /^2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)/.test(cleanNumber)) return 'mastercard';
    return 'unknown';
  };

  const handleStartLinking = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate expiry
    const [month, year] = cardData.expiry.split('/').map(n => parseInt(n));
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = parseInt(now.getFullYear().toString().slice(-2));
    
    if (!month || !year || month < 1 || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
      return alert(t('card_expired'));
    }

    if (cardData.number.replace(/\s+/g, '').length < 15) {
      return alert(t('invalid_card_number'));
    }

    setIsLinkingCard(true);
    setLinkingProgress(0);
    setLinkingStep(0);
    
    const duration = 15000; // 15 seconds
    const intervalTime = 100;
    const increment = (100 / (duration / intervalTime));

    const timer = setInterval(() => {
      setLinkingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          finalizeLinking();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    const stepTimer = setInterval(() => {
      setLinkingStep(prev => (prev + 1) % cardLinkingPhrases.length);
    }, 2000);
  };

  const finalizeLinking = () => {
    const newCard: BankCard = {
      id: uuidv4(),
      number: cardData.number,
      holder: cardData.holder,
      expiry: cardData.expiry,
      cvc: cardData.cvc,
      type: cardType === 'unknown' ? 'visa' : cardType
    };
    onUpdateUser({ ...user, linkedCards: [...(user.linkedCards || []), newCard] });
    setLinkingSuccess(true);
    addNotification(t('card_link_success_title'), t('card_link_success_msg'), 'security');
    
    setTimeout(() => {
      setModalType(null);
      setIsLinkingCard(false);
      setLinkingSuccess(false);
      setCardData({ number: '', holder: '', expiry: '', cvc: '' });
      setCardType('unknown');
    }, 3000);
  };

  const handleApplySalary = (e: React.FormEvent) => {
    e.preventDefault();
    const deduction = (salaryForm.amount / salaryForm.duration) * 1.05;
    const newPlan: SalaryFinancing = {
      id: uuidv4(),
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
    addNotification(t('salary_apply_success_title'), t('salary_apply_success_msg', { amount: salaryForm.amount }), 'system');
    setModalType(null);
    alert(t('salary_apply_alert'));
  };

  const handleWithdrawSwift = (e: React.FormEvent) => {
     e.preventDefault();
     const amount = parseFloat(withdrawData.amount);
     if (amount > user.balance || amount <= 0) return alert(t('insufficient_balance'));
     
     const newRequest: WithdrawalRequest = {
        id: uuidv4(),
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
     setTransactions(prev => [{ id: uuidv4(), userId: user.id, type: 'withdrawal', amount: -amount, timestamp: new Date().toLocaleString(), relatedUser: t('swift_withdrawal_desc'), relatedId: newRequest.id, status: 'pending' }, ...prev]);
     addNotification(t('withdraw_request_success_title'), t('withdraw_request_success_msg', { amount }), 'money');
     setModalType(null);
     alert(t('withdraw_request_alert'));
  };

  const handleRedeemCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const coupon = rechargeCards.find(c => c.code === couponCode && !c.isUsed);
    if (coupon) {
       setRechargeCards(prev => prev.map(c => c.code === couponCode ? { ...c, isUsed: true, usedBy: user.username, usedAt: new Date().toISOString() } : c));
       const newBalance = user.balance + coupon.amount;
       onUpdateUser({ ...user, balance: newBalance });
       setAccounts(prev => prev.map(acc => acc.id === user.id ? { ...acc, balance: newBalance } : acc));
       setTransactions(prev => [{ id: uuidv4(), userId: user.id, type: 'redeem', amount: coupon.amount, timestamp: new Date().toISOString(), relatedUser: t('card_recharge_desc') }, ...prev]);
       addNotification(t('recharge_success_title'), t('recharge_success_msg', { amount: coupon.amount }), 'money');
       setModalType(null);
       setCouponCode('');
    } else {
       alert(t('invalid_coupon'));
    }
  };

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (investAmount < selectedPlan.minAmount) return alert(t('min_invest_amount', { amount: selectedPlan.minAmount }));
    if (investAmount > user.balance) return alert(t('insufficient_balance'));

    const profit = (investAmount * (selectedPlan.rate / 100)) * (selectedPlan.durationMonths / 12);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + selectedPlan.durationMonths);

    const newDeposit: FixedDeposit = {
      id: uuidv4(),
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
    
    setTransactions(prev => [{ id: uuidv4(), userId: user.id, type: 'fixed_deposit', amount: -investAmount, timestamp: new Date().toLocaleString(), relatedUser: `${t('invest_desc')}: ${t(selectedPlan.name)}` }, ...prev]);
    addNotification(t('invest_start_title'), t('invest_start_msg', { amount: investAmount }), 'money');
    setModalType(null);
    setSelectedPlan(null);
    setInvestAmount(0);
    alert(t('invest_success_alert'));
  };

  const handleJoinRaffle = () => {
    if (user.balance < siteConfig.raffleEntryCost) return alert(t('raffle_insufficient_balance'));
    
    const newEntry: RaffleEntry = {
      id: uuidv4(),
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
    
    setTransactions(prev => [{ id: uuidv4(), userId: user.id, type: 'raffle_entry', amount: -siteConfig.raffleEntryCost, timestamp: new Date().toISOString(), relatedUser: t('raffle_entry_desc') }, ...prev]);
    addNotification(t('raffle_success_title'), t('raffle_success_msg'), 'system');
    alert(t('raffle_success_alert', { ticket: newEntry.ticketNumber }));
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (oldPassword !== user.password) {
      setPasswordError(t('current_password_incorrect'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('password_min_length'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwords_dont_match'));
      return;
    }

    onUpdateUser({ ...user, password: newPassword });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
    addNotification(t('password_update_success_title'), t('password_update_success_msg'), 'security');
    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  return (
    <div className={`fixed inset-0 z-[150] bg-[#020617] text-white font-sans overflow-hidden flex flex-col ${language === 'ar' || language === 'ku' ? 'text-right' : 'text-left'}`} dir={language === 'ar' || language === 'ku' ? 'rtl' : 'ltr'}>
       <header className="h-16 md:h-20 bg-[#0f172a] border-b border-white/5 px-4 md:px-8 flex justify-between items-center z-[200] shrink-0">
          <div className="flex items-center gap-4 md:gap-10">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden text-white text-2xl p-2">
                {isMobileMenuOpen ? '✕' : '☰'}
             </button>
             <img src={siteConfig.logoUrl} style={{ width: `80px` }} alt="Logo" className="cursor-pointer md:w-[100px]" onClick={() => setActiveTab('dashboard')} />
             <nav className="hidden xl:flex items-center h-full">
                {[
                  { id: 'dashboard', l: t('nav_overview'), i: '🏠' },
                  { id: 'trading', l: t('nav_trading_engine'), i: '📈' },
                  { id: 'investment', l: t('nav_invest_plans'), i: '💎' },
                  { id: 'raffle', l: t('nav_raffle_mgmt'), i: '🎁' },
                  { id: 'ads', l: t('nav_ad_exchange'), i: '📢' },
                  { id: 'salary', l: t('nav_salary_funding'), i: '🏦' },
                  { id: 'profile', l: t('nav_profile'), i: '⚙️' }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 font-bold px-6 h-16 md:h-20 border-b-2 transition-all duration-300 ${activeTab === t.id ? 'text-sky-400 border-sky-400 bg-sky-400/5' : 'text-slate-500 border-transparent hover:text-white'}`}>
                    <span className="text-xl">{t.i}</span>
                    <span className="text-sm">{t.l}</span>
                  </button>
                ))}
             </nav>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="bg-white/5 px-2 md:px-4 py-1 rounded-lg border border-white/10">
                <p className="text-xs md:text-sm font-black text-emerald-400 font-mono">${user.balance.toLocaleString()}</p>
             </div>
             <button onClick={onLogout} className="px-3 md:px-4 py-1.5 md:py-2 bg-red-500/10 text-red-400 rounded-lg text-[10px] md:text-xs font-black hover:bg-red-600 hover:text-white transition-all">{t('logout')}</button>
          </div>
       </header>

       {/* Mobile Menu Overlay */}
       {isMobileMenuOpen && (
         <div className="xl:hidden fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute top-16 md:top-20 right-0 w-64 h-full bg-[#0f172a] border-l border-white/5 p-6 space-y-4 animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
             {[
               { id: 'dashboard', l: t('nav_overview'), i: '🏠' },
               { id: 'trading', l: t('nav_trading_engine'), i: '📈' },
               { id: 'investment', l: t('nav_invest_plans'), i: '💎' },
               { id: 'raffle', l: t('nav_raffle_mgmt'), i: '🎁' },
               { id: 'ads', l: t('nav_ad_exchange'), i: '📢' },
               { id: 'salary', l: t('nav_salary_funding'), i: '🏦' },
               { id: 'profile', l: t('nav_profile'), i: '⚙️' }
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => { setActiveTab(t.id as any); setIsMobileMenuOpen(false); }} 
                 className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${activeTab === t.id ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
               >
                 <span className="text-2xl">{t.i}</span>
                 <span className="text-base">{t.l}</span>
               </button>
             ))}
           </div>
         </div>
       )}

       <main className="flex-1 overflow-hidden z-10 flex flex-col">
          {activeTab === 'dashboard' && (
             <div className="flex-1 p-4 md:p-12 overflow-y-auto custom-scrollbar space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-40">
                <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
                   <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 md:p-16 rounded-3xl md:rounded-[4rem] border border-sky-500/20 shadow-3xl text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                      <p className="text-sky-400 font-black tracking-widest text-[10px] md:text-sm uppercase mb-4 md:mb-6 relative z-10">{t('available_sovereign_balance')}</p>
                      <h2 className="text-4xl sm:text-5xl md:text-8xl font-black font-mono tracking-tighter mb-8 md:mb-12 relative z-10">${user.balance.toLocaleString()}</h2>
                      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 md:gap-6 relative z-10">
                         <button onClick={() => setModalType('transfer')} className="bg-sky-600 px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-xl hover:bg-sky-500 shadow-2xl transition-all">{t('instant_transfer')}</button>
                         <button onClick={() => setModalType('coupon')} className="bg-emerald-600 px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-xl hover:bg-emerald-500 transition-all shadow-2xl">{t('deposit_coupon')}</button>
                         <button 
                            onClick={() => {
                              if (!user.linkedCards || user.linkedCards.length === 0) {
                                setModalType('withdraw_warning');
                              } else {
                                setModalType('withdraw');
                              }
                            }} 
                            className="bg-white/5 border border-white/10 px-6 md:px-10 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-xl hover:bg-white/10 transition-all"
                          >
                            {t('swift_withdrawal_request')}
                          </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                      <div className="bg-[#0f172a]/80 p-6 md:p-10 rounded-3xl md:rounded-[4rem] border border-white/5 shadow-2xl">
                         <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8">{t('latest_transactions')}</h3>
                         <div className="space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto custom-scrollbar">
                            {transactions.filter(t=>t.userId===user.id).slice(0, 10).map(t => (
                               <div key={t.id} className="flex justify-between items-center p-4 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5">
                                  <div><p className="font-bold text-white text-sm md:text-base">{t.relatedUser || t.type}{t.status === 'rejected' && <span className="text-red-500 text-[10px] block md:inline md:mr-2 font-black"> (The operation was cancelled. Please try again later)</span>}</p><p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black">{t.timestamp}</p></div>
                                  <p className={`text-xl md:text-2xl font-mono font-black ${t.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}</p>
                               </div>
                            ))}
                            {transactions.filter(t=>t.userId===user.id).length === 0 && <p className="text-center py-10 opacity-20 italic">{t('no_transactions')}</p>}
                         </div>
                      </div>
                      <div className="bg-[#0f172a]/80 p-6 md:p-10 rounded-3xl md:rounded-[4rem] border border-white/5 shadow-2xl">
                         <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8">{t('investment_activity')}</h3>
                         <div className="space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto custom-scrollbar">
                            {fixedDeposits.filter(d=>d.userId===user.id).map(dep => (
                               <div key={dep.id} className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl md:rounded-[2.5rem] border border-white/10">
                                  <div className="flex justify-between items-start mb-4">
                                     <h4 className="text-lg md:text-xl font-black text-sky-400">${dep.amount.toLocaleString()}</h4>
                                     <span className="bg-emerald-500/10 text-emerald-500 text-[9px] md:text-[10px] px-3 py-1 rounded-full font-black">{t('active')}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-bold mb-4">{t('expected_profit')}: <span className="text-emerald-400">${dep.expectedProfit.toFixed(2)}</span></p>
                                  <p className="text-[8px] md:text-[9px] text-slate-600 mt-2 font-black uppercase">{t('maturity_date')}: {dep.endDate}</p>
                               </div>
                            ))}
                            {fixedDeposits.filter(d=>d.userId===user.id).length === 0 && <p className="text-center py-10 opacity-20 italic">{t('no_investments')}</p>}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'investment' && (
             <div className="flex-1 p-4 md:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-500 pb-40">
                <div className="max-w-7xl mx-auto space-y-10 md:space-y-16">
                   <div className="text-center space-y-4">
                      <h2 className="text-4xl md:text-7xl font-black tracking-tighter">{t('elite_investment_funds')}</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                      {siteConfig.depositPlans.map(plan => (
                         <div key={plan.id} className="group bg-slate-900/60 p-8 md:p-12 rounded-3xl md:rounded-[4rem] border border-white/5 shadow-2xl hover:border-sky-500/40 transition-all text-center">
                            <h4 className="text-2xl md:text-3xl font-black text-sky-400 mb-4">{t(plan.name)}</h4>
                            <p className="text-5xl md:text-7xl font-black font-mono mb-8">{plan.rate}%</p>
                            <ul className="space-y-3 md:space-y-4 mb-8 md:mb-12 text-slate-400 font-bold text-right pr-6">
                               <li className="flex items-center gap-3 text-sm md:text-base">✅ {t('invest_duration')}: {plan.durationMonths} {t('months')}</li>
                               <li className="flex items-center gap-3 text-sm md:text-base">✅ {t('min_amount')}: ${plan.minAmount.toLocaleString()}</li>
                            </ul>
                            <button onClick={() => { setSelectedPlan(plan); setModalType('invest_form'); }} className="w-full py-4 md:py-6 bg-sky-600 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl hover:bg-sky-500 transition-all">{t('invest_now')}</button>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'raffle' && (
             <div className="flex-1 p-4 md:p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 text-center pb-40">
                <div className="max-w-4xl mx-auto space-y-10 md:space-y-16">
                   <div className="bg-amber-500/10 p-8 md:p-20 rounded-3xl md:rounded-[5rem] border border-amber-500/20 shadow-3xl space-y-8 md:space-y-10">
                      <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-amber-500">{t('monthly_raffle_fastpay')}</h2>
                      <p className="text-lg md:text-2xl text-slate-300 font-bold">{t('raffle_ticket_dream')}</p>
                      
                      {siteConfig.showRaffleCountdown && siteConfig.raffleEndDate && (
                        <div className="py-4">
                           <p className="text-amber-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4">{t('next_draw_date')}</p>
                           <Countdown targetDate={siteConfig.raffleEndDate} />
                        </div>
                      )}
                      <button onClick={handleJoinRaffle} className="bg-amber-600 px-10 md:px-20 py-5 md:py-8 rounded-2xl md:rounded-[3rem] font-black text-xl md:text-3xl shadow-3xl hover:bg-amber-500 transition-all">{t('book_ticket')} (${siteConfig.raffleEntryCost})</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 text-right">
                         <h3 className="text-2xl font-black mb-6">{t('my_raffle_tickets')}</h3>
                         {raffleEntries.filter(e=>e.userId===user.id).map(e => (
                            <div key={e.id} className="p-4 bg-white/5 rounded-xl border border-white/5 mb-3 flex justify-between items-center"><span className="font-mono text-sky-400 font-black">{e.ticketNumber}</span><span className="text-[10px] text-slate-500">{e.enteredAt}</span></div>
                         ))}
                         {raffleEntries.filter(e=>e.userId===user.id).length === 0 && <p className="opacity-20 italic">{t('no_raffle_entries')}</p>}
                      </div>
                      <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 text-right">
                         <h3 className="text-2xl font-black mb-6 text-emerald-400">{t('latest_winners')}</h3>
                         {raffleWinners.slice(0, 5).map(w => (
                            <div key={w.id} className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 mb-3 flex justify-between"><span className="font-black">@{w.username}</span><span>{w.prizeTitle}</span></div>
                         ))}
                         {raffleWinners.length === 0 && <p className="opacity-20 italic">{t('waiting_for_next_draw')}</p>}
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
             <div className="flex-1 p-4 md:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom duration-500 pb-40">
                <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
                   <div className="bg-indigo-900/40 p-8 md:p-16 rounded-3xl md:rounded-[4rem] border border-indigo-500/20 shadow-3xl flex flex-col lg:flex-row justify-between items-center gap-8 md:gap-12">
                      <div className="text-center lg:text-right space-y-4 md:space-y-6">
                         <h2 className="text-4xl md:text-6xl font-black tracking-tighter">{t('salary_pre_financing')}</h2>
<p className="text-lg md:text-2xl text-slate-300 font-bold">{t('salary_financing_subtitle')}</p>
<button onClick={() => setModalType('salary_apply')} className="bg-white text-indigo-900 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-2xl hover:scale-105 transition-all">{t('apply_for_financing_now')}</button>
                      </div>
                      <div className="text-6xl md:text-[10rem] animate-pulse opacity-20 hidden lg:block">🏦</div>
                   </div>
                   <div className="space-y-6 md:space-y-8">
                      <h3 className="text-2xl md:text-3xl font-black">{t('current_requests')}</h3>
                      {salaryPlans.filter(p=>p.userId===user.id).map(plan => (
                         <div key={plan.id} className="p-6 md:p-10 bg-[#0f172a]/60 border border-white/5 rounded-2xl md:rounded-[3rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div><p className="text-xl md:text-3xl font-black text-white">{t('financing_value')} ${plan.amount.toLocaleString()}</p><p className="text-xs md:text-slate-500 font-bold">{t('monthly_deduction')}: ${plan.deduction} / {t('for')} {plan.duration} {t('months')}</p></div>
                            <div className={`px-6 md:px-10 py-2 md:py-4 rounded-xl md:rounded-3xl border font-black text-[10px] md:text-sm ${plan.status==='active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : plan.status==='pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                               {plan.status==='active' ? t('approved') : plan.status==='pending' ? t('pending_review') : t('cancelled')}
                            </div>
                         </div>
                      ))}
                      {salaryPlans.filter(p=>p.userId===user.id).length === 0 && <p className="opacity-20 italic text-center py-20">{t('no_financing_requests')}</p>}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'profile' && (
             <div className="flex-1 p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-500 pb-40">
                <div className="max-w-4xl mx-auto space-y-12">
                   <h2 className="text-6xl font-black tracking-tighter">{t('profile_settings')}</h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-[#0f172a]/60 p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                         <h3 className="text-2xl font-black border-r-4 border-sky-500 pr-4">{t('account_data')}</h3>
                         <div className="space-y-4">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('full_name')}</p>
                               <p className="text-xl font-bold">{user.fullName}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('email')}</p>
                               <p className="text-xl font-bold">{user.email}</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('phone_number')}</p>
                               <p className="text-xl font-bold" dir="ltr">{user.phoneNumber || '—'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-[#0f172a]/60 p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                         <h3 className="text-2xl font-black border-r-4 border-emerald-500 pr-4">{t('linked_cards')}</h3>
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
                            <button onClick={() => setModalType('add_card')} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-sky-500/40 hover:text-sky-400 transition-all">+ {t('add_new_card')}</button>
                         </div>
                      </div>
                   </div>

                   <form onSubmit={handleUpdatePassword} className="bg-[#0f172a]/60 p-12 rounded-[4rem] border border-white/5 shadow-2xl space-y-10">
                      <h3 className="text-3xl font-black border-r-8 border-sky-500 pr-8">{t('change_password')}</h3>
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">{t('current_password')}</label>
                            <input type="password" required value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" />
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">{t('new_password')}</label>
                               <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">{t('confirm_new_password')}</label>
                               <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 transition-all" />
                            </div>
                         </div>
                      </div>
                      {passwordError && <p className="text-red-500 font-black text-xs">{passwordError}</p>}
                      {passwordSuccess && <p className="text-emerald-500 font-black text-xs">{t('password_updated_success')} ✅</p>}
                      <button type="submit" className="w-full py-8 bg-sky-600 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">{t('update_security')}</button>
                   </form>
                </div>
             </div>
          )}

          {activeTab === 'ads' && (
            <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar pb-40">
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
            </div>
          )}
       </main>

       {/* MODALS */}
       
       {/* Modal: Withdraw Warning */}
       {modalType === 'withdraw_warning' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <div className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-3xl md:rounded-[4rem] p-8 md:p-16 space-y-8 animate-in zoom-in text-center shadow-3xl">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                   <span className="text-4xl md:text-5xl">⚠️</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white">{t('cannot_complete_operation')}</h3>
<p className="text-slate-400 font-bold text-base md:text-lg">{t('add_card_first')}</p>
                
                <div className="space-y-4 pt-4">
                   <button 
                      onClick={() => setModalType('add_card')} 
                      className="w-full py-4 md:py-5 bg-sky-600 rounded-2xl font-black text-lg md:text-xl shadow-xl hover:bg-sky-500 transition-all active:scale-95 flex items-center justify-center gap-3"
                   >
                      <span>{t('add_new_card')}</span>
                      <span className="text-xl md:text-2xl">💳</span>
                   </button>
                   <button 
                      onClick={() => setModalType(null)} 
                      className="w-full py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-lg md:text-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                   >
                      {t('cancel_operation')}
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* Modal: Withdraw Swift */}
       {modalType === 'withdraw' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleWithdrawSwift} className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-3xl md:rounded-[5rem] p-8 md:p-16 space-y-6 md:space-y-8 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-2xl md:text-4xl font-black text-white">{t('swift_withdrawal_request')}</h3>
                <div className="space-y-4 text-right">
                   <input required value={withdrawData.bankName} onChange={e=>setWithdrawData({...withdrawData, bankName: e.target.value})} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white outline-none focus:border-sky-500 text-sm md:text-base" placeholder={t('bank_name')} />
                   <input required value={withdrawData.iban} onChange={e=>setWithdrawData({...withdrawData, iban: e.target.value})} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono text-sm md:text-base" placeholder={t('iban')} />
                   <input required value={withdrawData.swift} onChange={e=>setWithdrawData({...withdrawData, swift: e.target.value})} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono uppercase text-sm md:text-base" placeholder={t('swift_code')} />
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 pr-4 uppercase">{t('amount_usd')}</label>
                      <input required type="number" value={withdrawData.amount} onChange={e=>setWithdrawData({...withdrawData, amount: e.target.value})} className="w-full p-6 md:p-8 bg-black/40 border border-white/10 rounded-2xl md:rounded-[2rem] font-black text-3xl md:text-5xl text-center text-sky-400 outline-none" placeholder="0.00" />
                   </div>
                </div>
                <button type="submit" className="w-full py-5 md:py-8 bg-sky-600 rounded-2xl md:rounded-[3rem] font-black text-xl md:text-2xl shadow-xl hover:bg-sky-500 transition-all">{t('submit_withdrawal_request')} 🏦</button>
<button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4 text-sm md:text-base">{t('cancel')}</button>
             </form>
          </div>
       )}

       {/* Modal: Salary Apply */}
       {modalType === 'salary_apply' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleApplySalary} className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-3xl md:rounded-[5rem] p-8 md:p-16 space-y-8 md:space-y-10 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-2xl md:text-4xl font-black text-white">{t('salary_pre_financing_request')}</h3>
                <div className="space-y-6 text-right">
                   <div className="space-y-2"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">{t('requested_amount')}</label><input type="number" required value={salaryForm.amount} onChange={e=>setSalaryForm({...salaryForm, amount: parseInt(e.target.value)})} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white text-2xl md:text-3xl text-center outline-none focus:border-indigo-500" /></div>
                   <div className="space-y-2"><label className="text-[10px] text-slate-500 font-black pr-4 uppercase">{t('repayment_duration_months')}</label><input type="number" required value={salaryForm.duration} onChange={e=>setSalaryForm({...salaryForm, duration: parseInt(e.target.value)})} className="w-full p-4 md:p-5 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl font-black text-white text-xl md:text-2xl text-center outline-none focus:border-indigo-500" /></div>
                </div>
                <button type="submit" className="w-full py-5 md:py-8 bg-indigo-600 rounded-2xl md:rounded-[3rem] font-black text-xl md:text-2xl shadow-xl hover:bg-indigo-500 transition-all">{t('submit_request_for_review')} ⚡</button>
<button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4 text-sm md:text-base">{t('cancel')}</button>
             </form>
          </div>
       )}

       {/* Modal: Investment Form */}
       {modalType === 'invest_form' && selectedPlan && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <form onSubmit={handleInvestSubmit} className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-3xl md:rounded-[5rem] p-8 md:p-16 space-y-8 md:space-y-12 animate-in zoom-in text-center shadow-3xl">
                <h3 className="text-2xl md:text-4xl font-black text-sky-400">{t(selectedPlan.name)}</h3>
                <div className="space-y-6 md:space-y-8 text-right">
                   <div className="space-y-3"><label className="text-[10px] md:text-xs font-black text-slate-500 mr-4 md:mr-8 uppercase">{t('amount_to_invest')}</label><input type="number" required min={selectedPlan.minAmount} value={investAmount || ''} onChange={e=>setInvestAmount(parseFloat(e.target.value))} className="w-full p-6 md:p-8 bg-black/40 border border-white/10 rounded-2xl md:rounded-[2.5rem] font-black text-center text-3xl md:text-5xl text-white outline-none font-mono" /></div>
                   <div className="p-6 md:p-8 bg-sky-500/10 rounded-2xl md:rounded-3xl border border-sky-500/20"><p className="text-slate-500 font-black text-[10px] md:text-xs uppercase mb-2">{t('expected_return_after')} {selectedPlan.durationMonths} {t('months')}</p><p className="text-xl md:text-3xl font-black text-emerald-400 font-mono">+${((investAmount || 0) * (selectedPlan.rate/100) * (selectedPlan.durationMonths/12)).toFixed(2)}</p></div>
                </div>
                <button type="submit" className="w-full py-6 md:py-10 bg-sky-600 rounded-2xl md:rounded-[4rem] font-black text-xl md:text-3xl shadow-3xl hover:bg-sky-500 transition-all">{t('confirm_start_investment')} 🚀</button>
<button type="button" onClick={()=>setModalType(null)} className="text-slate-500 font-bold hover:text-white mt-4 text-sm md:text-base">{t('cancel')}</button>
             </form>
          </div>
       )}

       {/* Modal: Transfer */}
       {modalType === 'transfer' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <div className="bg-[#0f172a] border border-white/10 w-full max-w-3xl rounded-3xl md:rounded-[6rem] p-8 md:p-16 lg:p-24 overflow-hidden shadow-3xl text-center relative">
                <button onClick={()=>setModalType(null)} className={`absolute top-8 md:top-12 right-8 md:right-12 text-slate-500 hover:text-white text-2xl md:text-3xl transition-all ${isTransferring ? 'hidden' : ''}`}>✕</button>
                {!isTransferring ? (
                   <form onSubmit={handleStartTransfer} className="space-y-8 md:space-y-12 animate-in zoom-in duration-500">
                      <div className="space-y-6 md:space-y-8 text-right">
                         <div className="space-y-3"><label className="text-[10px] md:text-xs font-black text-slate-500 mr-4 md:mr-8 uppercase">{t('recipient_username')}</label><input required value={transferData.recipient} onChange={e=>setTransferData({...transferData, recipient: e.target.value})} className="w-full p-5 md:p-8 bg-black/40 border border-white/10 rounded-2xl md:rounded-[2.5rem] font-black text-center text-2xl md:text-4xl text-white outline-none focus:border-sky-500" placeholder="@username" /></div>
                         <div className="space-y-3"><label className="text-[10px] md:text-xs font-black text-slate-500 mr-4 md:mr-8 uppercase">{t('amount_to_transfer')}</label><input required type="number" value={transferData.amount} onChange={e=>setTransferData({...transferData, amount: e.target.value})} className="w-full p-6 md:p-10 bg-black/40 border border-white/10 rounded-3xl md:rounded-[3rem] font-black text-center text-4xl sm:text-6xl md:text-[5rem] text-sky-400 outline-none font-mono" placeholder="0.00" /></div>
                      </div>
                      <button type="submit" className="w-full py-6 md:py-10 bg-sky-600 rounded-2xl md:rounded-[3.5rem] font-black text-xl md:text-3xl shadow-3xl hover:bg-sky-500 transition-all active:scale-95">{t('confirm_transfer')}</button>
                   </form>
                ) : (
                   <div className="space-y-16 py-12">
                      {transferSuccess ? (
                         <div className="space-y-10 animate-in zoom-in duration-700"><div className="w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center text-[10rem] mx-auto shadow-3xl border-4 border-emerald-400 animate-pulse">✓</div><h3 className="text-6xl font-black text-white tracking-tighter">{t('transfer_successful')}</h3></div>
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
             <form onSubmit={handleRedeemCoupon} className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-3xl md:rounded-[5rem] p-8 md:p-16 lg:p-24 space-y-8 md:space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
                <button type="button" onClick={()=>setModalType(null)} className="absolute top-8 md:top-12 right-8 md:right-12 text-slate-500 hover:text-white text-2xl md:text-3xl">✕</button>
                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{t('redeem_coupon_balance')}</h3>
                <div className="space-y-4">
                   <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('enter_12_digit_code')}</label>
                   <input required value={couponCode} onChange={e=>setCouponCode(e.target.value)} className="w-full p-5 md:p-8 bg-black/40 border border-white/10 rounded-xl md:rounded-[2.5rem] font-black text-center text-2xl md:text-4xl text-sky-400 outline-none font-mono tracking-widest uppercase focus:border-sky-500" placeholder="FP-XXXX-XXXX" />
                </div>
                <button type="submit" className="w-full py-6 md:py-10 bg-emerald-600 rounded-2xl md:rounded-[4rem] font-black text-xl md:text-3xl shadow-3xl hover:bg-emerald-500 transition-all active:scale-95">{t('activate_recharge_instantly')}</button>
             </form>
          </div>
       )}

        {modalType === 'add_card' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
             <div className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-3xl md:rounded-[4rem] p-8 md:p-16 space-y-8 animate-in zoom-in text-center shadow-3xl relative overflow-hidden">
                <button onClick={()=>setModalType(null)} className={`absolute top-8 md:top-12 right-8 md:right-12 text-slate-500 hover:text-white text-2xl md:text-3xl transition-all ${isLinkingCard ? 'hidden' : ''}`}>✕</button>
                
                {!isLinkingCard ? (
                   <form onSubmit={handleStartLinking} className="space-y-8">
                      <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter">{t('link_global_bank_card')}</h3>
                      <div className="space-y-4 text-right">
                         <div className="relative">
                            <input 
                               required 
                               value={cardData.holder} 
                               onChange={e=>setCardData({...cardData, holder: e.target.value})} 
                               className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 text-base" 
                               placeholder={t('card_holder_name')} 
                            />
                         </div>
                         <div className="relative">
                            <input 
                               required 
                               value={cardData.number} 
                               onChange={e=>{
                                  const val = e.target.value;
                                  setCardData({...cardData, number: val});
                                  setCardType(detectCardType(val));
                               }} 
                               className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono text-lg" 
                               placeholder={t('card_number_16_digits')} 
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                               {cardType === 'visa' && <span className="text-2xl">💳 <span className="text-sm font-bold text-sky-400">VISA</span></span>}
                               {cardType === 'mastercard' && <span className="text-2xl">💳 <span className="text-sm font-bold text-orange-400">Mastercard</span></span>}
                               {cardType === 'unknown' && <span className="text-2xl opacity-20">💳</span>}
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <input 
                               required 
                               value={cardData.expiry} 
                               onChange={e=>setCardData({...cardData, expiry: e.target.value})} 
                               className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono text-base" 
                               placeholder="MM/YY" 
                            />
                            <input 
                               required 
                               value={cardData.cvc} 
                               onChange={e=>setCardData({...cardData, cvc: e.target.value})} 
                               className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500 font-mono text-base" 
                               placeholder="CVC" 
                            />
                         </div>
                      </div>
                      <button type="submit" className="w-full py-6 bg-sky-600 rounded-3xl font-black text-xl shadow-2xl hover:bg-sky-500 transition-all active:scale-95">{t('confirm_encrypted_link')}</button>
                   </form>
                ) : (
                   <div className="space-y-12 py-8">
                      {linkingSuccess ? (
                         <div className="space-y-8 animate-in zoom-in duration-700">
                            <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center text-6xl mx-auto shadow-3xl border-4 border-emerald-400 animate-bounce">✓</div>
                            <div className="space-y-2">
                               <h3 className="text-4xl font-black text-white tracking-tighter">{t('card_linked_successfully')}</h3>
<p className="text-emerald-400 font-bold text-xl">{t('swift_withdrawal_activated')}</p>
                            </div>
                         </div>
                      ) : (
                         <div className="space-y-12">
                            <div className="relative w-full h-4 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                               <div 
                                  className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all duration-300" 
                                  style={{ width: `${linkingProgress}%` }}
                               ></div>
                            </div>
                            <div className="space-y-4">
                               <p className="text-2xl font-black text-sky-400 animate-pulse h-20 leading-relaxed px-6">
                                  {cardLinkingPhrases[linkingStep]}
                               </p>
                               <div className="flex justify-center gap-2">
                                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce delay-0"></div>
                                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce delay-150"></div>
                                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce delay-300"></div>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                )}
             </div>
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
