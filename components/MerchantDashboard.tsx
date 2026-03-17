
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BadgeCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { User, SiteConfig, RechargeCard, Transaction, Notification, APIKey, VerificationRequest, AdExchangeItem, AdNegotiation } from '../types';
import { useI18n } from '../i18n/i18n';
import MerchantDealCreator from './MerchantDealCreator';
import { MerchantVerification } from './VerificationManager';
import { AdExchange } from './AdExchange';
import DistributorGatewayManager from './merchant/DistributorGatewayManager';
import UnderDevelopment from './UnderDevelopment';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from '../src/components/Logo';
import LogoGenerator from '../src/components/LogoGenerator';

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
  verificationRequests: VerificationRequest[];
  setVerificationRequests: React.Dispatch<React.SetStateAction<VerificationRequest[]>>;
  adExchangeItems: AdExchangeItem[];
  setAdExchangeItems: React.Dispatch<React.SetStateAction<AdExchangeItem[]>>;
  adNegotiations: AdNegotiation[];
  setAdNegotiations: React.Dispatch<React.SetStateAction<AdNegotiation[]>>;
  addNotification: (title: string, message: string, type: Notification['type'], targetUserId?: string) => void;
  onUpdateUser: (updatedUser: User) => void;
}

const MerchantDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  transactions, setTransactions, verificationRequests, setVerificationRequests,
  adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations,
  addNotification, onUpdateUser
}) => {
  const { t, language } = useI18n();
  const [activeView, setActiveView] = useState<'main' | 'settings' | 'gateway' | 'usdt_gateway' | 'verification' | 'ads'>('main');
  const [modalType, setModalType] = useState<'send' | 'cards' | 'new_key' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // States for Transfer Animation
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferStep, setTransferStep] = useState(0);
  const [transferSuccess, setTransferSuccess] = useState(false);
  
  // Balance Watcher (to detect Admin recharge)
  const prevBalanceRef = useRef(user.balance);

  useEffect(() => {
    if (user.balance > prevBalanceRef.current) {
      const diff = user.balance - prevBalanceRef.current;
      addNotification(t('account_recharged_notif'), t('admin_recharge_msg').replace('${amount}', diff.toLocaleString()), 'money');
    }
    prevBalanceRef.current = user.balance;
  }, [user.balance, addNotification]);

  const [cardAmount, setCardAmount] = useState<number>(100);
  const [cardQuantity, setCardQuantity] = useState<number>(5);
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [isKeyVisibleId, setIsKeyVisibleId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'nodejs' | 'python' | 'php'>('nodejs');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const isServiceDisabled = (serviceId: string) => {
    return siteConfig.disabledServices?.includes(serviceId);
  };

  const bankingPhrases = [
    t('banking_phrase_1'),
    t('banking_phrase_2'),
    t('banking_phrase_3'),
    t('banking_phrase_4'),
    t('banking_phrase_5'),
    t('banking_phrase_6'),
    t('banking_phrase_7'),
    t('banking_phrase_8')
  ];

  const currencies = [
    { pair: 'USD/EUR', rate: '0.92', trend: '+0.02%', color: 'text-emerald-400' },
    { pair: 'USD/SAR', rate: '3.75', trend: '0.00%', color: 'text-sky-400' },
    { pair: 'USD/TRY', rate: '31.20', trend: '+0.15%', color: 'text-red-400' },
    { pair: 'USD/AED', rate: '3.67', trend: '0.00%', color: 'text-sky-400' },
    { pair: 'BTC/USD', rate: '92,450', trend: '+2.4%', color: 'text-amber-400' }
  ];

  const handleGenerateCards = () => {
    const totalCost = cardAmount * cardQuantity;
    if (totalCost > user.balance) return alert(t('insufficient_balance_distributor'));
    
    const newCards: RechargeCard[] = [];
    const now = new Date();
    const ts = now.toISOString();

    for (let i = 0; i < cardQuantity; i++) {
      newCards.push({
        code: `FP-M-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        amount: cardAmount, 
        isUsed: false, 
        generatedBy: user.id, 
        createdAt: ts
      });
    }

    setRechargeCards(prev => [...newCards, ...prev]);
    const updatedUser = { ...user, balance: user.balance - totalCost };
    onUpdateUser(updatedUser);
    
    setTransactions(prev => [{ 
      id: uuidv4(), 
      userId: user.id, 
      type: 'generate_card', 
      amount: -totalCost, 
      timestamp: ts, 
      relatedUser: t('generated_cards_count').replace('${count}', cardQuantity.toString()) 
    }, ...prev]);
    
    addNotification(t('card_generation'), t('card_generation_notif').replace('${count}', cardQuantity.toString()).replace('${amount}', totalCost.toLocaleString()), 'money');
    setModalType(null);
  };

  const handleStartTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(sendAmount);
    const target = accounts.find(acc => acc.username === recipient && acc.id !== user.id);
    
    if (!target) return alert(t('recipient_not_found'));
    if (value > user.balance || isNaN(value) || value <= 0) return alert(t('insufficient_balance_invalid'));

    setIsTransferring(true);
    setTransferProgress(0);
    setTransferStep(0);
    setTransferSuccess(false);
  };

  useEffect(() => {
    let timer: any;
    let stepTimer: any;

    if (isTransferring && !transferSuccess) {
      const duration = 20000; // 20 Seconds
      const interval = 100;
      const steps = duration / interval;
      const increment = 100 / steps;

      timer = setInterval(() => {
        setTransferProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            finalizeTransfer();
            return 100;
          }
          return prev + increment;
        });
      }, interval);

      stepTimer = setInterval(() => {
        setTransferStep(prev => (prev + 1) % bankingPhrases.length);
      }, 2500);
    }

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [isTransferring, transferSuccess]);

  const finalizeTransfer = () => {
    const value = parseFloat(sendAmount);
    const target = accounts.find(acc => acc.username === recipient && acc.id !== user.id);
    
    if (target) {
      const ts = new Date().toISOString();

      setAccounts(prev => prev.map(acc => {
        if (acc.id === user.id) return { ...acc, balance: acc.balance - value };
        if (acc.id === target.id) return { ...acc, balance: acc.balance + value };
        return acc;
      }));

      onUpdateUser({ ...user, balance: user.balance - value });

      setTransactions(prev => [{ 
        id: uuidv4(), 
        userId: user.id, 
        type: 'send', 
        amount: -value, 
        relatedUser: target.fullName, 
        timestamp: ts 
      }, ...prev]);

      addNotification(t('transfer_successful_notif'), t('transfer_successful_msg').replace('${amount}', `$${value}`).replace('${name}', target.fullName), 'money');
      setTransferSuccess(true);
      
      setTimeout(() => {
        setIsTransferring(false);
        setModalType(null);
        setSendAmount('');
        setRecipient('');
      }, 3000);
    }
  };

  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) return alert(t('enter_key_name'));
    const newKey: APIKey = {
      id: uuidv4(),
      key: `pk_live_${uuidv4().replace(/-/g, '')}`,
      name: newKeyName,
      createdAt: new Date().toISOString(),
      status: 'active',
      requests: 0
    };
    onUpdateUser({ ...user, apiKeys: [...(user.apiKeys || []), newKey] });
    setModalType(null);
    setNewKeyName('');
    addNotification(t('api_security'), t('new_key_generated').replace('${name}', newKeyName), 'security');
  };

  const handleRevokeKey = (id: string) => {
    if (!confirm(t('revoke_key_confirm'))) return;
    const updatedKeys = (user.apiKeys || []).map(k => k.id === id ? { ...k, status: 'revoked' as const } : k);
    onUpdateUser({ ...user, apiKeys: updatedKeys });
    addNotification(t('api_security'), t('key_revoked'), 'security');
  };

  const handleCancelCard = (card: RechargeCard) => {
    if (!card || card.isUsed) {
      alert(t('card_cancel_error'));
      return;
    }
    
    if (!confirm(t('card_cancel_confirm').replace('${code}', card.code).replace('${amount}', `$${card.amount}`))) return;

    const refundAmount = card.amount;
    const cardCode = card.code;
    const ts = new Date().toISOString();

    // 1. Remove the card from the global list
    setRechargeCards(prev => prev.filter(c => c.code !== cardCode));

    // 2. Update the distributor's balance
    const updatedUser = { ...user, balance: user.balance + refundAmount };
    onUpdateUser(updatedUser);

    // 3. Record the transaction
    setTransactions(prev => [{
      id: uuidv4(),
      userId: user.id,
      type: 'receive',
      amount: refundAmount,
      timestamp: ts,
      relatedUser: t('card_cancellation_ref').replace('${code}', cardCode)
    }, ...prev]);

    addNotification(t('card_cancelled'), t('card_cancelled_msg').replace('${amount}', `$${refundAmount}`), 'money');
  };

  const handleChangePassword = (e: React.FormEvent) => {
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
      setPasswordError(t('passwords_do_not_match'));
      return;
    }

    onUpdateUser({ ...user, password: newPassword });
    setPasswordSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addNotification(t('account_security'), t('password_updated_success'), 'security');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const myGeneratedCards = useMemo(() => {
    const cards = rechargeCards.filter(c => c.generatedBy === user.id);
    if (!searchTerm) return cards;
    return cards.filter(c => 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.usedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rechargeCards, user.id, searchTerm]);

  const activeKeyForSnippet = user.apiKeys?.find(k => k.status === 'active')?.key || 'pk_live_YOUR_KEY_HERE';

  const snippets = {
    nodejs: `const FastPay = require('@fastpay/node-sdk');
const client = new FastPay.Client('${activeKeyForSnippet}');

client.payments.create({
  amount: 49.99,
  currency: 'USD',
  description: 'Order #1042'
}).then(payment => {
  console.log('Payment URL:', payment.checkout_url);
});`,
    python: `import fastpay
client = fastpay.Client(api_key='${activeKeyForSnippet}')

payment = client.payments.create(
    amount=49.99,
    currency='USD',
    description='Order #1042'
)
print(f"Checkout at: {payment.checkout_url}")`,
    php: `$fastpay = new \\FastPay\\Client('${activeKeyForSnippet}');

$payment = $fastpay->payments->create([
  'amount' => 49.99,
  'currency' => 'USD',
  'description' => 'Order #1042'
]);

header('Location: ' . $payment->checkout_url);`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t('copied_to_clipboard'));
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#0a0a0a] text-white font-sans overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>

      {/* Currency Ticker */}
      <div className="h-12 bg-black/40 backdrop-blur-md border-b border-white/5 overflow-hidden flex items-center z-20">
         <div className="flex animate-marquee whitespace-nowrap gap-12 px-6">
            {Array(3).fill(currencies).flat().map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-500 uppercase">{c.pair}</span>
                 <span className="text-sm font-black text-white">{c.rate}</span>
                 <span className={`text-[10px] font-bold ${c.color}`}>{c.trend}</span>
              </div>
            ))}
         </div>
      </div>

      <header className="h-20 md:h-28 bg-[#161a1e]/50 backdrop-blur-2xl border-b border-white/5 px-4 md:px-12 flex justify-between items-center z-[200]">
         <div className="flex items-center gap-4 md:gap-8">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-white text-2xl p-2">
               {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            {siteConfig.logoUrl && (
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveView('main')}>
                 <Logo siteConfig={siteConfig} className="h-6 md:h-10" />
              </div>
            )}
            <div className="space-y-1 hidden md:block">
               <h1 className="text-xl md:text-2xl font-black tracking-tighter">{t('merchant_dashboard')}</h1>
               <nav className="flex gap-4 md:gap-6">
                  {[
                    { id: 'main', l: t('home') },
                    { id: 'usdt_gateway', l: t('usdt_gateway_status') },
                    { id: 'gateway', l: t('developer_portal_title') },
                    { id: 'ads', l: t('ad_exchange') },
                    { id: 'verification', l: t('account_verification') },
                    { id: 'settings', l: t('account_settings') }
                 ].map((view) => (
                   <button 
                     key={view.id}
                     onClick={() => setActiveView(view.id as any)} 
                     className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all pb-1 border-b-2 ${activeView === view.id ? 'text-sky-400 border-sky-400' : 'text-slate-500 border-transparent hover:text-white'}`}
                   >
                     {view.l}
                   </button>
                 ))}
               </nav>
            </div>
         </div>
         <div className="flex items-center gap-3 md:gap-6">
            <div className="text-left hidden lg:block border-l border-white/10 pl-6 mr-6">
               <p className="font-black text-white text-lg flex items-center gap-2">
                 {user.fullName}
                 {user.isVerified && <BadgeCheck className="w-5 h-5 fill-[#1877F2] text-white" />}
               </p>
               <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{t('distributor_level')}</p>
            </div>
            <button onClick={onLogout} className="px-4 md:px-8 py-2 md:py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl md:rounded-2xl font-black text-xs md:text-base hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-lg">{t('logout')}</button>
         </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-20 right-0 w-64 h-full bg-[#0f172a] border-l border-white/5 p-6 space-y-4 animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            {[
              { id: 'main', l: t('home'), i: '🏠' },
              { id: 'usdt_gateway', l: t('usdt_gateway_status'), i: '🛡️' },
              { id: 'gateway', l: t('developer_portal_title'), i: '🔌' },
              { id: 'ads', l: t('ad_exchange'), i: '📢' },
              { id: 'verification', l: t('account_verification'), i: '🛡️' },
              { id: 'settings', l: t('account_settings'), i: '⚙️' }
            ].map(v => (
              <button 
                key={v.id} 
                onClick={() => { setActiveView(v.id as any); setIsMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${activeView === v.id ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="text-2xl">{v.i}</span>
                <span className="text-base">{v.l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-12 overflow-y-auto custom-scrollbar z-10 relative space-y-8 md:space-y-12 pb-40">
         {activeView === 'main' && (
            isServiceDisabled('cards') ? <UnderDevelopment /> : (
           <div className="max-w-[1600px] mx-auto space-y-12">
               <div className="bg-[#111827] p-8 rounded-3xl border border-white/10">
                 <h3 className="text-2xl font-black mb-6">{t('logo_management')}</h3>
                 <LogoGenerator />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                  <div className="lg:col-span-2 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-3xl md:rounded-[4rem] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                     <div className="relative z-10 space-y-8 md:space-y-12">
                        <div>
                           <p className="text-sky-400 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-4">{t('available_liquidity_usdt')}</p>
                           <h2 className="text-5xl md:text-8xl font-black tracking-tighter">${user.balance.toLocaleString()}</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-6">
                           <button onClick={() => setModalType('cards')} className="flex-1 py-6 md:py-8 bg-emerald-600 text-white rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95 group">
                              <span>{t('issue_cards')}</span>
                              <span className="text-2xl md:text-3xl group-hover:rotate-12 transition-transform">🎫</span>
                           </button>
                           <button onClick={() => setModalType('send')} className="flex-1 py-6 md:py-8 bg-white/5 border border-white/10 text-white rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl backdrop-blur-xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 group">
                              <span>{t('direct_transfer')}</span>
                              <span className="text-2xl md:text-3xl group-hover:translate-x-[-10px] transition-transform">📤</span>
                           </button>
                        </div>
                     </div>
                  </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                     {[
                        { l: t('total_cards'), v: myGeneratedCards.length, i: '📦', c: 'text-white' },
                        { l: t('active_stock'), v: myGeneratedCards.filter(c=>!c.isUsed).length, i: '⚡', c: 'text-sky-400' },
                        { l: t('successful_operations'), v: myGeneratedCards.filter(c=>c.isUsed).length, i: '✅', c: 'text-emerald-500' },
                        { l: t('sales_revenue'), v: `$${myGeneratedCards.filter(c=>c.isUsed).reduce((a,b)=>a+b.amount, 0).toLocaleString()}`, i: '💰', c: 'text-amber-500' }
                     ].map((stat, idx) => (
                       <div key={idx} className="p-6 md:p-10 bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-[3rem] shadow-xl hover:border-sky-500/30 transition-all group">
                          <div className="flex justify-between items-start mb-4 md:mb-6">
                             <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{stat.i}</span>
                             <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.l}</p>
                          </div>
                          <p className={`text-3xl md:text-4xl font-black ${stat.c}`}>{stat.v}</p>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                     <h3 className="text-2xl md:text-4xl font-black tracking-tighter flex items-center gap-4">
                        <span>📊</span> {t('card_sales_log')}
                     </h3>
                     <div className="w-full md:w-96 relative">
                        <input 
                          type="text"
                          placeholder={t('search_placeholder_card_user')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full p-4 md:p-5 pl-14 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-500 transition-all shadow-inner"
                        />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
                     </div>
                  </div>

                  <div className="bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[4rem] overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                     <table className="w-full text-right min-w-[1000px]">
                        <thead className="bg-white/5 text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                           <tr>
                              <th className="p-6 md:p-10">{t('card_code')}</th>
                              <th className="p-6 md:p-10">{t('value')}</th>
                              <th className="p-6 md:p-10">{t('status')}</th>
                              <th className="p-6 md:p-10">{t('beneficiary')}</th>
                              <th className="p-6 md:p-10">{t('creation_time')}</th>
                              <th className="p-6 md:p-10">{t('usage_time')}</th>
                              <th className="p-6 md:p-10 text-center">{t('control')}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-bold">
                           {myGeneratedCards.length > 0 ? (
                             myGeneratedCards.slice().reverse().map((c) => (
                                <tr key={c.code} className="group hover:bg-white/5 transition-all">
                                   <td className="p-6 md:p-10">
                                      <div className="flex items-center gap-4">
                                         <code className="bg-black/60 px-4 md:px-6 py-2 md:py-3 rounded-xl text-sky-400 font-black tracking-[0.1em] md:tracking-[0.2em] text-xs md:text-sm border border-white/5 shadow-inner group-hover:text-white group-hover:bg-sky-600 transition-all">{c.code}</code>
                                         <button onClick={() => copyToClipboard(c.code)} className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-xs" title={t('copy_code')}>📋</button>
                                      </div>
                                   </td>
                                   <td className="p-6 md:p-10 text-2xl md:text-3xl font-black text-white">${c.amount.toLocaleString()}</td>
                                   <td className="p-6 md:p-10">
                                      <span className={`px-4 md:px-6 py-1.5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black border transition-colors ${c.isUsed ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                         {c.isUsed ? t('used') : t('available_for_sale')}
                                      </span>
                                   </td>
                                   <td className="p-6 md:p-10">
                                      {c.isUsed ? (
                                        <div className="flex flex-col gap-1">
                                          <span className="text-white text-lg md:text-xl">@{c.usedBy}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-700 italic text-sm">— {t('not_used')} —</span>
                                      )}
                                   </td>
                                   <td className="p-6 md:p-10 text-[10px] md:text-xs text-slate-500 font-mono">
                                      {new Date(c.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US')}
                                   </td>
                                   <td className="p-6 md:p-10 text-[10px] md:text-xs font-mono">
                                      {c.isUsed && c.usedAt ? <span className="text-emerald-400">{new Date(c.usedAt).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US')}</span> : <span className="text-slate-600">...</span>}
                                   </td>
                                   <td className="p-6 md:p-10 text-center">
                                      {!c.isUsed && (
                                        <button 
                                          onClick={() => handleCancelCard(c)}
                                          className="px-3 md:px-4 py-1.5 md:py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                          title={t('cancel_card_desc')}
                                        >
                                          {t('cancel')}
                                        </button>
                                      )}
                                   </td>
                                </tr>
                             ))
                           ) : (
                             <tr>
                                <td colSpan={7} className="p-20 md:p-40 text-center opacity-30">
                                   <div className="text-6xl md:text-[8rem]">📋</div>
                                   <p className="font-black text-xl md:text-2xl">{t('no_cards_yet')}</p>
                                </td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
            )
         )}

         {activeView === 'gateway' && (
            isServiceDisabled('cards') ? <UnderDevelopment /> : (
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-2">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter">{t('developer_portal_title')}</h2>
                    <p className="text-slate-500 font-bold text-base md:text-lg max-w-2xl">{t('developer_portal_desc')}</p>
                  </div>
                  <button onClick={() => setModalType('new_key')} className="w-full md:w-auto px-10 py-5 bg-sky-600 rounded-[2rem] font-black text-xl hover:bg-sky-500 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4">
                    <span>{t('generate_new_key')}</span>
                    <span className="text-2xl">+</span>
                  </button>
               </div>

               <div className="bg-[#111827] border border-white/5 rounded-2xl md:rounded-[4rem] shadow-2xl overflow-hidden">
                  <div className="p-6 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                     <h3 className="text-xl md:text-2xl font-black text-white">{t('access_key_management')}</h3>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-right min-w-[1000px]">
                        <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                           <tr>
                              <th className="p-6 md:p-8">{t('name')}</th>
                              <th className="p-6 md:p-8">{t('api_key')}</th>
                              <th className="p-6 md:p-8">{t('requests')}</th>
                              <th className="p-6 md:p-8">{t('issue_date')}</th>
                              <th className="p-6 md:p-8 text-center">{t('status')}</th>
                              <th className="p-6 md:p-8 text-center">{t('control')}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-bold">
                           {(user.apiKeys || []).length > 0 ? (
                             user.apiKeys?.map((k) => (
                               <tr key={k.id} className="hover:bg-white/5 transition-all">
                                  <td className="p-6 md:p-8">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-sky-600/20 rounded-xl flex items-center justify-center text-sky-400">🔑</div>
                                        <span className="text-white text-lg">{k.name}</span>
                                     </div>
                                  </td>
                                  <td className="p-6 md:p-8">
                                     <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 w-max">
                                        <code className="text-sky-300 font-mono text-xs tracking-widest">{isKeyVisibleId === k.id ? k.key : '••••••••••••••••••••••••'}</code>
                                        <button onClick={() => setIsKeyVisibleId(isKeyVisibleId === k.id ? null : k.id)} className="text-[10px] font-black text-slate-500 hover:text-white">{isKeyVisibleId === k.id ? t('hide') : t('show')}</button>
                                        <button onClick={() => copyToClipboard(k.key)} className="text-[10px] font-black text-sky-500">{t('copy')}</button>
                                     </div>
                                  </td>
                                  <td className="p-6 md:p-8 text-white font-mono">{k.requests}</td>
                                  <td className="p-6 md:p-8 text-xs text-slate-500 font-mono">{k.createdAt}</td>
                                  <td className="p-6 md:p-8 text-center">
                                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {k.status === 'active' ? t('active') : t('revoked')}
                                     </span>
                                  </td>
                                  <td className="p-6 md:p-8 text-center">
                                     {k.status === 'active' && (
                                       <button onClick={() => handleRevokeKey(k.id)} className="text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all font-black text-xs">{t('revoke')}</button>
                                     )}
                                  </td>
                               </tr>
                             ))
                           ) : (
                             <tr>
                               <td colSpan={6} className="p-20 text-center italic text-slate-600">{t('no_api_keys')}</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                  <div className="lg:col-span-2">
                     <div className="bg-[#111827] p-6 md:p-12 border border-white/5 rounded-2xl md:rounded-[4rem] shadow-2xl space-y-10">
                        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-white/5 pb-8 gap-4">
                           <h3 className="text-2xl md:text-3xl font-black text-emerald-400">{t('integration_doc')}</h3>
                           <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
                              {(['nodejs', 'python', 'php'] as const).map(l => (
                                 <button key={l} onClick={() => setActiveLang(l)} className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${activeLang === l ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{l}</button>
                              ))}
                           </div>
                        </div>
                        <div className="relative">
                           <pre className="p-6 md:p-12 bg-black/60 border border-white/5 rounded-2xl md:rounded-[3rem] overflow-x-auto text-left font-mono text-xs md:text-sm leading-loose text-emerald-400 custom-scrollbar" dir="ltr">
                              {snippets[activeLang]}
                           </pre>
                        </div>
                     </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#020617] to-slate-900 p-8 md:p-12 border border-white/10 rounded-2xl md:rounded-[4rem] shadow-2xl flex flex-col items-center justify-center text-center gap-8">
                     <div className="w-20 md:w-24 h-20 md:h-24 bg-sky-600/10 rounded-full flex items-center justify-center text-4xl md:text-5xl">🛠️</div>
                     <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest">{t('payment_simulator')}</h3>
                     <p className="text-slate-400 font-bold text-sm md:text-base">{t('payment_simulator_desc')}</p>
                     <div className="p-6 bg-[#020617] rounded-3xl border border-white/10 w-full flex flex-col gap-4 animate-pulse">
                        {siteConfig.logoUrl && <Logo siteConfig={siteConfig} className="h-6 opacity-50" />}
                        <div className="h-8 bg-white/5 rounded-lg"></div>
                        <div className="h-10 bg-sky-600/50 rounded-lg"></div>
                     </div>
                  </div>
               </div>
            </div>
            )
         )}

         {activeView === 'usdt_gateway' && (
            <DistributorGatewayManager 
              user={user} 
              addNotification={addNotification} 
            />
         )}

         {activeView === 'verification' && (
            isServiceDisabled('verification') ? <UnderDevelopment /> : (
           <MerchantVerification 
             user={user} 
             onUpdateUser={onUpdateUser} 
             verificationRequests={verificationRequests} 
             setVerificationRequests={setVerificationRequests} 
             addNotification={addNotification} 
           />
           )
         )}

         {activeView === 'ads' && (
            isServiceDisabled('ads') ? <UnderDevelopment /> : (
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
           )
         )}

         {activeView === 'settings' && (
           <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500 space-y-8 md:space-y-12">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">{t('merchant_settings_title')}</h2>
              
              <div className="bg-[#0f172a]/60 backdrop-blur-3xl p-8 md:p-12 border border-white/5 rounded-2xl md:rounded-[4rem] shadow-2xl space-y-8 md:space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('full_name')}</p>
                       <p className="text-xl md:text-2xl font-black text-white">{user.fullName}</p>
                    </div>
                    <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('email_address')}</p>
                       <p className="text-xl md:text-2xl font-black text-white">{user.email}</p>
                    </div>
                    <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('phone_number')}</p>
                       <p className="text-xl md:text-2xl font-black text-white" dir="ltr">{user.phoneNumber || t('not_set')}</p>
                    </div>
                    <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('distributor_id')}</p>
                       <p className="text-lg md:text-xl font-mono text-sky-400">{t('id_label')} {user.id.toUpperCase()}</p>
                    </div>
                 </div>

                 <form onSubmit={handleChangePassword} className="space-y-8 md:space-y-10 pt-10 border-t border-white/10">
                    <h3 className="text-2xl md:text-3xl font-black border-r-8 border-sky-500 pr-8">{t('account_security_title')}</h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">{t('current_password')}</label>
                          <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-5 md:p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">{t('new_password')}</label>
                             <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-5 md:p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">{t('confirm_password')}</label>
                             <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-5 md:p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                          </div>
                       </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-sky-600 rounded-2xl font-black text-xl hover:bg-sky-500 transition-all">{t('update_password')}</button>
                    {passwordSuccess && <p className="text-emerald-400 font-bold text-center">{t('password_update_success')}</p>}
                    {passwordError && <p className="text-red-400 font-bold text-center">{passwordError}</p>}
                 </form>
              </div>
           </div>
         )}
      </main>

      {modalType === 'send' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-3xl md:rounded-[4rem] p-8 md:p-16 space-y-8 md:space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
               <button onClick={()=>setModalType(null)} className="absolute top-8 md:top-12 right-8 md:right-12 text-slate-500 hover:text-white text-2xl md:text-3xl transition-colors">✕</button>
               
               {!isTransferring ? (
                  <form onSubmit={handleStartTransfer} className="space-y-8 md:space-y-12">
                     <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white">{t('direct_balance_transfer')}</h3>
                     <div className="space-y-6 md:space-y-8 text-left">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 ml-6 uppercase tracking-widest">{t('recipient_username')}</label>
                           <input required value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full p-5 md:p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-xl md:text-2xl text-white outline-none" placeholder={t('username_placeholder') || '@username'} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-500 ml-6 uppercase tracking-widest">{t('amount_usd')}</label>
                           <input required type="number" value={sendAmount} onChange={e=>setSendAmount(e.target.value)} className="w-full p-6 md:p-8 bg-black/40 border border-white/10 rounded-2xl font-black text-4xl md:text-5xl text-center text-sky-400 outline-none" placeholder="0.00" />
                        </div>
                     </div>
                     <button type="submit" className="w-full py-6 md:py-8 bg-sky-600 rounded-2xl md:rounded-[3rem] font-black text-xl md:text-2xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">{t('confirm_initiate_transfer')}</button>
                  </form>
               ) : (
                  <div className="space-y-12 md:space-y-16 animate-in fade-in duration-700">
                     {transferSuccess ? (
                       <div className="space-y-8 md:space-y-10 animate-in zoom-in duration-700">
                          <div className="w-32 md:w-48 h-32 md:h-48 bg-emerald-500 rounded-full flex items-center justify-center text-6xl md:text-9xl mx-auto shadow-[0_0_100px_rgba(16,185,129,0.4)] border-4 border-emerald-400">✓</div>
                          <h3 className="text-4xl md:text-7xl font-black text-white tracking-tighter">{t('transfer_successful')}</h3>
                          <p className="text-xl md:text-3xl text-emerald-400 font-black tracking-[0.2em] uppercase">{t('transaction_completed')}</p>
                          <button onClick={() => setModalType(null)} className="mt-8 px-12 py-4 bg-white/10 hover:bg-white/20 rounded-full font-black transition-all">{t('close_window')}</button>
                       </div>
                     ) : (
                       <div className="space-y-12 md:space-y-16">
                          <div className="relative mx-auto w-24 md:w-32 h-24 md:h-32 flex items-center justify-center">
                             <span className="text-6xl md:text-[8rem] animate-bounce">⏳</span>
                          </div>
                          <div className="space-y-8 md:space-y-10">
                             <div className="relative w-full h-8 md:h-10 bg-white/5 border border-white/10 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 transition-all duration-300 ease-linear shadow-[0_0_40px_rgba(14,165,233,0.5)]" 
                                  style={{ width: `${transferProgress}%` }}
                                ></div>
                             </div>
                             <div className="min-h-[80px] md:min-h-[100px] flex items-center justify-center px-6 md:px-10">
                                <p className="text-xl md:text-3xl font-black text-sky-400 animate-pulse text-center leading-relaxed">
                                   {bankingPhrases[transferStep]}
                                 </p>
                             </div>
                          </div>
                          <div className="flex justify-center gap-6 md:gap-10 text-slate-500 font-black text-[8px] md:text-[10px] uppercase tracking-[0.4em] opacity-40">
                             <span>{t('ssl_secured')}</span>
                             <span>{t('aes_256')}</span>
                             <span>{t('node_verified')}</span>
                          </div>
                       </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      )}

      {modalType === 'cards' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-3xl md:rounded-[4rem] p-8 md:p-16 space-y-8 md:space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
               <button onClick={()=>setModalType(null)} className="absolute top-8 md:top-12 right-8 md:right-12 text-slate-500 hover:text-white text-2xl md:text-3xl transition-colors">✕</button>
               <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white">{t('issue_recharge_cards')}</h3>
               <div className="space-y-6 md:space-y-8 text-right">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">{t('card_value_usd')}</label>
                     <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {[10, 50, 100, 500, 1000, 5000].map(v => (
                          <button key={v} onClick={()=>setCardAmount(v)} className={`py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl border transition-all ${cardAmount === v ? 'bg-sky-600 border-sky-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>${v}</button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">{t('required_quantity')}</label>
                     <input type="number" value={cardQuantity} onChange={e=>setCardQuantity(parseInt(e.target.value))} className="w-full p-5 md:p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none" />
                  </div>
                  <div className="p-6 md:p-8 bg-sky-600/10 border border-sky-500/20 rounded-2xl md:rounded-3xl flex justify-between items-center">
                     <span className="text-slate-400 font-bold text-sm md:text-base">{t('total_cost')}</span>
                     <span className="text-2xl md:text-4xl font-black text-sky-400">${(cardAmount * cardQuantity).toLocaleString()}</span>
                  </div>
               </div>
               <button onClick={handleGenerateCards} className="w-full py-6 md:py-8 bg-emerald-600 rounded-2xl md:rounded-[3rem] font-black text-xl md:text-2xl shadow-xl hover:bg-emerald-500 transition-all active:scale-95">{t('confirm_issue_and_deduct')}</button>
            </div>
         </div>
      )}

      {modalType === 'new_key' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-3xl md:rounded-[4rem] p-8 md:p-16 space-y-8 md:space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
               <button onClick={()=>setModalType(null)} className="absolute top-8 md:top-12 right-8 md:right-12 text-slate-500 hover:text-white text-2xl md:text-3xl transition-colors">✕</button>
               <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white">{t('generate_api_key_title')}</h3>
               <div className="space-y-6 md:space-y-8 text-right">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">{t('key_name_label')}</label>
                     <input value={newKeyName} onChange={e=>setNewKeyName(e.target.value)} className="w-full p-5 md:p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-xl md:text-2xl text-white outline-none" placeholder={t('key_name_placeholder')} />
                  </div>
                  <p className="text-slate-500 font-bold text-xs md:text-sm leading-relaxed">{t('api_key_security_notice')}</p>
               </div>
               <button onClick={handleGenerateApiKey} className="w-full py-6 md:py-8 bg-sky-600 rounded-2xl md:rounded-[3rem] font-black text-xl md:text-2xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">{t('generate_key_now')}</button>
            </div>
         </div>
      )}

      <style>{`
        .bg-mesh {
          background-image: 
            radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0, transparent 50%),
            radial-gradient(at 100% 0%, rgba(79, 70, 229, 0.15) 0, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.15) 0, transparent 50%),
            radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.15) 0, transparent 50%);
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8); }
      `}</style>
    </div>
  );
};

export default MerchantDashboard;
