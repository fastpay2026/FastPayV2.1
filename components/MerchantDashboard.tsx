
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, SiteConfig, RechargeCard, Transaction, Notification, APIKey } from '../types';

import MerchantDealCreator from './MerchantDealCreator';

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
}

const MerchantDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, accounts, setAccounts, rechargeCards, setRechargeCards, 
  transactions, setTransactions, addNotification, onUpdateUser
}) => {
  const [activeView, setActiveView] = useState<'main' | 'settings' | 'gateway' | 'deals'>('main');
  const [modalType, setModalType] = useState<'send' | 'cards' | 'new_key' | null>(null);
  
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
      addNotification('تم شحن حسابك', `قامت الإدارة بإضافة مبلغ $${diff.toLocaleString()} إلى رصيدك.`, 'money');
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

  const bankingPhrases = [
    "جاري فتح قناة اتصال مشفرة مع السجل التجاري المركزي...",
    "التحقق من كفاية السيولة في محفظة الموزع السيادية...",
    "توليد توقيع رقمي فريد للمعاملة عبر بروتوكول FastPay-Secure...",
    "فحص معايير الامتثال الدولية (KYC/AML) ومكافحة غسيل الأموال...",
    "تأمين التحويل عبر بروتوكول التشفير العسكري AES-256...",
    "إرسال بيانات التسوية النهائية إلى الخادم المصرفي الرئيسي...",
    "تحديث أرصدة الطرفين في قاعدة البيانات الموزعة عالمياً...",
    "توليد إيصال العملية وتأكيد الحوالة بنجاح..."
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
    if (totalCost > user.balance) return alert('الرصيد غير كافٍ في محفظة الموزع');
    
    const newCards: RechargeCard[] = [];
    const now = new Date();
    const ts = now.toLocaleString('ar-SA');

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
      id: Math.random().toString(36).substr(2, 9), 
      userId: user.id, 
      type: 'generate_card', 
      amount: -totalCost, 
      timestamp: ts, 
      relatedUser: `توليد ${cardQuantity} بطاقة` 
    }, ...prev]);
    
    addNotification('توليد بطاقات', `تم توليد ${cardQuantity} بطاقة بقيمة $${totalCost} بنجاح.`, 'money');
    setModalType(null);
  };

  const handleStartTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(sendAmount);
    const target = accounts.find(acc => acc.username === recipient && acc.id !== user.id);
    
    if (!target) return alert('خطأ: اسم المستخدم المستلم غير موجود في النظام');
    if (value > user.balance || isNaN(value) || value <= 0) return alert('خطأ: الرصيد غير كافٍ أو المبلغ غير صحيح');

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
      const ts = new Date().toLocaleString('ar-SA');

      setAccounts(prev => prev.map(acc => {
        if (acc.id === user.id) return { ...acc, balance: acc.balance - value };
        if (acc.id === target.id) return { ...acc, balance: acc.balance + value };
        return acc;
      }));

      onUpdateUser({ ...user, balance: user.balance - value });

      setTransactions(prev => [{ 
        id: Math.random().toString(36).substr(2, 9), 
        userId: user.id, 
        type: 'send', 
        amount: -value, 
        relatedUser: target.fullName, 
        timestamp: ts 
      }, ...prev]);

      addNotification('تحويل ناجح', `تم تحويل $${value} إلى ${target.fullName} بنجاح.`, 'money');
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
    if (!newKeyName.trim()) return alert('يرجى إدخال اسم للمفتاح');
    const newKey: APIKey = {
      id: Math.random().toString(36).substr(2, 9),
      key: `pk_live_${Math.random().toString(36).substr(2, 24)}`,
      name: newKeyName,
      createdAt: new Date().toLocaleString('ar-SA'),
      status: 'active',
      requests: 0
    };
    onUpdateUser({ ...user, apiKeys: [...(user.apiKeys || []), newKey] });
    setModalType(null);
    setNewKeyName('');
    addNotification('أمن الـ API', `تم توليد مفتاح جديد: ${newKeyName}`, 'security');
  };

  const handleRevokeKey = (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا المفتاح؟ سيتوقف الربط البرمجي المرتبط به فوراً.')) return;
    const updatedKeys = (user.apiKeys || []).map(k => k.id === id ? { ...k, status: 'revoked' as const } : k);
    onUpdateUser({ ...user, apiKeys: updatedKeys });
    addNotification('أمن الـ API', 'تم إلغاء مفتاح ربط برمجي.', 'security');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (oldPassword !== user.password) {
      setPasswordError('كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    onUpdateUser({ ...user, password: newPassword });
    setPasswordSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addNotification('أمن الحساب', 'تم تحديث كلمة المرور للموزع بنجاح.', 'security');
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
    alert('تم النسخ إلى الحافظة');
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#020617] text-white text-right font-sans overflow-hidden" dir="rtl">
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

      <header className="h-28 bg-[#0f172a]/50 backdrop-blur-2xl border-b border-white/5 px-6 md:px-12 flex justify-between items-center z-10">
         <div className="flex items-center gap-8">
            {siteConfig.logoUrl && (
              <div className="bg-white p-3 rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveView('main')}>
                 <img src={siteConfig.logoUrl} className="h-10" alt="Logo" />
              </div>
            )}
            <div className="space-y-1">
               <h1 className="text-2xl font-black tracking-tighter">بوابة الموزع</h1>
               <nav className="flex gap-6">
                 {[
                   { id: 'main', l: 'الرئيسية' },
                   { id: 'deals', l: 'منصة الصفقات (LC)' },
                   { id: 'gateway', l: 'بوابة المطورين & API' },
                   { id: 'settings', l: 'إعدادات الحساب' }
                 ].map((view) => (
                   <button 
                     key={view.id}
                     onClick={() => setActiveView(view.id as any)} 
                     className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all pb-1 border-b-2 ${activeView === view.id ? 'text-sky-400 border-sky-400' : 'text-slate-500 border-transparent hover:text-white'}`}
                   >
                     {view.l}
                   </button>
                 ))}
               </nav>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="text-left hidden lg:block border-l border-white/10 pl-6 mr-6">
               <p className="font-black text-white text-lg">{user.fullName}</p>
               <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">المستوى: موزع معتمد</p>
            </div>
            <button onClick={onLogout} className="px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg">خروج</button>
         </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar z-10 relative space-y-12 pb-40">
         {activeView === 'main' && (
           <div className="max-w-[1600px] mx-auto space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                 <div className="lg:col-span-2 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                    <div className="relative z-10 space-y-12">
                       <div>
                          <p className="text-sky-400 font-black text-xs uppercase tracking-[0.3em] mb-4">السيولة المتوفرة للموزع</p>
                          <h2 className="text-6xl md:text-8xl font-black tracking-tighter">${user.balance.toLocaleString()}</h2>
                       </div>
                       <div className="flex flex-wrap gap-6">
                          <button onClick={() => setModalType('cards')} className="flex-1 min-w-[240px] py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95 group">
                             <span>إصدار بطاقات</span>
                             <span className="text-3xl group-hover:rotate-12 transition-transform">🎫</span>
                          </button>
                          <button onClick={() => setModalType('send')} className="flex-1 min-w-[240px] py-8 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-2xl backdrop-blur-xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 group">
                             <span>تحويل مباشر</span>
                             <span className="text-3xl group-hover:translate-x-[-10px] transition-transform">📤</span>
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                       { l: 'إجمالي البطاقات', v: myGeneratedCards.length, i: '📦', c: 'text-white' },
                       { l: 'مخزون نشط', v: myGeneratedCards.filter(c=>!c.isUsed).length, i: '⚡', c: 'text-sky-400' },
                       { l: 'عمليات ناجحة', v: myGeneratedCards.filter(c=>c.isUsed).length, i: '✅', c: 'text-emerald-500' },
                       { l: 'إيرادات المبيعات', v: `$${myGeneratedCards.filter(c=>c.isUsed).reduce((a,b)=>a+b.amount, 0).toLocaleString()}`, i: '💰', c: 'text-amber-500' }
                    ].map((stat, idx) => (
                      <div key={idx} className="p-10 bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-xl hover:border-sky-500/30 transition-all group">
                         <div className="flex justify-between items-start mb-6">
                            <span className="text-4xl group-hover:scale-110 transition-transform">{stat.i}</span>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.l}</p>
                         </div>
                         <p className={`text-4xl font-black ${stat.c}`}>{stat.v}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <h3 className="text-4xl font-black tracking-tighter flex items-center gap-4">
                       <span>📊</span> سجل مبيعات البطاقات المفصل
                    </h3>
                    <div className="w-full md:w-96 relative">
                       <input 
                         type="text"
                         placeholder="بحث بكود البطاقة أو المستخدم..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full p-5 pr-14 bg-white/5 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-500 transition-all shadow-inner"
                       />
                       <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl opacity-40">🔍</span>
                    </div>
                 </div>

                 <div className="bg-[#0f172a]/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right min-w-[1200px]">
                         <thead className="bg-white/5 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                            <tr>
                               <th className="p-10">كود البطاقة الرقمي</th>
                               <th className="p-10">القيمة المالية</th>
                               <th className="p-10">الحالة التشغيلية</th>
                               <th className="p-10">المستفيد</th>
                               <th className="p-10">توقيت الإنشاء</th>
                               <th className="p-10">توقيت الاستخدام</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5 font-bold">
                            {myGeneratedCards.length > 0 ? (
                              myGeneratedCards.slice().reverse().map((c, i) => (
                                 <tr key={i} className="group hover:bg-white/5 transition-all">
                                    <td className="p-10">
                                       <div className="flex items-center gap-4">
                                          <code className="bg-black/60 px-6 py-3 rounded-xl text-sky-400 font-black tracking-[0.2em] text-sm border border-white/5 shadow-inner group-hover:text-white group-hover:bg-sky-600 transition-all">{c.code}</code>
                                          <button onClick={() => copyToClipboard(c.code)} className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-xs" title="نسخ الكود">📋</button>
                                       </div>
                                    </td>
                                    <td className="p-10 text-3xl font-black text-white">${c.amount.toLocaleString()}</td>
                                    <td className="p-10">
                                       <span className={`px-6 py-2.5 rounded-full text-[10px] font-black border transition-colors ${c.isUsed ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                          {c.isUsed ? 'تم الاستخدام' : 'متاحة للبيع'}
                                       </span>
                                    </td>
                                    <td className="p-10">
                                       {c.isUsed ? (
                                         <div className="flex flex-col gap-1">
                                           <span className="text-white text-xl">@{c.usedBy}</span>
                                         </div>
                                       ) : (
                                         <span className="text-slate-700 italic">— لم تستخدم —</span>
                                       )}
                                    </td>
                                    <td className="p-10 text-xs text-slate-500 font-mono">
                                       {c.createdAt}
                                    </td>
                                    <td className="p-10 text-xs font-mono">
                                       {c.isUsed ? <span className="text-emerald-400">{c.usedAt}</span> : <span className="text-slate-600">...</span>}
                                    </td>
                                 </tr>
                              ))
                            ) : (
                              <tr>
                                 <td colSpan={6} className="p-40 text-center opacity-30">
                                    <div className="text-[8rem]">📋</div>
                                    <p className="font-black text-2xl">لا توجد بطاقات حتى الآن</p>
                                 </td>
                              </tr>
                            )}
                         </tbody>
                      </table>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {activeView === 'gateway' && (
            <div className="max-w-[1400px] mx-auto space-y-12 animate-in slide-in-from-bottom duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-2">
                    <h2 className="text-6xl font-black tracking-tighter">بوابة المطورين & API Gateway</h2>
                    <p className="text-slate-500 font-bold text-lg max-w-2xl">أدوات الربط البرمجي لقبول المدفوعات في متجرك الإلكتروني.</p>
                  </div>
                  <button onClick={() => setModalType('new_key')} className="px-10 py-5 bg-sky-600 rounded-[2rem] font-black text-xl hover:bg-sky-500 transition-all shadow-2xl active:scale-95 flex items-center gap-4">
                    <span>توليد مفتاح جديد</span>
                    <span className="text-2xl">+</span>
                  </button>
               </div>

               <div className="bg-[#111827] border border-white/5 rounded-[4rem] shadow-2xl overflow-hidden">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                     <h3 className="text-2xl font-black text-white">إدارة مفاتيح الوصول</h3>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-right min-w-[1000px]">
                        <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                           <tr>
                              <th className="p-8">الاسم</th>
                              <th className="p-8">المفتاح البرمجي</th>
                              <th className="p-8">الطلبات</th>
                              <th className="p-8">تاريخ الإصدار</th>
                              <th className="p-8 text-center">الحالة</th>
                              <th className="p-8 text-center">التحكم</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-bold">
                           {(user.apiKeys || []).length > 0 ? (
                             user.apiKeys?.map((k) => (
                               <tr key={k.id} className="hover:bg-white/5 transition-all">
                                  <td className="p-8">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-sky-600/20 rounded-xl flex items-center justify-center text-sky-400">🔑</div>
                                        <span className="text-white text-lg">{k.name}</span>
                                     </div>
                                  </td>
                                  <td className="p-8">
                                     <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 w-max">
                                        <code className="text-sky-300 font-mono text-xs tracking-widest">{isKeyVisibleId === k.id ? k.key : '••••••••••••••••••••••••'}</code>
                                        <button onClick={() => setIsKeyVisibleId(isKeyVisibleId === k.id ? null : k.id)} className="text-[10px] font-black text-slate-500 hover:text-white">{isKeyVisibleId === k.id ? 'إخفاء' : 'عرض'}</button>
                                        <button onClick={() => copyToClipboard(k.key)} className="text-[10px] font-black text-sky-500">نسخ</button>
                                     </div>
                                  </td>
                                  <td className="p-8 text-white font-mono">{k.requests}</td>
                                  <td className="p-8 text-xs text-slate-500 font-mono">{k.createdAt}</td>
                                  <td className="p-8 text-center">
                                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {k.status === 'active' ? 'نشط' : 'ملغى'}
                                     </span>
                                  </td>
                                  <td className="p-8 text-center">
                                     {k.status === 'active' && (
                                       <button onClick={() => handleRevokeKey(k.id)} className="text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all font-black text-xs">إبطال</button>
                                     )}
                                  </td>
                               </tr>
                             ))
                           ) : (
                             <tr>
                               <td colSpan={6} className="p-20 text-center italic text-slate-600">لا توجد مفاتيح API. ابدأ بتوليد مفتاح لربط متجرك.</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2">
                     <div className="bg-[#111827] p-12 border border-white/5 rounded-[4rem] shadow-2xl space-y-10">
                        <div className="flex justify-between items-center border-b border-white/5 pb-8">
                           <h3 className="text-3xl font-black text-emerald-400">وثائق الربط (SDK)</h3>
                           <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
                              {(['nodejs', 'python', 'php'] as const).map(l => (
                                 <button key={l} onClick={() => setActiveLang(l)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeLang === l ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{l}</button>
                              ))}
                           </div>
                        </div>
                        <div className="relative">
                           <pre className="p-12 bg-black/60 border border-white/5 rounded-[3rem] overflow-x-auto text-left font-mono text-sm leading-loose text-emerald-400 custom-scrollbar" dir="ltr">
                              {snippets[activeLang]}
                           </pre>
                        </div>
                     </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#020617] to-slate-900 p-12 border border-white/10 rounded-[4rem] shadow-2xl flex flex-col items-center justify-center text-center gap-8">
                     <div className="w-24 h-24 bg-sky-600/10 rounded-full flex items-center justify-center text-5xl">🛠️</div>
                     <h3 className="text-2xl font-black uppercase tracking-widest">محاكي الدفع</h3>
                     <p className="text-slate-400 font-bold">هذه الواجهة هي ما سيراه عميلك عند استدعاء رابط الدفع الخاص بنا من موقعك.</p>
                     <div className="p-6 bg-[#020617] rounded-3xl border border-white/10 w-full flex flex-col gap-4 animate-pulse">
                        {siteConfig.logoUrl && <img src={siteConfig.logoUrl} className="h-6 opacity-50" alt="Logo" />}
                        <div className="h-8 bg-white/5 rounded-lg"></div>
                        <div className="h-10 bg-sky-600/50 rounded-lg"></div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'deals' && (
            <MerchantDealCreator 
              user={user} 
              addNotification={addNotification} 
              onUpdateUser={onUpdateUser} 
            />
         )}

         {activeView === 'settings' && (
           <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500 space-y-12">
              <h2 className="text-6xl font-black tracking-tighter">إعدادات حساب الموزع</h2>
              
              <div className="bg-[#0f172a]/60 backdrop-blur-3xl p-12 border border-white/5 rounded-[4rem] shadow-2xl space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الاسم الكامل</p>
                       <p className="text-2xl font-black text-white">{user.fullName}</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">البريد الإلكتروني</p>
                       <p className="text-2xl font-black text-white">{user.email}</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">رقم الهاتف</p>
                       <p className="text-2xl font-black text-white" dir="ltr">{user.phoneNumber || 'غير محدد'}</p>
                    </div>
                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معرف الموزع</p>
                       <p className="text-xl font-mono text-sky-400">ID: {user.id.toUpperCase()}</p>
                    </div>
                 </div>

                 <form onSubmit={handleChangePassword} className="space-y-10 pt-10 border-t border-white/10">
                    <h3 className="text-3xl font-black border-r-8 border-sky-500 pr-8">تأمين الحساب (تغيير كلمة المرور)</h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">كلمة المرور الحالية</label>
                          <input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">الجديدة</label>
                             <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-6">تأكيد</label>
                             <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none focus:border-sky-500" />
                          </div>
                       </div>
                    </div>
                    {passwordError && <p className="text-red-500 text-xs font-black">{passwordError}</p>}
                    {passwordSuccess && <p className="text-emerald-500 text-xs font-black">تم التحديث بنجاح ✓</p>}
                    <button type="submit" className="w-full py-8 bg-sky-600 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">حفظ التغييرات</button>
                 </form>
              </div>
           </div>
         )}
      </main>

      {/* MODALS */}
      
      {/* Transfer Animation Modal */}
      {modalType === 'send' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#111827] border border-white/10 w-full max-w-3xl rounded-[6rem] p-12 md:p-24 overflow-hidden shadow-3xl text-center relative min-h-[600px] flex flex-col justify-center">
               <button onClick={()=>setModalType(null)} className={`absolute top-12 right-12 text-slate-500 hover:text-white text-3xl transition-colors ${isTransferring ? 'hidden' : ''}`}>✕</button>
               
               {!isTransferring ? (
                 <form onSubmit={handleStartTransfer} className="space-y-12 animate-in zoom-in duration-500">
                    <h3 className="text-5xl font-black tracking-tighter text-white">تحويل رصيد مباشر</h3>
                    <div className="space-y-8 text-right">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">اسم مستخدم المستلم</label>
                          <input required value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none" placeholder="@username" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">المبلغ ($)</label>
                          <input required type="number" value={sendAmount} onChange={e=>setSendAmount(e.target.value)} className="w-full p-8 bg-black/40 border border-white/10 rounded-2xl font-black text-5xl text-center text-sky-400 outline-none" placeholder="0.00" />
                       </div>
                    </div>
                    <button type="submit" className="w-full py-8 bg-sky-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">تأكيد ومباشرة التحويل</button>
                 </form>
               ) : (
                 <div className="space-y-16 animate-in fade-in duration-700">
                    {transferSuccess ? (
                      <div className="space-y-10 animate-in zoom-in duration-700">
                         <div className="w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center text-9xl mx-auto shadow-[0_0_100px_rgba(16,185,129,0.4)] border-4 border-emerald-400">✓</div>
                         <h3 className="text-7xl font-black text-white tracking-tighter">تم التحويل بنجاح</h3>
                         <p className="text-3xl text-emerald-400 font-black tracking-[0.2em] uppercase">TRANSACTION COMPLETED</p>
                      </div>
                    ) : (
                      <div className="space-y-16">
                         <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                            <span className="text-[8rem] animate-bounce">⏳</span>
                         </div>
                         <div className="space-y-10">
                            <div className="relative w-full h-10 bg-white/5 border border-white/10 rounded-full overflow-hidden shadow-inner">
                               <div 
                                 className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 transition-all duration-300 ease-linear shadow-[0_0_40px_rgba(14,165,233,0.5)]" 
                                 style={{ width: `${transferProgress}%` }}
                               ></div>
                            </div>
                            <div className="min-h-[100px] flex items-center justify-center px-10">
                               <p className="text-3xl font-black text-sky-400 animate-pulse text-center leading-relaxed">
                                  {bankingPhrases[transferStep]}
                               </p>
                            </div>
                         </div>
                         <div className="flex justify-center gap-10 text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] opacity-40">
                            <span>SSL SECURED</span>
                            <span>AES-256</span>
                            <span>NODE VERIFIED</span>
                         </div>
                      </div>
                    )}
                 </div>
               )}
            </div>
         </div>
      )}

      {modalType === 'cards' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#111827] border border-white/10 w-full max-w-2xl rounded-[4rem] p-16 space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
               <button onClick={()=>setModalType(null)} className="absolute top-10 right-10 text-slate-500 hover:text-white text-2xl">✕</button>
               <h3 className="text-5xl font-black tracking-tighter text-white">إصدار بطاقات شحن</h3>
               <div className="space-y-8 text-right">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">قيمة البطاقة الواحد ($)</label>
                     <div className="grid grid-cols-4 gap-4">
                        {[50, 100, 500, 1000].map(val => (
                           <button key={val} onClick={()=>setCardAmount(val)} className={`py-4 rounded-xl font-black text-xl transition-all border ${cardAmount === val ? 'bg-emerald-600 border-emerald-400' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>${val}</button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">الكمية</label>
                     <input type="number" value={cardQuantity} onChange={e=>setCardQuantity(parseInt(e.target.value))} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-4xl text-center text-white outline-none" />
                  </div>
                  <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex justify-between items-center">
                     <p className="font-black text-emerald-400 text-xs">إجمالي التكلفة</p>
                     <p className="text-4xl font-black text-white">${(cardAmount * cardQuantity).toLocaleString()}</p>
                  </div>
               </div>
               <button onClick={handleGenerateCards} className="w-full py-8 bg-emerald-600 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-emerald-500 transition-all active:scale-95">تأكيد الإصدار</button>
            </div>
         </div>
      )}

      {modalType === 'new_key' && (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
            <div className="bg-[#111827] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-12 animate-in zoom-in duration-500 shadow-3xl text-center relative">
               <button onClick={()=>setModalType(null)} className="absolute top-10 right-10 text-slate-500 hover:text-white text-2xl">✕</button>
               <h3 className="text-4xl font-black tracking-tighter text-white">توليد مفتاح API جديد</h3>
               <div className="space-y-6 text-right">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-500 mr-6 uppercase tracking-widest">اسم المفتاح (للمرجع)</label>
                     <input value={newKeyName} onChange={e=>setNewKeyName(e.target.value)} className="w-full p-6 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none" placeholder="مثلاً: متجر الملابس" />
                  </div>
               </div>
               <button onClick={handleGenerateApiKey} className="w-full py-6 bg-sky-600 rounded-[2.5rem] font-black text-xl shadow-xl hover:bg-sky-500 transition-all active:scale-95">توليد الآن</button>
            </div>
         </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8); }
      `}</style>
    </div>
  );
};

export default MerchantDashboard;
