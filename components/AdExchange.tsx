
import React, { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User, AdExchangeItem, AdNegotiation, Transaction, Notification, SiteConfig } from '../types';

interface Props {
  user: User;
  adExchangeItems: AdExchangeItem[];
  setAdExchangeItems: React.Dispatch<React.SetStateAction<AdExchangeItem[]>>;
  adNegotiations: AdNegotiation[];
  setAdNegotiations: React.Dispatch<React.SetStateAction<AdNegotiation[]>>;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addNotification: (title: string, message: string, type: Notification['type'], targetUserId?: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  siteConfig: SiteConfig;
}

const scanForLeakage = (text: string): boolean => {
  const phoneRegex = /(\+?\d{1,4}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const usernameRegex = /@\w+/g;
  return phoneRegex.test(text) || emailRegex.test(text) || usernameRegex.test(text);
};

export const AdExchange: React.FC<Props> = ({
  user, adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations,
  accounts, setAccounts, transactions, setTransactions, addNotification, onUpdateUser, siteConfig
}) => {
  const [view, setView] = useState<'browse' | 'my_ads' | 'admin_review'>('browse');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdExchangeItem | null>(null);
  const [negotiationAmount, setNegotiationAmount] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [buyProgress, setBuyProgress] = useState(0);

  // Ad Form State
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'إلكترونيات',
    imageUrl: '',
    imageUrl2: '',
    imageUrl3: '',
    isNegotiable: false,
    country: 'السعودية',
    state: '',
    city: ''
  });

  const filteredAds = useMemo(() => {
    if (view === 'admin_review') return adExchangeItems.filter(ad => ad.status === 'pending_promotion' || ad.promotionStatus === 'requested');
    if (view === 'my_ads') return adExchangeItems.filter(ad => ad.merchantId === user.id);
    return adExchangeItems.filter(ad => ad.status === 'active');
  }, [adExchangeItems, view, user.id]);

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (scanForLeakage(adForm.title) || scanForLeakage(adForm.description)) {
      addNotification('خرق أمني', 'تم اكتشاف بيانات اتصال في الإعلان. تم حظر الإعلان وتعليق حسابك تلقائياً.', 'security');
      onUpdateUser({ ...user, status: 'suspended', statusReason: 'محاولة تسريب بيانات اتصال في الإعلانات' });
      setIsCreateModalOpen(false);
      return;
    }

    const newAd: AdExchangeItem = {
      id: uuidv4(),
      merchantId: user.id,
      merchantName: user.fullName,
      title: adForm.title,
      description: adForm.description,
      price: parseFloat(adForm.price),
      isNegotiable: adForm.isNegotiable,
      category: adForm.category,
      imageUrl: adForm.imageUrl || 'https://picsum.photos/seed/ads/800/600',
      imageUrl2: adForm.imageUrl2,
      imageUrl3: adForm.imageUrl3,
      views: 0,
      status: 'active',
      location: {
        country: adForm.country,
        state: adForm.state,
        city: adForm.city
      },
      promotionStatus: 'none',
      createdAt: new Date().toLocaleString('ar-SA')
    };

