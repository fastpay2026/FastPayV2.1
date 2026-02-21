
import React, { useState, useMemo } from 'react';
import { User, Transaction, Notification, VerificationRequest, AdExchangeItem, AdNegotiation, SiteConfig } from '../types';
import { MerchantVerification } from './VerificationManager';
import { AdExchange } from './AdExchange';

interface Props {
  user: User;
  onLogout: () => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
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
    "بدء تشفير الوثيقة عبر بروتوكول FastPay-Secure-Tunnel...",
    "فحص البصمة الرقمية للملف والتأكد من سلامة البيانات...",
    "مزامنة مستند الشحن مع السجل الموزع العالمي (Global Ledger)...",
    "التحقق من مطابقة الكميات والمواصفات عبر الذكاء الاصطناعي...",
    "تأمين حقوق الطرفين عبر عقد ذكي (Smart Contract) غير قابل للتعديل...",
    "إرسال إشعار فوري لمركز التدقيق الإقليمي (Riyadh-Node-01)...",
    "تجهيز ملف التدقيق النهائي للمراجعة البشرية..."
  ];

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(dealForm.totalAmount);
    
    // Validate buyer existence
    const buyerExists = accounts.some(acc => acc.username === dealForm.buyerName);
    if (!buyerExists) {
      return alert('عذراً، اسم المشتري غير موجود في الشبكة. يرجى إدخال اسم مستخدم (Username) صحيح.');
    }

    if (isNaN(amount) || amount <= 0) {
      return alert('يرجى إدخال مبلغ صحيح');
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      const ts = new Date().toLocaleString('ar-SA');
      const transactionHash = isLCEnabled ? `0x${Math.random().toString(16).substr(2, 32)}` : undefined;
      
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
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
        'إنشاء صفقة', 
        `تم إنشاء صفقة ${dealForm.goodsType} مع ${dealForm.buyerName} بقيمة $${amount.toLocaleString()}${isLCEnabled ? ' (نظام LC نشط)' : ''}`, 
        'money'
      );
      
      setIsProcessing(false);
      setDealForm({ buyerName: '', goodsType: 'معادن تجارية', quantity: '', totalAmount: '', notes: '' });
      setActiveTab('history');
      alert('تم إنشاء الصفقة بنجاح وإرسالها للمشتري ✅');
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
    addNotification('تحديث الشحن', 'تم رفع وثيقة الشحن بنجاح وتغيير حالة الصفقة إلى Shipped. بانتظار مراجعة الإدارة.', 'system');
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

  return (
    <div className="fixed inset-0 z-[150] flex bg-[#0a0a0a] text-white text-right font-sans overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className="w-80 bg-[#111] border-l border-white/5 flex flex-col z-20">
        <div className="p-10 border-b border-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              <span className="text-xl">🏪</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">Merchant Suite</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Infrastructure 2026</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: '📊' },
            { id: 'create', label: 'إنشاء صفقة جديدة', icon: '➕' },
            { id: 'history', label: 'سجل الصفقات', icon: '📜' },
            { id: 'ads', label: 'بورصة الإعلانات', icon: '📢' },
            { id: 'verification', label: 'توثيق الحساب', icon: '🛡️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
                محجوز (Escrow)
              </div>
            )}
            <p className="text-[10px] text-slate-500 font-black uppercase mb-2">السيولة المتوفرة</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-teal-400">${user.balance.toLocaleString()}</p>
              {hasEscrow && <span className="text-[10px] text-amber-500 font-bold">(+{stats.reservedAmount.toLocaleString()} محجوز)</span>}
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all">تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-black/20 backdrop-blur-xl border-b border-white/5 px-12 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tighter">
              {activeTab === 'overview' && 'لوحة التحكم التجارية'}
              {activeTab === 'create' && 'بوابة إنشاء الصفقات'}
              {activeTab === 'history' && 'أرشيف العمليات'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-left border-l border-white/10 pl-6">
              <p className="font-black text-white flex items-center gap-2">
                {user.fullName}
                {user.isVerified && <span className="text-sky-400 text-sm" title="حساب موثق">☑️</span>}
              </p>
              <p className="text-[10px] text-teal-500 font-black uppercase">تاجر معتمد لدى FastPay</p>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-xl">🛡️</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'إجمالي حجم التداول', value: `$${stats.totalVolume.toLocaleString()}`, icon: '💰', color: 'text-teal-400' },
                  { label: 'عدد الصفقات المنفذة', value: stats.dealsCount, icon: '🤝', color: 'text-sky-400' },
                  { label: 'اعتمادات LC نشطة', value: stats.activeLC, icon: '🔒', color: 'text-amber-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-4xl">{s.icon}</span>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{s.label}</p>
                    </div>
                    <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-[#111] p-12 rounded-[4rem] border border-white/5 space-y-8">
                  <h3 className="text-2xl font-black text-white">آخر النشاطات</h3>
                  <div className="space-y-4">
                    {merchantTransactions.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex justify-between items-center p-6 bg-black/40 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-teal-500/10 text-teal-400 rounded-full flex items-center justify-center">🤝</div>
                          <div>
                            <p className="font-bold text-white">صفقة مع {t.relatedUser}</p>
                            <p className="text-[10px] text-slate-500">{t.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-xl font-black text-teal-400">${Math.abs(t.amount).toLocaleString()}</p>
                      </div>
                    ))}
                    {merchantTransactions.length === 0 && <p className="text-center py-10 text-slate-600 font-bold">لا توجد عمليات سابقة</p>}
                  </div>
                </div>

                <div className="bg-teal-500/5 border border-teal-500/10 rounded-[4rem] p-12 flex flex-col justify-center items-center text-center space-y-8">
                  <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(20,184,166,0.2)]">🛡️</div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white">نظام الحماية المتكامل</h3>
                    <p className="text-slate-400 font-bold leading-relaxed max-w-md mx-auto">
                      جميع صفقاتك محمية بنظام التشفير العسكري AES-256. يتم التحقق من كل عملية عبر عقدة الرياض المركزية لضمان أعلى مستويات الموثوقية.
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('create')} className="px-10 py-4 bg-teal-600 rounded-2xl font-black hover:bg-teal-500 transition-all shadow-xl">ابدأ صفقة جديدة الآن</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
              <div className="bg-[#111] p-12 md:p-16 rounded-[4rem] border border-white/5 shadow-2xl space-y-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-teal-500 to-transparent"></div>
                
                <div className="space-y-2">
                  <h3 className="text-4xl font-black tracking-tighter">تفاصيل الصفقة التجارية</h3>
                  <p className="text-slate-500 font-bold">أدخل البيانات المطلوبة لإنشاء طلب دفع مضمون بنظام LC.</p>
                </div>

                <form onSubmit={handleCreateDeal} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">اسم المشتري (Username)</label>
                      <input 
                        required
                        type="text" 
                        value={dealForm.buyerName}
                        onChange={e => setDealForm({...dealForm, buyerName: e.target.value})}
                        className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all"
                        placeholder="مثلاً: user123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">نوع البضاعة</label>
                      <select 
                        value={dealForm.goodsType}
                        onChange={e => setDealForm({...dealForm, goodsType: e.target.value})}
                        className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all cursor-pointer"
                      >
                        <option value="معادن تجارية">معادن تجارية</option>
                        <option value="البسه">البسه</option>
                        <option value="اطارات للسيارات">اطارات للسيارات</option>
                        <option value="مواد انشائية">مواد انشائية</option>
                        <option value="قطع غيار سيارات">قطع غيار سيارات</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">الكمية</label>
                      <input 
                        required
                        type="text" 
                        value={dealForm.quantity}
                        onChange={e => setDealForm({...dealForm, quantity: e.target.value})}
                        className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all"
                        placeholder="مثلاً: 1000 وحدة"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">المبلغ الإجمالي ($)</label>
                      <input 
                        required
                        type="number" 
                        value={dealForm.totalAmount}
                        onChange={e => setDealForm({...dealForm, totalAmount: e.target.value})}
                        className="w-full p-6 bg-black/60 border border-teal-500/30 rounded-3xl font-black text-3xl text-teal-400 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">ملاحظات إضافية (اختياري)</label>
                    <textarea 
                      maxLength={500}
                      value={dealForm.notes}
                      onChange={e => setDealForm({...dealForm, notes: e.target.value})}
                      className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-black text-white outline-none focus:border-teal-500 transition-all min-h-[120px] resize-none"
                      placeholder="اكتب أي ملاحظات إضافية هنا (حد أقصى 500 حرف)..."
                    />
                    <div className="text-left">
                      <span className="text-[10px] text-slate-600 font-bold">{dealForm.notes.length}/500</span>
                    </div>
                  </div>

                  <div className="p-8 bg-teal-500/5 border border-teal-500/10 rounded-[2.5rem] flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-black text-teal-400 text-lg">نظام الاعتماد المستندي (FastPay)</p>
                      <p className="text-xs text-slate-500 font-bold">هذا النظام إلزامي لضمان حقوق الطرفين؛ سيتم حجز المبلغ من المشتري ولا يُحرر إلا برفع مستند الشحن.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full border border-teal-500/30">
                      <span className="text-teal-400 text-xs font-black">نشط دائماً</span>
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className={`w-full py-8 bg-teal-600 rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-teal-500 transition-all active:scale-95 flex items-center justify-center gap-4 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></span>
                        <span>جاري معالجة البيانات...</span>
                      </>
                    ) : (
                      <>
                        <span>تأكيد وإنشاء الصفقة</span>
                        <span className="text-3xl">🤝</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-[#111] rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right">
                  <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                    <tr>
                      <th className="p-10">المشتري</th>
                      <th className="p-10">المبلغ</th>
                      <th className="p-10">التوقيت</th>
                      <th className="p-10 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {merchantTransactions.map((t, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-all">
                        <td className="p-10">
                          <div className="flex flex-col">
                            <span className="text-xl text-white">{t.relatedUser}</span>
                            {t.hash && <span className="text-[8px] font-mono text-teal-500/50 truncate max-w-[150px]">{t.hash}</span>}
                            {t.notes && <span className="text-[10px] text-slate-500 italic mt-1 truncate max-w-[200px]" title={t.notes}>{t.notes}</span>}
                          </div>
                        </td>
                        <td className="p-10 text-2xl font-black text-teal-400">${Math.abs(t.amount).toLocaleString()}</td>
                        <td className="p-10 text-xs text-slate-500 font-mono">{t.timestamp}</td>
                        <td className="p-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase border ${
                              t.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              t.status === 'escrow' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {t.status === 'shipped' ? 'Shipped' : t.status === 'escrow' ? 'Escrow' : 'مكتملة'}
                            </span>
                            {t.status === 'escrow' && (
                              <button 
                                onClick={() => handleUploadShippingDoc(t.id)}
                                className="text-[10px] text-teal-400 hover:text-white underline transition-colors"
                              >
                                رفع وثيقة الشحن
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {merchantTransactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-40 text-center opacity-30">
                          <div className="text-8xl mb-4">📜</div>
                          <p className="text-2xl font-black">لا توجد صفقات مسجلة</p>
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
                  <h3 className="text-4xl font-black tracking-tighter">رفع وثيقة الشحن</h3>
                  <p className="text-slate-500 font-bold">يرجى رفع بوليصة الشحن بصيغة PDF فقط للتحقق من العملية.</p>
                </div>
                
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          return alert('عذراً، يجب رفع ملف بصيغة PDF فقط.');
                        }
                        startUploadAnimation();
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full py-12 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/5 group-hover:bg-white/10 group-hover:border-teal-500/40 transition-all flex flex-col items-center gap-4">
                    <span className="text-4xl">📤</span>
                    <span className="font-black text-teal-400">اضغط هنا أو اسحب الملف لرفعه</span>
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
                  <h3 className="text-5xl font-black tracking-tighter">تم رفع الوثيقة بنجاح</h3>
                  <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] space-y-2">
                    <p className="text-xl font-black text-emerald-400">سيتم التدقيق خلال 4 ساعات</p>
                    <p className="text-sm text-slate-500 font-bold">شكراً لالتزامكم بمعايير FastPay Global لضمان حقوق الطرفين.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUploadModalTransactionId(null)}
                  className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl font-black text-xl hover:bg-white/10 transition-all"
                >
                  إغلاق النافذة
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
