
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from './i18n/i18n.tsx';
import { v4 as uuidv4 } from 'uuid';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import DeveloperDashboard from './components/DeveloperDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import MerchantDealCreator from './components/MerchantDealCreator';
import UserDashboard from './components/UserDashboard';
import { Role, User, SiteConfig, LandingService, Transaction, Notification, CustomPage, SalaryFinancing, TradeAsset, WithdrawalRequest, TradeOrder, RechargeCard, RaffleEntry, RaffleWinner, FixedDeposit, AdExchangeItem, AdNegotiation, VerificationRequest } from './types';
import { supabaseService } from './supabaseService';
import { isSupabaseConfigured } from './supabaseClient';


const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('home');
  const { t, language } = useI18n();
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' || language === 'ku' ? 'rtl' : 'ltr';
  }, [language]);

  const professionalLogo = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3MDAgMTYwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwZWE1ZTkiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzM4YmRmOCIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8Y2xpcFBhdGggaWQ9ImNsaXAiPgogICAgICA8cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgcng9IjUwIiAvPgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAsIDEwKSI+CiAgICA8cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgcng9IjUwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPgogICAgPHBhdGggZD0iTTAgMCBMMTQwIDAgTDE0MCAxNDAgWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMDgiIGNsaXAtcGF0aD0idXJsKCNjbGlwKSIgLz4KICAgIDxwYXRoIGQ9Ik03NSAzMCBMNDAgOTAgTDcwIDkwIEw1NSA1NSBMOTAgNTUgTDY1IDEyNSBaIiBmaWxsPSJ3aGl0ZSIgLz4KICAgIDxjaXJjbGUgY3g9IjExNSIgY3k9IjQwIiByPSIxMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMTUiIC8+CiAgPC9nPgogIDx0ZXh0IHg9IjE4MCIgeT0iMTA1IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9ImZvbnQtZmFtaWx5OiAnVGFqYXdhbCcsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7IGZvbnQtc2l6ZTogMTAwcHg7IGxldHRlci1zcGFjaW5nOiAtNXB4OyI+RmFzdFBheTwvdGV4dD4KICA8dGV4dCB4PSIxODUiIHk9IjE0NSIgZmlsbD0iIzM4YmRmOCIgc3R5bGU9ImZvbnQtZmFtaWx5OiAnVGFqYXdhbCcsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA4MDA7IGZvbnQtc2l6ZTogMjRweDsgbGV0dGVyLXNwYWNpbmc6IDIwcHg7Ij5ORVRXT1JLPC90ZXh0Pgo8L3N2Zz4=`;

  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    logoUrl: professionalLogo,
    logoWidth: 180,
    logoPosition: 'right',
    networkBalance: 4250000, 
    primaryColor: '#0f172a',
    secondaryColor: '#3b82f6',
    siteName: 'FastPay Network',
    template: 'ultra-premium',
    heroTitle: t('hero_title'),
    heroSubtitle: t('hero_subtitle'),
    heroCtaText: t('hero_cta_text'),
    salesCtaText: t('sales_cta_text'),
    servicesTitle: t('services_title'),
    servicesSubtitle: t('services_subtitle'),
    galleryTitle: t('gallery_title'),
    footerAbout: t('footer_about'),
    contactEmail: 'elite@fastpay-network.com',
    contactPhone: '+966 9200 12345',
    contactAddress: t('contact_address'),
    footerLinksTitle: t('footer_links_title'),
    footerLink1Text: t('footer_link1_text'),
    footerLink2Text: t('footer_link2_text'),
    footerLink3Text: t('footer_link3_text'),
    footerLink4Text: t('footer_link4_text'),
    contactSectionTitle: t('contact_section_title'),
    galleryImages: [],
    merchantFeeType: 'percent',
    merchantFeeValue: 0.8,
    userFeeType: 'fixed',
    userFeeValue: 0.5,
    depositPlans: [
      { id: '1', name: t('deposit_plan1_name'), rate: 8.5, durationMonths: 4, minAmount: 1000 },
      { id: '2', name: t('deposit_plan2_name'), rate: 18, durationMonths: 8, minAmount: 5000 },
      { id: '3', name: t('deposit_plan3_name'), rate: 35, durationMonths: 12, minAmount: 25000 }
    ],
    ads: [],
    salaryAdTitle: t('salary_ad_title'),
    salaryAdDesc: t('salary_ad_desc'),
    salaryAdImage: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1470&auto=format&fit=crop',
    tradingAdTitle: t('trading_ad_title'),
    tradingAdDesc: t('trading_ad_desc'),
    tradingAdImage: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2000&auto=format&fit=crop',
    raffleAdTitle: t('raffle_ad_title'),
    raffleAdDesc: t('raffle_ad_desc'),
    raffleAdImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470&auto=format&fit=crop',
    transferAdTitle: t('transfer_ad_title'),
    transferAdDesc: t('transfer_ad_desc'),
    transferAdImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1470&auto=format&fit=crop',
    gatewayAdTitle: t('gateway_ad_title'),
    gatewayAdDesc: t('gateway_ad_desc'),
    gatewayAdImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1470&auto=format&fit=crop',
    raffleEntryCost: 100,
    rafflePrizeType: t('raffle_prize_type'),
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
  const [adExchangeItems, setAdExchangeItems] = useState<AdExchangeItem[]>([]);
  const [adNegotiations, setAdNegotiations] = useState<AdNegotiation[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salaryPlans, setSalaryPlans] = useState<SalaryFinancing[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [accounts, setAccounts] = useState<User[]>([
    { id: 'admin-id-001', username: 'admin', fullName: 'مدير العمليات التنفيذي', email: 'admin@fastpay.com', password: 'ubnt', role: 'DEVELOPER', balance: 0, status: 'active', createdAt: '2023-01-01', linkedCards: [], assets: [] },
  ]);
  const [services, setServices] = useState<LandingService[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isInitialLoad = React.useRef(true);

  // Safety check for localStorage quota
  useEffect(() => {
    const checkQuota = () => {
      try {
        const total = JSON.stringify(localStorage).length;
        const quotaLimit = 4.5 * 1024 * 1024; // ~4.5MB safety limit
        if (total > quotaLimit) {
          console.warn("LocalStorage quota near limit, clearing non-essential data");
          // Clear specific keys that might be flooding
          const keysToClear = ['fp_v21_trade_orders', 'fp_v21_recharge_cards', 'fp_v21_raffle_entries', 'fp_v21_raffle_winners'];
          keysToClear.forEach(key => localStorage.removeItem(key));
        }
      } catch (e) {
        console.error("Quota check failed", e);
      }
    };
    checkQuota();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          dbConfig,
          dbUsers,
          dbTrans,
          dbNotifs,
          dbAds,
          dbOffers,
          dbWithdrawals,
          dbSalary,
          dbDeposits,
          dbVerifications,
          dbCards,
          dbRaffleEntries,
          dbRaffleWinners,
          dbTradeOrders,
          dbTradeAssets,
          dbServices,
          dbPages
        ] = await Promise.all([
          supabaseService.getSiteConfig(),
          supabaseService.getUsers(),
          supabaseService.getTransactions(),
          supabaseService.getNotifications(),
          supabaseService.getAdItems(),
          supabaseService.getAdNegotiations(),
          supabaseService.getWithdrawals(),
          supabaseService.getSalaryFinancing(),
          supabaseService.getFixedDeposits(),
          supabaseService.getVerifications(),
          supabaseService.getRechargeCards(),
          supabaseService.getRaffleEntries(),
          supabaseService.getRaffleWinners(),
          supabaseService.getTradeOrders(),
          supabaseService.getTradeAssets(),
          supabaseService.getLandingServices(),
          supabaseService.getCustomPages()
        ]);

        if (dbConfig) {
          setSiteConfig(dbConfig);
        }
        if (dbUsers.length > 0) setAccounts(dbUsers);
        if (dbTrans.length > 0) setTransactions(dbTrans);
        if (dbNotifs.length > 0) setNotifications(dbNotifs);
        if (dbAds.length > 0) setAdExchangeItems(dbAds);
        if (dbOffers.length > 0) setAdNegotiations(dbOffers);
        if (dbWithdrawals.length > 0) setWithdrawalRequests(dbWithdrawals);
        if (dbSalary.length > 0) setSalaryPlans(dbSalary);
        if (dbDeposits.length > 0) setFixedDeposits(dbDeposits);
        if (dbVerifications.length > 0) setVerificationRequests(dbVerifications);
        if (dbCards.length > 0) setRechargeCards(dbCards);
        if (dbRaffleEntries.length > 0) setRaffleEntries(dbRaffleEntries);
        if (dbRaffleWinners.length > 0) setRaffleWinners(dbRaffleWinners);
        if (dbTradeOrders.length > 0) setTradeOrders(dbTradeOrders);
        if (dbTradeAssets.length > 0) setTradeAssets(dbTradeAssets);
        if (dbServices.length > 0) setServices(dbServices);
        if (dbPages.length > 0) setPages(dbPages);

        // Fallback to localStorage for others or if DB is empty
        const storedOrders = localStorage.getItem('fp_v21_trade_orders');
        if (storedOrders) setTradeOrders(JSON.parse(storedOrders));
        const storedCards = localStorage.getItem('fp_v21_recharge_cards');
        if (storedCards) setRechargeCards(JSON.parse(storedCards));
        const storedRaffleEntries = localStorage.getItem('fp_v21_raffle_entries');
        if (storedRaffleEntries) setRaffleEntries(JSON.parse(storedRaffleEntries));
        const storedRaffleWinners = localStorage.getItem('fp_v21_raffle_winners');
        if (storedRaffleWinners) setRaffleWinners(JSON.parse(storedRaffleWinners));
        
        isInitialLoad.current = false;
      } catch (e) { 
        console.error("Supabase load error, falling back to local", e);
        isInitialLoad.current = false;
      }
    };
    loadData();
  }, []);

  // Sync to Supabase on changes
  useEffect(() => { 
    if (isSupabaseConfigured && !isInitialLoad.current) {
      supabaseService.updateSiteConfig(siteConfig).catch(err => {
        console.error("Site config sync error:", err);
      }); 
    }
  }, [siteConfig]);

  // Generic Sync Effect for Arrays
  const useSyncEffect = (data: any[], syncFn: (item: any) => Promise<void>, label: string, bulkSync?: (items: any[]) => Promise<void>) => {
    const prevData = React.useRef(JSON.stringify(data));
    useEffect(() => {
      if (isSupabaseConfigured && !isInitialLoad.current) {
        const currentData = JSON.stringify(data);
        if (currentData !== prevData.current) {
          // Data changed, sync it
          if (bulkSync) {
            bulkSync(data).catch(e => console.error(`Bulk Sync ${label} error:`, e));
          } else {
            // Fallback to syncing individual items if they are new or updated
            // For simplicity in this demo, we sync the first few items
            data.slice(0, 5).forEach(item => syncFn(item).catch(e => console.error(`Sync ${label} error:`, e)));
          }
          prevData.current = currentData;
        }
      }
    }, [data]);
  };

  useSyncEffect(transactions, supabaseService.addTransaction, 'Transaction', supabaseService.bulkUpsertTransactions);
  useSyncEffect(notifications, supabaseService.addNotification, 'Notification', supabaseService.bulkUpsertNotifications);
  useSyncEffect(adExchangeItems, supabaseService.upsertAdItem, 'AdItem', supabaseService.bulkUpsertAdItems);
  useSyncEffect(adNegotiations, supabaseService.upsertAdNegotiation, 'AdNegotiation');
  useSyncEffect(withdrawalRequests, supabaseService.upsertWithdrawal, 'Withdrawal');
  useSyncEffect(salaryPlans, supabaseService.upsertSalaryFinancing, 'Salary');
  useSyncEffect(fixedDeposits, supabaseService.upsertFixedDeposit, 'Deposit');
  useSyncEffect(verificationRequests, supabaseService.upsertVerification, 'Verification');
  useSyncEffect(rechargeCards, supabaseService.upsertRechargeCard, 'Card');
  useSyncEffect(raffleEntries, supabaseService.upsertRaffleEntry, 'RaffleEntry');
  useSyncEffect(raffleWinners, supabaseService.upsertRaffleWinner, 'RaffleWinner');
  useSyncEffect(tradeOrders, supabaseService.upsertTradeOrder, 'TradeOrder');
  useSyncEffect(tradeAssets, supabaseService.upsertTradeAsset, 'TradeAsset');
  useSyncEffect(services, supabaseService.upsertLandingService, 'Service');
  useSyncEffect(pages, supabaseService.upsertCustomPage, 'Page');

  const syncUser = useCallback(async (user: User) => {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.updateUser(user);
      } catch (e: any) {
        console.error("Failed to sync user to Supabase", e);
        alert(t('supabaseSyncError', { message: e.message || t('unknownError') }));
      }
    }
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedUser.id ? updatedUser : acc));
    syncUser(updatedUser);
  };

  const handleAddUser = (newUser: User) => {
    setAccounts(prev => [...prev, newUser]);
    syncUser(newUser);
  };

  const currentUser = useMemo(() => accounts.find(acc => acc.id === currentUserId) || null, [accounts, currentUserId]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type'], targetUserId?: string) => {
    const newNotify: Notification = {
      id: uuidv4(),
      userId: targetUserId || currentUserId || '',
      title, message, type, timestamp: new Date().toLocaleTimeString(currentUser?.language || 'en-US'), isRead: false
    };
    setNotifications(prev => [newNotify, ...prev]);
  }, [currentUserId]);

  const commonProps = { 
    user: currentUser!, onLogout: () => setCurrentUserId(null), siteConfig, onUpdateConfig: setSiteConfig, 
    accounts, setAccounts, transactions, setTransactions, 
    addNotification, salaryPlans, setSalaryPlans, onUpdateUser: handleUpdateUser, onAddUser: handleAddUser,
    services, setServices, pages, setPages, notifications, setNotifications,
    tradeAssets, setTradeAssets, tradeOrders, setTradeOrders,
    withdrawalRequests, setWithdrawalRequests,
    rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries, raffleWinners, setRaffleWinners,
    fixedDeposits, setFixedDeposits, verificationRequests, setVerificationRequests,
    adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations
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
    <div className="min-h-screen relative">
      {!isSupabaseConfigured && (
        <div className="fixed bottom-6 right-6 z-[2000] bg-red-600/90 backdrop-blur-xl text-white p-6 rounded-2xl shadow-2xl border border-white/10 max-w-sm animate-in slide-in-from-right duration-500">
          <h4 className="font-black text-sm mb-2">{t('supabaseDisconnectedTitle')}</h4>
          <p className="text-[10px] font-bold opacity-80 leading-relaxed">
            {t('supabaseDisconnectedMessage')}
          </p>
        </div>
      )}
      {/* Notification Toasts */}
      <div className="fixed top-6 left-6 z-[1000] flex flex-col gap-4 pointer-events-none">
        {notifications.filter(n => n.userId === currentUserId && !n.isRead).slice(0, 5).map((n) => (
          <div key={n.id} className="pointer-events-auto bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-left duration-500 max-w-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-black text-sky-400 text-sm">{n.title}</h4>
              <button onClick={() => setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif))} className="text-white/40 hover:text-white transition-colors">{t('closeButton')}</button>
            </div>
            <p className="text-xs text-white/80 font-bold leading-relaxed">{n.message}</p>
            <p className="text-[8px] text-white/40 mt-3 font-mono">{n.timestamp}</p>
          </div>
        ))}
      </div>

      <LandingPage siteConfig={siteConfig} services={services} pages={pages} currentPath={currentPath} setCurrentPath={setCurrentPath} onLoginClick={() => setIsLoginModalOpen(true)} onRegisterClick={() => setIsRegisterModalOpen(true)} user={null} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={(u) => { setCurrentUserId(u.id); setIsLoginModalOpen(false); }} accounts={accounts} onSwitchToRegister={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }} />}
      {isRegisterModalOpen && <RegisterModal onClose={() => setIsRegisterModalOpen(false)} accounts={accounts} onRegister={(u) => { handleAddUser(u); setCurrentUserId(u.id); setIsRegisterModalOpen(false); }} onSwitchToLogin={() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }} />}

    </div>
  );
};

export default App;
