
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Plus, 
  X, 
  ArrowRight,
  Lock,
  Eye,
  ShoppingBag,
  History,
  User as UserIcon,
  Bell
} from 'lucide-react';
import { User, MarketplaceAd, NegotiationOffer, Notification, Transaction } from '../types';
import CryptoJS from 'crypto-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  user: User;
  ads: MarketplaceAd[];
  setAds: React.Dispatch<React.SetStateAction<MarketplaceAd[]>>;
  onUpdateUser: (updatedUser: User) => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  isAdmin?: boolean;
}

const FPNMarketplace: React.FC<Props> = ({ 
  user, 
  ads, 
  setAds, 
  onUpdateUser, 
  addNotification,
  setTransactions,
  accounts,
  setAccounts,
  isAdmin = false
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-ads' | 'post' | 'admin'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedAd, setSelectedAd] = useState<MarketplaceAd | null>(null);
  const [negotiationAmount, setNegotiationAmount] = useState('');
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [flowTimer, setFlowTimer] = useState(50);
  const [flowAd, setFlowAd] = useState<MarketplaceAd | null>(null);
  const [flowOffer, setFlowOffer] = useState<NegotiationOffer | null>(null);
  const [isUploadingShipping, setIsUploadingShipping] = useState<string | null>(null);
  const [shippingDoc, setShippingDoc] = useState('');

  // Form State
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    price: '',
    isNegotiable: false
  });

  // Anti-Leakage Logic
  const antiLeakageCheck = (text: string) => {
    const phoneRegex = /(\+?\d{1,4}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const usernameRegex = /@[a-zA-Z0-9_]+/g;
    
    return phoneRegex.test(text) || emailRegex.test(text) || usernameRegex.test(text);
  };

  const handlePostAd = () => {
    if (!newAd.title || !newAd.description || !newAd.price) {
      addNotification('خطأ', 'يرجى ملء جميع الحقول', 'system');
      return;
    }

    const ad: MarketplaceAd = {
      id: Math.random().toString(36).substr(2, 9),
      sellerId: user.id,
      sellerName: user.username,
      title: newAd.title,
      description: newAd.description,
      price: parseFloat(newAd.price),
      isNegotiable: newAd.isNegotiable,
      status: antiLeakageCheck(newAd.title) || antiLeakageCheck(newAd.description) ? 'blocked' : 'active',
      createdAt: new Date().toISOString(),
      offers: []
    };

    if (ad.status === 'blocked') {
      // Suspend account and block ad
      const updatedUser: User = { 
        ...user, 
        status: 'suspended', 
        statusReason: 'انتهاك سياسة حماية البيانات (Anti-Leakage): محاولة تسريب بيانات اتصال.' 
      };
      onUpdateUser(updatedUser);
      setAds(prev => [ad, ...prev]);
      addNotification('تم تعليق الحساب', 'تم اكتشاف محاولة تسريب بيانات اتصال. تم حظر الإعلان وحسابك آلياً.', 'security');
      setActiveTab('browse');
      return;
    }

    setAds(prev => [ad, ...prev]);
    setNewAd({ title: '', description: '', price: '', isNegotiable: false });
    setActiveTab('my-ads');
    addNotification('نجاح', 'تم نشر الإعلان بنجاح', 'system');
  };

  const handleMakeOffer = (ad: MarketplaceAd) => {
    const amount = parseFloat(negotiationAmount);
    if (isNaN(amount) || amount <= 0) {
      addNotification('خطأ', 'يرجى إدخال مبلغ صحيح', 'system');
      return;
    }

    const offer: NegotiationOffer = {
      id: Math.random().toString(36).substr(2, 9),
      buyerId: user.id,
      buyerName: user.username,
      amount: amount,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setAds(prev => prev.map(a => {
      if (a.id === ad.id) {
        return { ...a, offers: [...a.offers, offer] };
      }
      return a;
    }));

    setNegotiationAmount('');
    setSelectedAd(null);
    addNotification('تم إرسال العرض', `تم إرسال عرضك بقيمة ${amount} FPN للتاجر.`, 'user');
    
    // Simulate notification for the seller if they are in the same session (demo purpose)
    const seller = accounts.find(u => u.id === ad.sellerId);
    if (seller && seller.id === user.id) {
       addNotification('تنبيه البورصة', `لديك عرض جديد بقيمة ${amount} FPN على إعلانك: ${ad.title}`, 'user');
    }
  };

  const handleAcceptOffer = (ad: MarketplaceAd, offer: NegotiationOffer) => {
    setAds(prev => prev.map(a => {
      if (a.id === ad.id) {
        return { 
          ...a, 
          price: offer.amount, 
          offers: a.offers.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : { ...o, status: 'rejected' })
        };
      }
      return a;
    }));
    addNotification('تم قبول العرض', `تم تحديث سعر الإعلان إلى ${offer.amount} FPN.`, 'money');
  };

  const handleUploadShipping = (ad: MarketplaceAd) => {
    if (!shippingDoc) {
      addNotification('خطأ', 'يرجى إدخال رقم تتبع الشحن أو تفاصيل المستند', 'system');
      return;
    }

    // 1. Update Ad Status
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'completed' } : a));

    // 2. Release funds to merchant
    const finalPrice = ad.price;
    setAccounts(prev => prev.map(acc => {
      if (acc.id === ad.sellerId) {
        return { ...acc, balance: acc.balance + finalPrice };
      }
      return acc;
    }));

    // If we are the merchant, update our local user state too
    if (ad.sellerId === user.id) {
      onUpdateUser({ ...user, balance: user.balance + finalPrice });
    }

    // 3. Create transaction for merchant
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: ad.sellerId,
      type: 'receive',
      amount: finalPrice,
      timestamp: new Date().toISOString(),
      status: 'completed',
      notes: `استلام ثمن إعلان: ${ad.title} (مستند شحن: ${shippingDoc})`,
      relatedId: ad.id
    };
    setTransactions(prev => [transaction, ...prev]);

    setIsUploadingShipping(null);
    setShippingDoc('');
    addNotification('تم شحن الطلب', `تم رفع مستند الشحن وتحويل مبلغ ${finalPrice} FPN إلى محفظتك.`, 'money');
  };

  const handleUnblockAd = (adId: string) => {
    setAds(prev => prev.map(a => a.id === adId ? { ...a, status: 'active' } : a));
    addNotification('تم فك الحظر', 'تمت إعادة تفعيل الإعلان بنجاح.', 'system');
  };

  const handleUnblockUser = (userId: string) => {
    setAccounts(prev => prev.map(acc => acc.id === userId ? { ...acc, status: 'active' } : acc));
    addNotification('تم فك حظر المستخدم', 'تمت إعادة تفعيل حساب المستخدم بنجاح.', 'security');
  };

  const startFPNFlow = (ad: MarketplaceAd, offer?: NegotiationOffer) => {
    const finalPrice = offer ? offer.amount : ad.price;
    
    if (user.balance < finalPrice) {
      addNotification('رصيد غير كافٍ', 'عذراً، رصيدك الحالي لا يغطي قيمة هذه العملية.', 'money');
      return;
    }

    setFlowAd(ad);
    setFlowOffer(offer || null);
    setIsFlowActive(true);
    setFlowTimer(50);
  };

  useEffect(() => {
    let interval: any;
    if (isFlowActive && flowTimer > 0) {
      interval = setInterval(() => {
        setFlowTimer(prev => prev - 1);
      }, 1000);
    } else if (isFlowActive && flowTimer === 0) {
      completeFPNFlow();
    }
    return () => clearInterval(interval);
  }, [isFlowActive, flowTimer]);

  const completeFPNFlow = () => {
    if (!flowAd) return;
    const finalPrice = flowOffer ? flowOffer.amount : flowAd.price;

    // Deduct balance
    const updatedUser: User = { ...user, balance: user.balance - finalPrice };
    onUpdateUser(updatedUser);

    // Create transaction
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'trade_buy',
      amount: finalPrice,
      timestamp: new Date().toISOString(),
      status: 'escrow',
      notes: `شراء إعلان: ${flowAd.title} (نظام الاعتماد المستندي FPN)`,
      relatedId: flowAd.id
    };
    setTransactions(prev => [transaction, ...prev]);

    // Update ad status
    setAds(prev => prev.map(a => a.id === flowAd.id ? { ...a, status: 'sold' } : a));

    setIsFlowActive(false);
    setFlowAd(null);
    setFlowOffer(null);
    addNotification('تم تأمين المبلغ', 'تم حجز المبلغ في نظام الاعتماد المستندي FPN بنجاح.', 'money');
  };

  const filteredAds = useMemo(() => {
    return ads.filter(ad => 
      ad.status === 'active' && 
      (ad.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       ad.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [ads, searchQuery]);

  const myAds = useMemo(() => {
    return ads.filter(ad => ad.sellerId === user.id);
  }, [ads, user.id]);

  // AES-256 Simulation for display
  const encryptedSession = useMemo(() => {
    const raw = `SESSION_${user.id}_${new Date().getTime()}`;
    return CryptoJS.AES.encrypt(raw, 'FPN-SECRET-KEY-2026').toString().substring(0, 32) + "...";
  }, [user.id]);

  if (user.status === 'suspended') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-3xl border border-red-500/30 text-center">
        <AlertTriangle className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">تم تعليق الحساب</h2>
        <p className="text-slate-400 max-w-md mb-8">
          {user.statusReason || 'تم تعليق حسابك لمراجعة الأنشطة الأخيرة.'}
        </p>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          يرجى التواصل مع الإدارة لفك الحظر.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-emerald-500 w-8 h-8" />
            بورصة FPN المالية المتكاملة
          </h1>
          <p className="text-slate-400 text-sm mt-1">نظام تداول آمن مشفر ببروتوكول AES-256</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500/70">
            <Lock className="w-3 h-3" />
            {encryptedSession}
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {user.balance.toLocaleString()} <span className="text-sm font-normal text-slate-500">FPN</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-950 rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'browse' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
          )}
        >
          <Search className="w-4 h-4" />
          تصفح السوق
        </button>
        <button
          onClick={() => setActiveTab('my-ads')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'my-ads' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          إعلاناتي
        </button>
        <button
          onClick={() => setActiveTab('post')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'post' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
          )}
        >
          <Plus className="w-4 h-4" />
          نشر إعلان
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'admin' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Shield className="w-4 h-4" />
            إدارة البورصة (مدير)
          </button>
        )}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث عن سلع، معادن، أو أصول..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map(ad => (
                <motion.div
                  layoutId={ad.id}
                  key={ad.id}
                  className="group bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                      <ShoppingBag className="w-6 h-6 text-emerald-500" />
                    </div>
                    {ad.isNegotiable && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg border border-amber-500/20">
                        قابل للتفاوض
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{ad.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6 flex-grow">{ad.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                    <div className="text-2xl font-bold text-white">
                      {ad.price.toLocaleString()} <span className="text-xs text-slate-500">FPN</span>
                    </div>
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="bg-white text-black px-5 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      تفاصيل
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    التاجر: {ad.sellerName}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'my-ads' && (
          <motion.div
            key="my-ads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {myAds.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-dashed border-white/10">
                <p className="text-slate-500">ليس لديك أي إعلانات نشطة حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myAds.map(ad => (
                  <div key={ad.id} className="bg-slate-900/80 border border-white/5 rounded-3xl p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{ad.title}</h3>
                          <span className={cn(
                            "text-[10px] px-2 py-1 rounded-lg font-bold border",
                            ad.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                            ad.status === 'sold' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          )}>
                            {ad.status === 'active' ? 'نشط' : ad.status === 'sold' ? 'بانتظار الشحن' : 'مكتمل'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">{ad.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-white">
                            {ad.price.toLocaleString()} <span className="text-sm font-normal text-slate-500">FPN</span>
                          </div>
                          {ad.status === 'sold' && (
                            <button
                              onClick={() => setIsUploadingShipping(ad.id)}
                              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                            >
                              <Plus className="w-3 h-3" />
                              رفع مستند الشحن
                            </button>
                          )}
                        </div>

                        {isUploadingShipping === ad.id && (
                          <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 animate-in slide-in-from-top duration-300">
                            <label className="block text-xs font-bold text-emerald-500 mb-2">رقم تتبع الشحن / تفاصيل المستند</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={shippingDoc}
                                onChange={(e) => setShippingDoc(e.target.value)}
                                placeholder="مثال: DHL-9420-X..."
                                className="flex-grow bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                onClick={() => handleUploadShipping(ad)}
                                className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600"
                              >
                                تأكيد
                              </button>
                              <button
                                onClick={() => setIsUploadingShipping(null)}
                                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full md:w-80 bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          عروض التفاوض ({ad.offers.length})
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {ad.offers.length === 0 ? (
                            <p className="text-xs text-slate-600 italic">لا توجد عروض حالياً</p>
                          ) : (
                            ad.offers.map(offer => (
                              <div key={offer.id} className="p-3 bg-slate-900 rounded-xl border border-white/5 flex justify-between items-center">
                                <div>
                                  <div className="text-xs font-bold text-white">{offer.buyerName}</div>
                                  <div className="text-lg font-bold text-emerald-400">{offer.amount.toLocaleString()}</div>
                                </div>
                                {offer.status === 'pending' ? (
                                  <button
                                    onClick={() => handleAcceptOffer(ad, offer)}
                                    className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-all"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className={cn(
                                    "text-[10px] font-bold",
                                    offer.status === 'accepted' ? "text-emerald-500" : "text-red-500"
                                  )}>
                                    {offer.status === 'accepted' ? 'مقبول' : 'مرفوض'}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'post' && (
          <motion.div
            key="post"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto bg-slate-900/80 border border-white/5 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Plus className="text-emerald-500" />
              نشر إعلان جديد في البورصة
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">عنوان الإعلان</label>
                <input
                  type="text"
                  placeholder="مثال: سبائك ذهب عيار 24"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">وصف السلعة / الأصل</label>
                <textarea
                  rows={4}
                  placeholder="اشرح تفاصيل السلعة، الجودة، والكمية..."
                  value={newAd.description}
                  onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">السعر (FPN)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAd.price}
                    onChange={(e) => setNewAd({ ...newAd, price: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex items-end pb-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newAd.isNegotiable}
                        onChange={(e) => setNewAd({ ...newAd, isNegotiable: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-12 h-6 rounded-full transition-all border border-white/10",
                        newAd.isNegotiable ? "bg-emerald-500" : "bg-slate-800"
                      )} />
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all",
                        newAd.isNegotiable ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-all">قابل للتفاوض</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <Shield className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  تنبيه: نظام Anti-Leakage يقوم بفحص الإعلان آلياً. أي محاولة لوضع أرقام هواتف، إيميلات، أو حسابات تواصل اجتماعي ستؤدي لحظر الإعلان وتعليق حسابك فوراً.
                </p>
              </div>

              <button
                onClick={handlePostAd}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
              >
                تأكيد ونشر الإعلان
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-white/5">
                <h3 className="text-xl font-bold text-white">الإعلانات المحظورة (Anti-Leakage)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="p-6">الإعلان</th>
                      <th className="p-6">التاجر</th>
                      <th className="p-6">السبب</th>
                      <th className="p-6 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ads.filter(a => a.status === 'blocked').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-600 italic">لا توجد إعلانات محظورة حالياً.</td>
                      </tr>
                    ) : (
                      ads.filter(a => a.status === 'blocked').map(ad => (
                        <tr key={ad.id} className="hover:bg-white/5 transition-all">
                          <td className="p-6">
                            <div className="font-bold text-white">{ad.title}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">{ad.description}</div>
                          </td>
                          <td className="p-6 text-slate-400">{ad.sellerName}</td>
                          <td className="p-6">
                            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-lg border border-red-400/20">تسريب بيانات</span>
                          </td>
                          <td className="p-6 text-center">
                            <button
                              onClick={() => handleUnblockAd(ad.id)}
                              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                            >
                              فك الحظر
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-white/5">
                <h3 className="text-xl font-bold text-white">المستخدمون المعلقون</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="p-6">المستخدم</th>
                      <th className="p-6">السبب</th>
                      <th className="p-6 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {accounts.filter(u => u.status === 'suspended').length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-12 text-center text-slate-600 italic">لا يوجد مستخدمون معلقون حالياً.</td>
                      </tr>
                    ) : (
                      accounts.filter(u => u.status === 'suspended').map(acc => (
                        <tr key={acc.id} className="hover:bg-white/5 transition-all">
                          <td className="p-6">
                            <div className="font-bold text-white">{acc.fullName}</div>
                            <div className="text-xs text-slate-500">@{acc.username}</div>
                          </td>
                          <td className="p-6 text-xs text-slate-400 max-w-xs">{acc.statusReason}</td>
                          <td className="p-6 text-center">
                            <button
                              onClick={() => handleUnblockUser(acc.id)}
                              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                            >
                              فك الحظر
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Detail Modal */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-emerald-500/10 rounded-3xl">
                  <ShoppingBag className="w-8 h-8 text-emerald-500" />
                </div>
                <button onClick={() => setSelectedAd(null)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">{selectedAd.title}</h2>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                <UserIcon className="w-4 h-4" />
                بواسطة: {selectedAd.sellerName}
              </div>

              <p className="text-slate-300 leading-relaxed mb-8">{selectedAd.description}</p>

              <div className="bg-slate-950 rounded-3xl p-6 border border-white/5 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-400">السعر الحالي</span>
                  <div className="text-3xl font-bold text-white">
                    {selectedAd.price.toLocaleString()} <span className="text-sm font-normal text-slate-500">FPN</span>
                  </div>
                </div>

                {selectedAd.sellerId === user.id ? (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-center text-sm">
                    هذا إعلانك الخاص. يمكنك متابعة العروض من تبويب "إعلاناتي".
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedAd.isNegotiable && (
                      <div className="flex gap-3">
                        <input
                          type="number"
                          placeholder="ضع عرضك هنا..."
                          value={negotiationAmount}
                          onChange={(e) => setNegotiationAmount(e.target.value)}
                          className="flex-grow bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500/50"
                        />
                        <button
                          onClick={() => handleMakeOffer(selectedAd)}
                          className="bg-amber-500 text-black px-6 py-4 rounded-xl font-bold hover:bg-amber-600 transition-all"
                        >
                          تفاوض
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => startFPNFlow(selectedAd)}
                      className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-bold text-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                    >
                      <ShoppingBag className="w-6 h-6" />
                      شراء الآن
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-500 justify-center">
                <Shield className="w-4 h-4" />
                جميع العمليات محمية بنظام الاعتماد المستندي FPN
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* FPN Flow Modal */}
      {isFlowActive && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
            </div>

            <div className="relative z-10">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                <Lock className="w-10 h-10 text-emerald-500 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">بروتوكول FPN Flow نشط</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                جاري تأمين المبلغ في نظام الاعتماد المستندي FPN... يرجى عدم إغلاق الصفحة.
              </p>

              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray="283"
                    animate={{ strokeDashoffset: 283 - (283 * (50 - flowTimer)) / 50 }}
                    transition={{ duration: 1, ease: "linear" }}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-mono font-bold text-white">
                  {flowTimer}s
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-emerald-500/70 font-mono">ENCRYPTING_TRANSACTION_ID...</div>
                <div className="text-xs text-slate-600 font-mono">SECURE_CHANNEL_ESTABLISHED</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FPNMarketplace;