    setAdExchangeItems(prev => [newAd, ...prev]);
    addNotification('تم النشر', 'تم نشر إعلانك بنجاح في بورصة FPN.', 'system');
    setIsCreateModalOpen(false);
    setAdForm({ title: '', description: '', price: '', category: 'إلكترونيات', imageUrl: '', imageUrl2: '', imageUrl3: '', isNegotiable: false, country: 'السعودية', state: '', city: '' });
  };

  const handlePromoteRequest = (adId: string, type: 'network' | 'network_home') => {
    if (!user.isVerified) {
      return alert('عذراً، يجب أن يكون حسابك موثقاً بالشارة الزرقاء لطلب الترويج.');
    }

    setAdExchangeItems(prev => prev.map(ad => ad.id === adId ? { ...ad, promotionStatus: 'requested', promotionType: type } : ad));
    addNotification('طلب ترويج', 'تم إرسال طلب الترويج للإدارة لتحديد السعر.', 'system');
  };

  const handlePayPromotion = (ad: AdExchangeItem) => {
    if (!ad.promotionPrice) return;
    if (user.balance < ad.promotionPrice) return alert('رصيدك غير كافٍ لدفع رسوم الترويج.');

    onUpdateUser({ ...user, balance: user.balance - ad.promotionPrice });
    setAdExchangeItems(prev => prev.map(a => a.id === ad.id ? { ...a, promotionStatus: 'pending_review' } : a));
    addNotification('تم الدفع', 'تم دفع رسوم الترويج. الإعلان قيد المراجعة النهائية الآن.', 'money');
  };

  const handleAdminApprovePromotion = (ad: AdExchangeItem) => {
    setAdExchangeItems(prev => prev.map(a => a.id === ad.id ? { ...a, promotionStatus: 'active' } : a));
    addNotification('تم تفعيل الترويج', `تم تفعيل الترويج لإعلان ${ad.title} بنجاح.`, 'system');
  };

  const handleAdminRejectPromotion = (ad: AdExchangeItem) => {
    if (ad.promotionPrice) {
      // Refund
      setAccounts(prev => prev.map(acc => acc.id === ad.merchantId ? { ...acc, balance: acc.balance + ad.promotionPrice! } : acc));
      addNotification('استرداد مبلغ', `تم رفض ترويج إعلان ${ad.title} وإعادة $${ad.promotionPrice} لمحفظة التاجر.`, 'money');
    }
    setAdExchangeItems(prev => prev.map(a => a.id === ad.id ? { ...a, promotionStatus: 'rejected' } : a));
  };

  const handleBuyAd = (ad: AdExchangeItem) => {
    const finalPrice = ad.price;
    if (user.balance < finalPrice) {
      return alert('رصيدك غير كافٍ لإتمام هذه العملية.');
    }

    setIsBuying(true);
    setBuyProgress(0);

    const duration = 50000; // 50 seconds
    const interval = 100;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setBuyProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          finalizePurchase(ad);
          return 100;
        }
        return prev + increment;
      });
    }, interval);
  };

  const finalizePurchase = (ad: AdExchangeItem) => {
    const amount = ad.price;
    const commission = amount * 0.01;
    const merchantNet = amount - commission;

    // Update Buyer
    onUpdateUser({ ...user, balance: user.balance - amount });

    // Update Merchant
    setAccounts(prev => prev.map(acc => acc.id === ad.merchantId ? { ...acc, balance: acc.balance + merchantNet } : acc));

    // Update Admin (Commission)
    setAccounts(prev => prev.map(acc => acc.role === 'DEVELOPER' ? { ...acc, balance: acc.balance + commission } : acc));

    // Create Transaction
    const newTrans: Transaction = {
      id: uuidv4(),
      userId: user.id,
      type: 'trade_buy',
      amount: -amount,
      relatedUser: ad.merchantName,
      timestamp: new Date().toLocaleString('ar-SA'),
      status: 'escrow',
      notes: `شراء: ${ad.title} (FPN Flow)`
    };
    setTransactions(prev => [newTrans, ...prev]);

    addNotification('نجاح العملية', `تم تأمين مبلغ $${amount.toLocaleString()} في نظام FPN. بانتظار شحن المنتج.`, 'money');
    setIsBuying(false);
    setSelectedAd(null);
  };

  const handleNegotiate = (adId: string) => {
    const ad = adExchangeItems.find(a => a.id === adId);
    if (!ad) return;

    const amount = parseFloat(negotiationAmount);
    if (isNaN(amount) || amount <= 0) return alert('يرجى إدخال مبلغ صحيح');

    const newOffer: AdNegotiation = {
      id: uuidv4(),
      adId,
      buyerId: user.id,
      buyerName: user.fullName,
      offerAmount: amount,
      status: 'pending',
      createdAt: new Date().toLocaleString('ar-SA')
    };

    setAdNegotiations(prev => [newOffer, ...prev]);
    addNotification('إرسال عرض', 'تم إرسال عرضك السعري للتاجر.', 'system');
    
    // Notify the merchant
    addNotification('اهتمام بالإعلان', `هناك شخص مهتم بإعلانك "${ad.title}" وقد أرسل عرضاً سعرياً بقيمة $${amount.toLocaleString()}`, 'user', ad.merchantId);
    
    setNegotiationAmount('');
  };

  const handleAcceptOffer = (offer: AdNegotiation) => {
    setAdExchangeItems(prev => prev.map(ad => ad.id === offer.adId ? { ...ad, price: offer.offerAmount } : ad));
    setAdNegotiations(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o));
    addNotification('تم قبول العرض', `تم تحديث سعر الإعلان إلى $${offer.offerAmount.toLocaleString()}`, 'system');
  };

  const handleAdjustViews = (adId: string) => {
    const newViews = prompt('أدخل عدد المشاهدات الجديد:');
    if (newViews !== null) {
      setAdExchangeItems(prev => prev.map(ad => ad.id === adId ? { ...ad, views: parseInt(newViews) || 0 } : ad));
      addNotification('تحديث المشاهدات', 'تم تحديث عدد المشاهدات يدوياً.', 'system');
    }
  };

  const handleSuspendMerchant = (merchantId: string) => {
    if (confirm('هل أنت متأكد من تعليق حساب هذا التاجر وحظر جميع إعلاناته؟')) {
      setAccounts(prev => prev.map(acc => acc.id === merchantId ? { ...acc, status: 'suspended', statusReason: 'تعليق إداري من بورصة الإعلانات' } : acc));
      setAdExchangeItems(prev => prev.map(ad => ad.merchantId === merchantId ? { ...ad, status: 'suspended' } : ad));
      addNotification('تعليق حساب', 'تم تعليق حساب التاجر وحظر إعلاناته.', 'security');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">بورصة الإعلانات FPN</h2>
          <p className="text-slate-500 font-bold text-base md:text-lg">سوق متكامل يربط التجار بالعملاء بضمان الاعتماد المستندي.</p>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
          <button onClick={() => setView('browse')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all ${view === 'browse' ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>تصفح السوق</button>
          {user.role === 'MERCHANT' && (
            <>
              <button onClick={() => setView('my_ads')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all ${view === 'my_ads' ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>إعلاناتي</button>
              <button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto px-6 md:px-8 py-3 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">نشر إعلان جديد ➕</button>
            </>
          )}
          {user.role === 'DEVELOPER' && (
            <button onClick={() => setView('admin_review')} className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-base transition-all ${view === 'admin_review' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>مراجعة الإعلانات</button>
          )}
        </div>
      </header>

      {/* Ad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {filteredAds.map(ad => (
          <div key={ad.id} className="bg-[#0f172a] border border-white/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden group hover:border-sky-500/50 transition-all shadow-2xl flex flex-col h-auto">
            <div className="relative h-48 md:h-56 overflow-hidden">
              <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
              <div className="absolute top-4 right-4 flex gap-2">
                <span className="px-4 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">{ad.category}</span>
                {ad.promotionStatus === 'active' && (
                  <span className="px-4 py-1 bg-sky-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest animate-pulse">مميز ⭐</span>
                )}
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="px-4 py-1 bg-emerald-600 rounded-full text-xs font-black text-white shadow-lg">${ad.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-black text-white group-hover:text-sky-400 transition-colors">{ad.title}</h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-bold flex items-center gap-1">
                  📍 {ad.location.country} • {ad.location.city || ad.location.state || 'عام'}
                </p>
              </div>
              
              {/* Ad Stats - Responsive Flex Wrap */}
              <div className="flex flex-wrap gap-2 md:gap-3 py-2">
                <div className="flex flex-col bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex-1 min-w-[80px]">
                  <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase">السعر</span>
                  <span className="text-sm md:text-base font-black text-emerald-400">${ad.price.toLocaleString()}</span>
                </div>
                <div className="flex flex-col bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex-1 min-w-[80px]">
                  <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase">المشاهدات</span>
                  <span className="text-sm md:text-base font-black text-sky-400">{ad.views}</span>
                </div>
                <div className="flex flex-col bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex-1 min-w-[80px]">
                  <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase">الحالة</span>
                  <span className="text-sm md:text-base font-black text-white">نشط</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs md:text-sm font-bold line-clamp-2 leading-relaxed flex-1">{ad.description}</p>
              
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-600/20 text-sky-400 flex items-center justify-center text-[10px] font-black">
                    {ad.merchantName.charAt(0)}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ad.merchantName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-600 uppercase">👁️ {ad.views}</span>
                </div>
              </div>

              {view === 'browse' && (
                <button 
                  onClick={() => {
                    setSelectedAd(ad);
                    setAdExchangeItems(prev => prev.map(a => a.id === ad.id ? { ...a, views: a.views + 1 } : a));
                  }}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black hover:bg-sky-600 hover:text-white transition-all active:scale-95"
                >
                  عرض التفاصيل
                </button>
              )}

              {view === 'my_ads' && (
                <div className="space-y-4">
                  {/* Offers Section */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">العروض السعرية الواردة</p>
                    <div className="space-y-2">
                      {adNegotiations.filter(n => n.adId === ad.id).length > 0 ? (
                        adNegotiations.filter(n => n.adId === ad.id).map(offer => (
                          <div key={offer.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group/offer">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white">{offer.buyerName}</span>
                              <span className="text-[9px] text-slate-500">{offer.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-emerald-400">${offer.offerAmount.toLocaleString()}</span>
                              {offer.status === 'pending' && (
                                <button 
                                  onClick={() => handleAcceptOffer(offer)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black hover:bg-emerald-500 transition-all"
                                >
                                  قبول
                                </button>
                              )}
                              {offer.status === 'accepted' && (
                                <span className="text-[9px] font-black text-emerald-500">مقبول ✅</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-600 italic">لا توجد عروض حالياً</p>
                      )}
                    </div>
                  </div>

                  {ad.promotionStatus === 'none' && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button onClick={() => handlePromoteRequest(ad.id, 'network')} className="py-3 bg-sky-600/10 text-sky-400 border border-sky-600/20 rounded-xl text-[10px] font-black hover:bg-sky-600 hover:text-white transition-all">ترويج داخلي</button>
                      <button onClick={() => handlePromoteRequest(ad.id, 'network_home')} className="py-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all">ترويج شامل</button>
                    </div>
                  )}
                  {ad.promotionStatus === 'requested' && (
                    ad.promotionPrice ? (
                      <button onClick={() => handlePayPromotion(ad)} className="w-full py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black hover:bg-amber-500 transition-all">
                        دفع رسوم الترويج (${ad.promotionPrice})
                      </button>
                    ) : (
                      <p className="text-center text-[10px] font-black text-amber-500 animate-pulse">بانتظار تسعير الإدارة...</p>
                    )
                  )}
                  {ad.promotionStatus === 'pending_review' && <p className="text-center text-[10px] font-black text-sky-500 animate-pulse">قيد المراجعة النهائية...</p>}
                  {ad.promotionStatus === 'active' && <p className="text-center text-[10px] font-black text-emerald-500">الإعلان مروج حالياً ✅</p>}
                  {ad.promotionStatus === 'rejected' && <p className="text-center text-[10px] font-black text-red-500">تم رفض طلب الترويج</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Ad Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl rounded-[4rem] p-12 space-y-12 animate-in zoom-in shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-4xl font-black tracking-tighter">نشر إعلان جديد</h3>
                <p className="text-slate-500 font-bold">يرجى الالتزام بسياسات النشر. سيتم حظر الحساب تلقائياً في حال وجود بيانات اتصال.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-4xl opacity-50 hover:opacity-100 transition-all">✕</button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">عنوان الإعلان</label>
                  <input required type="text" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-sky-500 transition-all" placeholder="مثلاً: آيفون 15 برو ماكس جديد" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">الفئة</label>
                  <select value={adForm.category} onChange={e => setAdForm({...adForm, category: e.target.value})} className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-sky-500 transition-all cursor-pointer">
                    <option value="إلكترونيات">إلكترونيات</option>
                    <option value="عقارات">عقارات</option>
                    <option value="سيارات">سيارات</option>
                    <option value="خدمات">خدمات</option>
                    <option value="أزياء">أزياء</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">وصف الإعلان</label>
                <textarea required value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-sky-500 transition-all min-h-[150px] resize-none" placeholder="اكتب وصفاً تفصيلياً للمنتج أو الخدمة..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">السعر ($)</label>
                  <input required type="number" value={adForm.price} onChange={e => setAdForm({...adForm, price: e.target.value})} className="w-full p-6 bg-black/40 border border-white/10 rounded-3xl font-black text-2xl text-emerald-400 outline-none focus:border-sky-500 transition-all" placeholder="0.00" />
                </div>
                <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                  <input type="checkbox" checked={adForm.isNegotiable} onChange={e => setAdForm({...adForm, isNegotiable: e.target.checked})} className="w-6 h-6 accent-sky-500" />
                  <div className="space-y-1">
                    <p className="font-black text-white">السعر قابل للتفاوض</p>
                    <p className="text-[10px] text-slate-500 font-bold">يسمح للمشترين بتقديم عروض سعرية.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">الاستهداف الجغرافي</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <select value={adForm.country} onChange={e => setAdForm({...adForm, country: e.target.value})} className="p-6 bg-black/40 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-sky-500 transition-all">
                    <option value="السعودية">السعودية</option>
                    <option value="الإمارات">الإمارات</option>
                    <option value="قطر">قطر</option>
                    <option value="العراق">العراق</option>
                    <option value="مصر">مصر</option>
                  </select>
                  <input type="text" value={adForm.state} onChange={e => setAdForm({...adForm, state: e.target.value})} className="p-6 bg-black/40 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-sky-500 transition-all" placeholder="الولاية / المحافظة" />
                  <input type="text" value={adForm.city} onChange={e => setAdForm({...adForm, city: e.target.value})} className="p-6 bg-black/40 border border-white/10 rounded-3xl font-bold text-white outline-none focus:border-sky-500 transition-all" placeholder="المدينة" />
                </div>
                <p className="text-[10px] text-red-500 font-bold">⚠️ ملاحظة: استهداف إسرائيل محظور تماماً من النظام.</p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">صور الإعلان (3 صور كحد أقصى)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <input type="text" value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-500 transition-all text-xs" placeholder="رابط الصورة 1" />
                    {adForm.imageUrl && <div className="aspect-video rounded-xl overflow-hidden border border-white/10"><img src={adForm.imageUrl} className="w-full h-full object-cover" alt="Preview 1" /></div>}
                  </div>
                  <div className="space-y-4">
                    <input type="text" value={adForm.imageUrl2} onChange={e => setAdForm({...adForm, imageUrl2: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-500 transition-all text-xs" placeholder="رابط الصورة 2" />
                    {adForm.imageUrl2 && <div className="aspect-video rounded-xl overflow-hidden border border-white/10"><img src={adForm.imageUrl2} className="w-full h-full object-cover" alt="Preview 2" /></div>}
                  </div>
                  <div className="space-y-4">
                    <input type="text" value={adForm.imageUrl3} onChange={e => setAdForm({...adForm, imageUrl3: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white outline-none focus:border-sky-500 transition-all text-xs" placeholder="رابط الصورة 3" />
                    {adForm.imageUrl3 && <div className="aspect-video rounded-xl overflow-hidden border border-white/10"><img src={adForm.imageUrl3} className="w-full h-full object-cover" alt="Preview 3" /></div>}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-8 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-sky-500 transition-all active:scale-95">تأكيد ونشر الإعلان 🚀</button>
            </form>
          </div>
        </div>
      )}

      {/* Ad Details Modal */}
      {selectedAd && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-6xl rounded-[4rem] p-12 space-y-12 animate-in zoom-in shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter">{selectedAd.title}</h3>
                <p className="text-sky-400 font-bold text-base md:text-lg">بواسطة: {selectedAd.merchantName} {selectedAd.promotionStatus === 'active' && '⭐'}</p>
              </div>
              <button onClick={() => setSelectedAd(null)} className="text-2xl md:text-4xl opacity-50 hover:opacity-100 transition-all">✕</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-4">
                  <div className="aspect-video rounded-3xl md:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                    <img src={selectedAd.imageUrl} className="w-full h-full object-cover" alt={selectedAd.title} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAd.imageUrl2 && (
                      <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                        <img src={selectedAd.imageUrl2} className="w-full h-full object-cover" alt="Image 2" />
                      </div>
                    )}
                    {selectedAd.imageUrl3 && (
                      <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                        <img src={selectedAd.imageUrl3} className="w-full h-full object-cover" alt="Image 3" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                  <h4 className="text-xl font-black text-white">وصف المنتج</h4>
                  <p className="text-slate-400 font-bold leading-relaxed">{selectedAd.description}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-gradient-to-br from-sky-600/20 to-emerald-600/20 p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-white/10 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">السعر النهائي</p>
                    <p className="text-3xl md:text-5xl font-black text-emerald-400">${selectedAd.price.toLocaleString()}</p>
                  </div>
                  
                  {selectedAd.isNegotiable && (
                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <p className="text-xs font-black text-amber-500 uppercase tracking-widest">هذا السعر قابل للتفاوض</p>
                      <div className="flex gap-4">
                        <input 
                          type="number" 
                          value={negotiationAmount}
                          onChange={e => setNegotiationAmount(e.target.value)}
                          disabled={selectedAd.merchantId === user.id}
                          className="flex-1 p-4 bg-black/40 border border-white/10 rounded-2xl font-black text-white outline-none disabled:opacity-50"
                          placeholder={selectedAd.merchantId === user.id ? "لا يمكنك التفاوض على إعلانك" : "ضع عرضك هنا..."}
                        />
                        <button 
                          onClick={() => handleNegotiate(selectedAd.id)} 
                          disabled={selectedAd.merchantId === user.id}
                          className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black hover:bg-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          إرسال عرض
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => handleBuyAd(selectedAd)}
                    disabled={isBuying || selectedAd.merchantId === user.id}
                    className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedAd.merchantId === user.id ? 'إعلانك الخاص' : (isBuying ? 'جاري تأمين المبلغ...' : 'شراء الآن (FPN LC)')}
                    <span className="text-4xl">💳</span>
                  </button>
                  <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">نظام الاعتماد المستندي FPN نشط تلقائياً</p>
                </div>

                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                  <h4 className="text-xl font-black text-white">معلومات البائع</h4>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-sky-600/20 text-sky-400 flex items-center justify-center text-2xl font-black">
                      {selectedAd.merchantName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">{selectedAd.merchantName}</p>
                      <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">تاجر موثق ☑️</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase">الموقع</p>
                      <p className="font-bold text-white">{selectedAd.location.country}, {selectedAd.location.city}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase">تاريخ النشر</p>
                      <p className="font-bold text-white">{selectedAd.createdAt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FPN Flow Overlay */}
      {isBuying && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="max-w-2xl w-full p-12 text-center space-y-12">
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 border-8 border-white/5 rounded-full"></div>
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-emerald-500"
                  strokeDasharray={552.92}
                  strokeDashoffset={552.92 - (552.92 * buyProgress) / 100}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-black text-white">{Math.floor(buyProgress)}%</span>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-white tracking-tighter">بروتوكول FPN Flow نشط</h3>
              <p className="text-emerald-400 text-2xl font-black animate-pulse">جاري تأمين المبلغ في نظام الاعتماد المستندي FPN...</p>
              <p className="text-slate-500 font-bold max-w-md mx-auto">يتم الآن حجز المبلغ من محفظتك وتشفير العملية عبر Riyadh-Node-01 لضمان حقوقك كمشتري.</p>
            </div>
            <div className="flex justify-center gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
              <span>AES-256</span>
              <span>SECURE ESCROW</span>
              <span>GLOBAL LEDGER</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Review View */}
      {view === 'admin_review' && (
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl md:rounded-[4rem] overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
          <table className="w-full text-right font-bold min-w-[800px]">
            <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
              <tr>
                <th className="p-6 md:p-8">الإعلان</th>
                <th className="p-6 md:p-8">التاجر</th>
                <th className="p-6 md:p-8">نوع الترويج</th>
                <th className="p-6 md:p-8 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAds.map(ad => (
                <tr key={ad.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-6 md:p-8">
                    <div className="flex items-center gap-4">
                      <img src={ad.imageUrl} className="w-10 md:w-12 h-10 md:h-12 rounded-xl object-cover" alt="" />
                      <div>
                        <p className="text-white text-sm md:text-base">{ad.title}</p>
                        <p className="text-[10px] md:text-xs text-emerald-500">${ad.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 md:p-8 text-slate-400 text-sm md:text-base">{ad.merchantName}</td>
                  <td className="p-6 md:p-8">
                    <span className="px-3 md:px-4 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[9px] md:text-[10px] font-black uppercase">
                      {ad.promotionType === 'network_home' ? 'شامل' : 'داخلي'}
                    </span>
                  </td>
                  <td className="p-6 md:p-8 text-center">
                    <div className="flex justify-center gap-2 md:gap-3">
                      <button onClick={() => handleAdjustViews(ad.id)} className="bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black hover:bg-white/10 transition-all">تعديل</button>
                      <button onClick={() => handleSuspendMerchant(ad.merchantId)} className="bg-red-600/10 text-red-500 border border-red-500/20 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black hover:bg-red-600 hover:text-white transition-all">حظر</button>
                      
                      {ad.promotionStatus === 'requested' && !ad.promotionPrice && (
                        <button 
                          onClick={() => {
                            const price = prompt('حدد سعر الترويج لهذا الإعلان ($):', '50');
                            if (price) {
                              setAdExchangeItems(prev => prev.map(a => a.id === ad.id ? { ...a, promotionPrice: parseFloat(price) } : a));
                              addNotification('تم تحديد السعر', `تم تحديد سعر الترويج لإعلان ${ad.title} بـ $${price}`, 'system');
                            }
                          }}
                          className="bg-sky-600 px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-sky-500 transition-all"
                        >
                          تسعير
                        </button>
                      )}

                      {ad.promotionStatus === 'pending_review' && (
                        <>
                          <button 
                            onClick={() => handleAdminApprovePromotion(ad)}
                            className="bg-emerald-600 px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-emerald-500 transition-all"
                          >
                            موافقة
                          </button>
                          <button 
                            onClick={() => handleAdminRejectPromotion(ad)}
                            className="bg-red-600/10 text-red-500 border border-red-500/20 px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-red-600 hover:text-white transition-all"
                          >
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAds.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 md:p-20 text-center opacity-30">
                    <div className="text-4xl md:text-6xl mb-4">✅</div>
                    <p className="font-black text-lg md:text-xl">لا توجد طلبات معلقة حالياً</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};
