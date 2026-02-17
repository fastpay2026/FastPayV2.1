
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import DeveloperDashboard from './components/DeveloperDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import UserDashboard from './components/UserDashboard';
import { Role, User, SiteConfig, LandingService, Transaction, Notification, CustomPage, SalaryFinancing, TradeAsset, WithdrawalRequest, TradeOrder, RechargeCard, RaffleEntry, RaffleWinner, FixedDeposit } from './types';

// إعداد عميل Supabase - سيتم جلب القيم من متغيرات البيئة عند الرفع
const SUPABASE_URL = (process.env.SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY as string) || '';
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('home');
  const [forcedRole, setForcedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const professionalLogo = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3MDAgMTYwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iaWNvbkdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMGVhNWU5IiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzYjgyZjYiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMCwgMTApIj4KICAgIDxwYXRoIGQ9Ik03MCAwIEM4MCAwIDE0MCAyMCAxNDAgNzAgQzE0MCAxMjAgNzAgMTQwIDcwIDE0MCBDNzAgMTQwIDAgMTIwIDAgNzAgQzAgMjAgNjAgMCA3MCAwIFoiIGZpbGw9InVybCgjaWNvbkdyYWQpIiAvPgogICAgPHBhdGggZD0iTTQwIDcwIEw3MCA3MCBMNjAgMTEwIEwxMDAgNjAgTDcwIDYwIEw4MCAyMCBaIiBmaWxsPSJ3aGl0ZSIgLz4KICAgIDxwYXRoIGQ9Ik0xMCA5MCBDMzAgNzAgNjAgOTAgOTAgNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjYiIC8+CiAgPC9nPgogIDx0ZXh0IHg9IjE4MCIgeT0iMTAwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IidUYWphd2FsJywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI5NCIgZm9udC13ZWlnaHQ9IjkwMCIgbGV0dGVyLXNwYWNpbmc9Ii00Ij5GYXN0UGF5PC90ZXh0PgogIDx0ZXh0IHg9IjE4NSIgeT0iMTQwIiBmaWxsPSIjMzhidGY4IiBmb250LWZhbWlseT0iJ1RhamF3YWwnLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI4IiBmb250LXdlaWdodD0iODAwIiBsZXR0ZXItc3BhY2luZz0iMjIiPk5FVFdPUks8L3RleHQ+Cjwvc3ZnPg==`;

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    logoUrl: professionalLogo,
    logoWidth: 180,
    logoPosition: 'right',
    networkBalance: 4250000, 
    primaryColor: '#0f172a',
    secondaryColor: '#3b82f6',
    siteName: 'FastPay Network',
    template: 'ultra-premium',
    heroTitle: 'السيادة المالية في عصر السرعة',
    heroSubtitle: 'بوابة FastPay Network لإدارة الأصول والتداول الفوري وحماية الثروات الرقمية بأعلى معايير الأمان العالمية.',
    heroCtaText: 'افتح حسابك الملكي',
    salesCtaText: 'تواصل مع الإدارة',
    servicesTitle: 'قوة المحرك المالي',
    servicesSubtitle: 'نستخدم بنية تحتية سحابية موزعة تضمن عدم التوقف أبداً.',
    galleryTitle: 'التميز العالمي',
    footerAbout: 'FastPay Network هي المعيار العالمي للمدفوعات الرقمية عالية الأمان، نجمع بين التكنولوجيا المتطورة والخدمات المالية المتميزة.',
    contactEmail: 'elite@fastpay-network.com',
    contactPhone: '+966 9200 12345',
    contactAddress: 'مركز التجارة العالمي، دبي - المملكة العربية السعودية',
    footerLinksTitle: 'المؤسسة',
    footerLink1Text: 'عن الشبكة',
    footerLink2Text: 'بوابة المطورين',
    footerLink3Text: 'السياسات الأمنية',
    footerLink4Text: 'الدعم التقني',
    contactSectionTitle: 'تواصل مباشر',
    galleryImages: [],
    merchantFeeType: 'percent',
    merchantFeeValue: 0.8,
    userFeeType: 'fixed',
    userFeeValue: 0.5,
    depositPlans: [
      { id: '1', name: 'الاستثمار الاستراتيجي', rate: 8.5, durationMonths: 4, minAmount: 1000 },
      { id: '2', name: 'الخطة البلاتينية', rate: 18, durationMonths: 8, minAmount: 5000 },
      { id: '3', name: 'صندوق النخبة الاحتياطي', rate: 35, durationMonths: 12, minAmount: 25000 }
    ],
    ads: [],
    salaryAdTitle: 'تمويل الرواتب الذكي',
    salaryAdDesc: 'أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع في كل انحاء العالم.',
    salaryAdImage: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1470&auto=format&fit=crop',
    tradingAdTitle: 'محرك التداول الاحترافي',
    tradingAdDesc: 'لا تنتظر السوق، بل كن أنت المحرك. منصتنا توفر لك وصولاً مباشراً للسيولة العالمية مع أدوات تحليل ذكية ومخططات بيانية فورية.',
    tradingAdImage: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2000&auto=format&fit=crop',
    raffleAdTitle: 'مهرجان جوائز FastPay Network: حلم الفخامة والروحانية',
    raffleAdDesc: 'استعد للربح الأكبر في مسيرتك! شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP شاملة لأقدس البقاع بضيافة ملكية كاملة.',
    raffleAdImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470&auto=format&fit=crop',
    transferAdTitle: 'جسر السيولة العالمي: Swift وفورية بلا حدود',
    transferAdDesc: 'أرسل واستقبل الأموال فورياً بين مستخدمي شبكة FastPay Network، أو قم بإدارة حوالاتك الدولية عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية التقليدية.',
    transferAdImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1470&auto=format&fit=crop',
    gatewayAdTitle: 'مستقبلك يبدأ بـ FastPay Checkout',
    gatewayAdDesc: 'حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة. بوابتنا توفر لك دمجاً برمجياً بضغطة زر، عمولات تنافسية تبدأ من 0.8%، وتسوية فورية للأرباح مع حماية سيبرانية شاملة تضمن استمرارية نمو أعمالك.',
    gatewayAdImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1470&auto=format&fit=crop',
    raffleEntryCost: 100,
    isTradingEnabled: true
  });

  const [tradeAssets, setTradeAssets] = useState<TradeAsset[]>([
    { id: '1', name: 'Bitcoin / USD', symbol: 'BINANCE:BTCUSDT', price: 96420, change24h: 2.4, type: 'crypto', icon: '₿', isFrozen: false, trendBias: 'neutral' },
    { id: '2', name: 'EUR / USD', symbol: 'FX:EURUSD', price: 1.0842, change24h: -0.15, type: 'crypto', icon: '🇪🇺', isFrozen: false, trendBias: 'neutral' },
    { id: '3', name: 'Gold / USD', symbol: 'OANDA:XAUUSD', price: 2425.40, change24h: 0.8, type: 'commodity', icon: '📀', isFrozen: false, trendBias: 'neutral' },
    { id: '4', name: 'GBP / USD', symbol: 'FX:GBPUSD', price: 1.2654, change24h: 0.12, type: 'crypto', icon: '🇬🇧', isFrozen: false, trendBias: 'neutral' },
    { id: '5', name: 'NVIDIA Corp', symbol: 'NASDAQ:NVDA', price: 1150.20, change24h: 3.4, type: 'stock', icon: '🟢', isFrozen: false, trendBias: 'neutral' },
  ]);

  const [tradeOrders, setTradeOrders] = useState<TradeOrder[]>([]);
  const [rechargeCards, setRechargeCards] = useState<RechargeCard[]>([]);
  const [raffleEntries, setRaffleEntries] = useState<RaffleEntry[]>([]);
  const [raffleWinners, setRaffleWinners] = useState<RaffleWinner[]>([]);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salaryPlans, setSalaryPlans] = useState<SalaryFinancing[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [accounts, setAccounts] = useState<User[]>([
    { id: '1', username: 'admin', fullName: 'مدير العمليات التنفيذي', email: 'admin@fastpay.com', password: 'Crazytownn@@201594ir', role: 'DEVELOPER', balance: 0, status: 'active', createdAt: '2023-01-01', linkedCards: [], assets: [] },
  ]);
  const [services, setServices] = useState<LandingService[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // مراقبة الرابط السري للإدارة
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/admin-gate') {
        setForcedRole('DEVELOPER');
        setIsLoginModalOpen(true);
      } else {
        setForcedRole(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // جلب كافة البيانات من Supabase عند التحميل
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      if (supabase) {
        try {
          // محاولة جلب الإعدادات (أو إنشاء أول صف إذا لم يوجد)
          const { data: config, error: configError } = await supabase.from('site_config').select('*').limit(1).single();
          if (config) setSiteConfig(prev => ({ ...prev, ...config }));
          else if (configError) {
             console.log("Initializing first config row...");
             await supabase.from('site_config').insert([{ id: 1, ...siteConfig }]);
          }

          const { data: accs } = await supabase.from('accounts').select('*');
          if (accs && accs.length > 0) setAccounts(accs);

          const { data: trans } = await supabase.from('transactions').select('*');
          if (trans) setTransactions(trans);

          const { data: servs } = await supabase.from('services').select('*');
          if (servs && servs.length > 0) setServices(servs);

          const { data: pgs } = await supabase.from('pages').select('*');
          if (pgs && pgs.length > 0) setPages(pgs);

          const { data: rCards } = await supabase.from('recharge_cards').select('*');
          if (rCards) setRechargeCards(rCards);

          const { data: wRequests } = await supabase.from('withdrawal_requests').select('*');
          if (wRequests) setWithdrawalRequests(wRequests);

          const { data: sPlans } = await supabase.from('salary_plans').select('*');
          if (sPlans) setSalaryPlans(sPlans);

        } catch (error) {
          console.warn("Supabase fetch failed, relying on defaults", error);
        }
      }
      setIsLoading(false);
    };
    fetchAllData();
  }, []);

  // دالة المزامنة السحابية (UPSERT)
  const syncToCloud = async (table: string, data: any, idField: string = 'id') => {
    if (!supabase) return;
    try {
      if (Array.isArray(data)) {
        // نستخدم upsert لضمان تحديث الصفوف الموجودة وإضافة الجديدة دون مسح الكل
        const { error } = await supabase.from(table).upsert(data, { onConflict: idField });
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).upsert({ id: 1, ...data }, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (e) {
      console.error(`Cloud Sync Error [${table}]:`, e);
    }
  };

  // مراقبي التغيير للحفظ التلقائي الفوري
  useEffect(() => { if (!isLoading) syncToCloud('site_config', siteConfig); }, [siteConfig, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('accounts', accounts); }, [accounts, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('transactions', transactions); }, [transactions, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('services', services); }, [services, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('pages', pages); }, [pages, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('recharge_cards', rechargeCards, 'code'); }, [rechargeCards, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('withdrawal_requests', withdrawalRequests); }, [withdrawalRequests, isLoading]);
  useEffect(() => { if (!isLoading) syncToCloud('salary_plans', salaryPlans); }, [salaryPlans, isLoading]);

  const currentUser = useMemo(() => accounts.find(acc => acc.id === currentUserId) || null, [accounts, currentUserId]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type']) => {
    const newNotify: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title, message, type, timestamp: new Date().toLocaleTimeString('ar-SA'), isRead: false
    };
    setNotifications(prev => [newNotify, ...prev]);
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedUser.id ? updatedUser : acc));
  };

  const commonProps = { 
    user: currentUser!, onLogout: () => { setCurrentUserId(null); window.location.hash = ""; }, siteConfig, onUpdateConfig: setSiteConfig, 
    accounts, setAccounts, transactions, setTransactions, 
    addNotification, salaryPlans, setSalaryPlans, onUpdateUser: handleUpdateUser, 
    services, setServices, pages, setPages, notifications, setNotifications,
    tradeAssets, setTradeAssets, tradeOrders, setTradeOrders,
    withdrawalRequests, setWithdrawalRequests,
    rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries, raffleWinners, setRaffleWinners,
    fixedDeposits, setFixedDeposits
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center space-y-8 z-[200]">
        <div className="w-24 h-24 border-t-4 border-sky-500 border-solid rounded-full animate-spin shadow-[0_0_50px_rgba(14,165,233,0.3)]"></div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">FastPay Global</h2>
          <p className="text-slate-500 text-sm animate-pulse tracking-[0.3em]">Connecting to Secure Cloud Nodes...</p>
        </div>
      </div>
    );
  }

  if (currentUser) {
    switch (currentUser.role) {
      case 'DEVELOPER': return <DeveloperDashboard {...commonProps} />;
      case 'MERCHANT': return <MerchantDashboard {...commonProps} />;
      case 'USER': return <UserDashboard {...commonProps} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-screen">
      <LandingPage siteConfig={siteConfig} services={services} pages={pages} currentPath={currentPath} setCurrentPath={setCurrentPath} onLoginClick={() => { setForcedRole(null); setIsLoginModalOpen(true); }} onRegisterClick={() => setIsRegisterModalOpen(true)} user={null} />
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => { setIsLoginModalOpen(false); window.location.hash = ""; }} 
          onLogin={(u) => { setCurrentUserId(u.id); setIsLoginModalOpen(false); }} 
          accounts={accounts} 
          forcedRole={forcedRole}
          onSwitchToRegister={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }} 
        />
      )}
      {isRegisterModalOpen && <RegisterModal onClose={() => setIsRegisterModalOpen(false)} accounts={accounts} onRegister={(u) => { setAccounts(p => [...p, u]); setCurrentUserId(u.id); setIsRegisterModalOpen(false); }} onSwitchToLogin={() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }} />}
    </div>
  );
};

export default App;
