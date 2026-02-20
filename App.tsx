
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import DeveloperDashboard from './components/DeveloperDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import MerchantDealCreator from './components/MerchantDealCreator';
import UserDashboard from './components/UserDashboard';
import { Role, User, SiteConfig, LandingService, Transaction, Notification, CustomPage, SalaryFinancing, TradeAsset, WithdrawalRequest, TradeOrder, RechargeCard, RaffleEntry, RaffleWinner, FixedDeposit } from './types';

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('home');
  
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
    raffleAdTitle: 'مهرجان جوائز النخبة: حلم الفخامة والروحانية',
    raffleAdDesc: 'استعد للربح الأكبر في مسيرتك! شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP شاملة لأقدس البقاع بضيافة ملكية كاملة.',
    raffleAdImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470&auto=format&fit=crop',
    transferAdTitle: 'جسر السيولة العالمي: Swift وفورية بلا حدود',
    transferAdDesc: 'أرسل واستقبل الأموال فورياً بين مستخدمي شبكة FastPay Network، أو قم بإدارة حوالاتك الدولية عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية التقليدية.',
    transferAdImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1470&auto=format&fit=crop',
    gatewayAdTitle: 'مستقبلك يبدأ بـ FastPay Checkout',
    gatewayAdDesc: 'حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة. بوابتنا توفر لك دمجاً برمجياً بضغطة زر، عمولات تنافسية تبدأ من 0.8%، وتسوية فورية للأرباح مع حماية سيبرانية شاملة تضمن استمرارية نمو أعمالك.',
    gatewayAdImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1470&auto=format&fit=crop',
    raffleEntryCost: 100,
    rafflePrizeType: 'سيارة بورش 911 GT3',
    showRaffleCountdown: true,
    raffleEndDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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
    { id: '1', username: 'admin', fullName: 'مدير العمليات التنفيذي', email: 'admin@fastpay.com', password: 'ubnt', role: 'DEVELOPER', balance: 0, status: 'active', createdAt: '2023-01-01', linkedCards: [], assets: [] },
  ]);
  const [services, setServices] = useState<LandingService[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadData = () => {
      try {
        const config = localStorage.getItem('fp_v21_config');
        if (config) setSiteConfig(prev => ({ ...prev, ...JSON.parse(config) }));
        const storedAccounts = localStorage.getItem('fp_v21_accounts');
        if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
        const storedTrans = localStorage.getItem('fp_v21_trans');
        if (storedTrans) setTransactions(JSON.parse(storedTrans));
        const storedSalary = localStorage.getItem('fp_v21_salary');
        if (storedSalary) setSalaryPlans(JSON.parse(storedSalary));
        const storedOrders = localStorage.getItem('fp_v21_trade_orders');
        if (storedOrders) setTradeOrders(JSON.parse(storedOrders));
        const storedWithdrawals = localStorage.getItem('fp_v21_withdrawals');
        if (storedWithdrawals) setWithdrawalRequests(JSON.parse(storedWithdrawals));
        const storedCards = localStorage.getItem('fp_v21_recharge_cards');
        if (storedCards) setRechargeCards(JSON.parse(storedCards));
        const storedRaffleEntries = localStorage.getItem('fp_v21_raffle_entries');
        if (storedRaffleEntries) setRaffleEntries(JSON.parse(storedRaffleEntries));
        const storedRaffleWinners = localStorage.getItem('fp_v21_raffle_winners');
        if (storedRaffleWinners) setRaffleWinners(JSON.parse(storedRaffleWinners));
        const storedFixedDeposits = localStorage.getItem('fp_v21_fixed_deposits');
        if (storedFixedDeposits) setFixedDeposits(JSON.parse(storedFixedDeposits));
      } catch (e) { console.error("Data load error", e); }
    };
    loadData();
  }, []);

  useEffect(() => localStorage.setItem('fp_v21_config', JSON.stringify(siteConfig)), [siteConfig]);
  useEffect(() => localStorage.setItem('fp_v21_accounts', JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem('fp_v21_trans', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('fp_v21_salary', JSON.stringify(salaryPlans)), [salaryPlans]);
  useEffect(() => localStorage.setItem('fp_v21_trade_orders', JSON.stringify(tradeOrders)), [tradeOrders]);
  useEffect(() => localStorage.setItem('fp_v21_withdrawals', JSON.stringify(withdrawalRequests)), [withdrawalRequests]);
  useEffect(() => localStorage.setItem('fp_v21_recharge_cards', JSON.stringify(rechargeCards)), [rechargeCards]);
  useEffect(() => localStorage.setItem('fp_v21_raffle_entries', JSON.stringify(raffleEntries)), [raffleEntries]);
  useEffect(() => localStorage.setItem('fp_v21_raffle_winners', JSON.stringify(raffleWinners)), [raffleWinners]);
  useEffect(() => localStorage.setItem('fp_v21_fixed_deposits', JSON.stringify(fixedDeposits)), [fixedDeposits]);

  const currentUser = useMemo(() => accounts.find(acc => acc.id === currentUserId) || null, [accounts, currentUserId]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type']) => {
    const newNotify: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title, message, type, timestamp: new Date().toLocaleTimeString('ar-SA'), isRead: false
    };
    setNotifications(prev => [newNotify, ...prev]);
  }, []);

  const handleUpdateUser = (updatedUser: User) => setAccounts(prev => prev.map(acc => acc.id === updatedUser.id ? updatedUser : acc));

  const commonProps = { 
    user: currentUser!, onLogout: () => setCurrentUserId(null), siteConfig, onUpdateConfig: setSiteConfig, 
    accounts, setAccounts, transactions, setTransactions, 
    addNotification, salaryPlans, setSalaryPlans, onUpdateUser: handleUpdateUser, 
    services, setServices, pages, setPages, notifications, setNotifications,
    tradeAssets, setTradeAssets, tradeOrders, setTradeOrders,
    withdrawalRequests, setWithdrawalRequests,
    rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries, raffleWinners, setRaffleWinners,
    fixedDeposits, setFixedDeposits
  };

  if (currentUser) {
    switch (currentUser.role) {
      case 'DEVELOPER': return <DeveloperDashboard {...commonProps} />;
      case 'DISTRIBUTOR': return <MerchantDashboard {...commonProps} />;
      case 'MERCHANT': return <MerchantDealCreator {...commonProps} />;
      case 'USER': return <UserDashboard {...commonProps} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-screen">
      <LandingPage siteConfig={siteConfig} services={services} pages={pages} currentPath={currentPath} setCurrentPath={setCurrentPath} onLoginClick={() => setIsLoginModalOpen(true)} onRegisterClick={() => setIsRegisterModalOpen(true)} user={null} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={(u) => { setCurrentUserId(u.id); setIsLoginModalOpen(false); }} accounts={accounts} onSwitchToRegister={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }} />}
      {isRegisterModalOpen && <RegisterModal onClose={() => setIsRegisterModalOpen(false)} accounts={accounts} onRegister={(u) => { setAccounts(p => [...p, u]); setCurrentUserId(u.id); setIsRegisterModalOpen(false); }} onSwitchToLogin={() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }} />}
    </div>
  );
};

export default App;
