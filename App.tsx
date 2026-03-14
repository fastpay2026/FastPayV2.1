
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useI18n } from './i18n/i18n.tsx';
import { v4 as uuidv4 } from 'uuid';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import DeveloperDashboard from './components/DeveloperDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import MerchantDealCreator from './components/MerchantDealCreator';
import UserDashboard from './components/UserDashboard';
import { NotificationProvider } from './components/NotificationContext';
import { Role, User, SiteConfig, LandingService, Transaction, Notification, CustomPage, SalaryFinancing, TradeAsset, WithdrawalRequest, TradeOrder, RechargeCard, RaffleEntry, RaffleWinner, FixedDeposit, AdExchangeItem, AdNegotiation, VerificationRequest } from './types';
import { supabaseService } from './supabaseService';
import { isSupabaseConfigured } from './supabaseClient';


const TradingPlatform = React.lazy(() => import('./src/pages/TradingPlatform/TradingPlatform'));

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem('fp_v21_current_user_id'));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('home');
  const { t, language } = useI18n();
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' || language === 'ku' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('fp_v21_current_user_id', currentUserId);
    } else {
      localStorage.removeItem('fp_v21_current_user_id');
    }
  }, [currentUserId]);

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
    heroTitle: 'hero_title',
    heroSubtitle: 'hero_subtitle',
    heroCtaText: 'hero_cta_text',
    salesCtaText: 'sales_cta_text',
    servicesTitle: 'services_title',
    servicesSubtitle: 'services_subtitle',
    galleryTitle: 'gallery_title',
    footerAbout: 'footer_about',
    contactEmail: 'elite@fastpay-network.com',
    contactPhone: '+966 9200 12345',
    contactAddress: 'contact_address',
    footerLinksTitle: 'footer_links_title',
    footerLink1Text: 'footer_link_1',
    footerLink2Text: 'footer_link_2',
    footerLink3Text: 'footer_link_3',
    footerLink4Text: 'footer_link_4',
    contactSectionTitle: 'contact_section_title',
    galleryImages: [],
    merchantFeeType: 'percent',
    merchantFeeValue: 0.8,
    userFeeType: 'fixed',
    userFeeValue: 0.5,
    depositPlans: [
      { id: '1', name: 'deposit_plan1_name', rate: 8.5, durationMonths: 4, minAmount: 1000 },
      { id: '2', name: 'deposit_plan2_name', rate: 18, durationMonths: 8, minAmount: 5000 },
      { id: '3', name: 'deposit_plan3_name', rate: 35, durationMonths: 12, minAmount: 25000 }
    ],
    ads: [],
    salaryAdTitle: 'salary_ad_title',
    salaryAdDesc: 'salary_ad_desc',
    salaryAdImage: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1470&auto=format&fit=crop',
    tradingAdTitle: 'trading_ad_title',
    tradingAdDesc: 'trading_ad_desc',
    tradingAdImage: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2000&auto=format&fit=crop',
    raffleAdTitle: 'raffle_ad_title',
    raffleAdDesc: 'raffle_ad_desc',
    raffleAdImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470&auto=format&fit=crop',
    transferAdTitle: 'transfer_ad_title',
    transferAdDesc: 'transfer_ad_desc',
    transferAdImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1470&auto=format&fit=crop',
    gatewayAdTitle: 'gateway_ad_title',
    gatewayAdDesc: 'gateway_ad_desc',
    gatewayAdImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1470&auto=format&fit=crop',
    raffleEntryCost: 100,
    rafflePrizeType: 'raffle_prize_type',
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
    { id: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', username: 'admin', fullName: 'مدير العمليات التنفيذي', email: 'admin@fastpay.com', password: 'ubnt', role: 'ADMIN', balance: 0, status: 'active', createdAt: '2023-01-01', linkedCards: [], assets: [] },
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
        isInitialLoad.current = true;
        const [
          dbConfig,
          dbUsers,
        ] = await Promise.all([
          supabaseService.getSiteConfig(),
          supabaseService.getUsers(),
        ]);

        if (dbConfig) setSiteConfig(dbConfig);
        if (dbUsers.length > 0) setAccounts(dbUsers);

        if (!currentUserId) {
          isInitialLoad.current = false;
          return;
        }

        const [
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

        setTransactions(dbTrans || []);
        setNotifications(dbNotifs || []);
        setAdExchangeItems(dbAds || []);
        setAdNegotiations(dbOffers || []);
        setWithdrawalRequests(dbWithdrawals || []);
        setSalaryPlans(dbSalary || []);
        setFixedDeposits(dbDeposits || []);
        setVerificationRequests(dbVerifications || []);
        setRechargeCards(dbCards || []);
        setRaffleEntries(dbRaffleEntries || []);
        setRaffleWinners(dbRaffleWinners || []);
        setTradeOrders(dbTradeOrders || []);
        setTradeAssets(dbTradeAssets || []);
        setServices(dbServices || []);
        setPages(dbPages || []);

        isInitialLoad.current = false;
      } catch (e) { 
        console.error("Supabase load error, falling back to local", e);
        isInitialLoad.current = false;
      }
    };
    loadData();
  }, [currentUserId]); // Re-fetch on login

  // Sync to Supabase on changes
  useEffect(() => { 
    if (isSupabaseConfigured && !isInitialLoad.current) {
      supabaseService.updateSiteConfig(siteConfig).catch(err => {
        console.error("Site config sync error:", err);
      }); 
    }
  }, [siteConfig]);

  // Cleanup siteConfig to use keys for default values (migration)
  useEffect(() => {
    if (isSupabaseConfigured) {
      const defaultMappings: { [key: string]: string } = {
        "السيادة المالية في عصر السرعة": "hero_title",
        "بوابة FastPay Network لإدارة الأصول والتداول الفوري وحماية الثروات الرقمية بأعلى معايير الأمان العالمية.": "hero_subtitle",
        "افتح حسابك الملكي": "hero_cta_text",
        "تواصل مع الإدارة": "sales_cta_text",
        "الخدمات": "services_title",
        "حلول مالية متكاملة مصممة لتجمع بين السرعة والامان والابتكار العالمي": "services_subtitle",
        "( حلول مالية متكاملة مصممة لتجمع بين السرعة والامان والابتكار العالمي )": "services_subtitle",
        "البنية التحتية المالية العالمية": "gallery_title",
        "FastPay Network هي المعيار العالمي للمدفوعات الرقمية عالية الأمان، نجمع بين التكنولوجيا المتطورة والخدمات المالية المتميزة.": "footer_about",
        "روابط سريعة": "footer_links_title",
        "تواصل معنا": "contact_section_title",
        "الرياض، المملكة العربية السعودية": "contact_address",
        "تمويل الرواتب الذكي": "salary_ad_title",
        "أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع في كل انحاء العالم.": "salary_ad_desc",
        "محرك التداول الاحترافي": "trading_ad_title",
        "لا تنتظر السوق، بل كن أنت المحرك. منصتنا توفر لك وصولاً مباشراً للسيولة العالمية مع أدوات تحليل ذكية ومخططات بيانية فورية.": "trading_ad_desc",
        "القرعة الشهرية: حلم الفخامة": "raffle_ad_title",
        "شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP.": "raffle_ad_desc",
        "جسر السيولة العالمي": "transfer_ad_title",
        "أرسل واستقبل الأموال فورياً عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية.": "transfer_ad_desc",
        "بوابة دفع FastPay": "gateway_ad_title",
        "حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة بعمولات تنافسية تبدأ من 0.8%.": "gateway_ad_desc",
        "سياسة الخصوصية": "footer_link_1",
        "شروط الخدمة": "footer_link_2",
        "معايير الأمان": "footer_link_3",
        "التراخيص العالمية": "footer_link_4"
      };

      setSiteConfig(prev => {
        let hasChanged = false;
        const newConfig = { ...prev };
        
        Object.keys(newConfig).forEach(key => {
          const val = (newConfig as any)[key];
          if (typeof val === 'string' && defaultMappings[val]) {
            (newConfig as any)[key] = defaultMappings[val];
            hasChanged = true;
          }
        });

        return hasChanged ? newConfig : prev;
      });
    }
  }, [siteConfig, isSupabaseConfigured]); // Run whenever siteConfig changes (e.g. after load)

  // Generic Sync Effect for Arrays
  const useSyncEffect = (data: any[], syncFn: (item: any) => Promise<void>, label: string, bulkSync?: (items: any[]) => Promise<void>) => {
    const prevData = React.useRef(JSON.stringify(data));
    
    useEffect(() => {
      if (isSupabaseConfigured && !isInitialLoad.current) {
        const currentData = JSON.stringify(data);
        if (currentData !== prevData.current) {
          console.log(`Syncing ${label}... Data changed.`);
          // Data changed, sync it
          if (bulkSync) {
            console.log(`Using bulk sync for ${label}`);
            bulkSync(data).catch(e => console.error(`Bulk Sync ${label} error:`, e));
          } else {
            console.log(`Using individual sync for ${label} (first 5 items)`);
            // For simplicity in this demo, we sync the first few items
            data.slice(0, 5).forEach(item => syncFn(item).catch(e => console.error(`Sync ${label} error:`, e)));
          }
          prevData.current = currentData;
        }
      } else if (isInitialLoad.current) {
        // Update prevData during initial load so we don't trigger sync immediately after load
        prevData.current = JSON.stringify(data);
      }
    }, [data]);
  };

  useSyncEffect(transactions, supabaseService.addTransaction, 'Transaction', supabaseService.bulkUpsertTransactions);
  useSyncEffect(notifications, supabaseService.addNotification, 'Notification', supabaseService.bulkUpsertNotifications);
  useSyncEffect(adExchangeItems, supabaseService.upsertAdItem, 'AdItem', supabaseService.bulkUpsertAdItems);
  useSyncEffect(adNegotiations, supabaseService.upsertAdNegotiation, 'AdNegotiation');
  useSyncEffect(withdrawalRequests, supabaseService.upsertWithdrawal, 'Withdrawal', supabaseService.bulkUpsertWithdrawals);
  useSyncEffect(salaryPlans, supabaseService.upsertSalaryFinancing, 'Salary', supabaseService.bulkUpsertSalaryFinancing);
  useSyncEffect(fixedDeposits, supabaseService.upsertFixedDeposit, 'Deposit', supabaseService.bulkUpsertFixedDeposits);
  useSyncEffect(verificationRequests, supabaseService.upsertVerification, 'Verification', supabaseService.bulkUpsertVerifications);
  useSyncEffect(rechargeCards, supabaseService.upsertRechargeCard, 'Card', supabaseService.bulkUpsertRechargeCards);
  useSyncEffect(raffleEntries, supabaseService.upsertRaffleEntry, 'RaffleEntry', supabaseService.bulkUpsertRaffleEntries);
  useSyncEffect(raffleWinners, supabaseService.upsertRaffleWinner, 'RaffleWinner', supabaseService.bulkUpsertRaffleWinners);
  useSyncEffect(tradeOrders, supabaseService.upsertTradeOrder, 'TradeOrder', supabaseService.bulkUpsertTradeOrders);
  useSyncEffect(tradeAssets, supabaseService.upsertTradeAsset, 'TradeAsset');
  useSyncEffect(services, supabaseService.upsertLandingService, 'Service');
  useSyncEffect(pages, supabaseService.upsertCustomPage, 'Page');

  const syncUser = useCallback(async (user: User) => {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.updateUser(user);
      } catch (e: any) {
        console.error("Failed to sync user to Supabase", e);
        // alert(t('supabaseSyncError', { message: e.message || t('unknownError') }));
        throw e; // Re-throw to allow caller to catch
      }
    }
  }, []);

  const handleUpdateUser = async (updatedUser: User) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedUser.id ? updatedUser : acc));
    return await syncUser(updatedUser);
  };

  const handleAddUser = async (newUser: User) => {
    setAccounts(prev => [...prev, newUser]);
    return await syncUser(newUser);
  };

  const currentUser = useMemo(() => accounts.find(acc => acc.id === currentUserId) || null, [accounts, currentUserId]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type'], targetUserId?: string) => {
    const newNotify: Notification = {
      id: uuidv4(),
      userId: targetUserId || currentUserId || '',
      title, message, type, timestamp: new Date().toISOString(), isRead: false
    };
    setNotifications(prev => [newNotify, ...prev]);
  }, [currentUserId]);

  const handleLogout = () => {
    isInitialLoad.current = true; // Reset initial load flag first to prevent sync during logout
    setCurrentUserId(null);
    localStorage.removeItem('fp_v21_current_user_id');
    setTransactions([]);
    setNotifications([]);
    setWithdrawalRequests([]);
    setSalaryPlans([]);
    setFixedDeposits([]);
    setVerificationRequests([]);
    setRechargeCards([]);
    setRaffleEntries([]);
    setRaffleWinners([]);
    setTradeOrders([]);
    setAdExchangeItems([]);
    setAdNegotiations([]);
  };

  const commonProps = { 
    user: currentUser!, onLogout: handleLogout, siteConfig, onUpdateConfig: setSiteConfig, 
    accounts, setAccounts, transactions, setTransactions, 
    addNotification, salaryPlans, setSalaryPlans, onUpdateUser: handleUpdateUser, onAddUser: handleAddUser,
    services, setServices, pages, setPages, notifications, setNotifications,
    tradeAssets, setTradeAssets, tradeOrders, setTradeOrders,
    withdrawalRequests, setWithdrawalRequests,
    rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries, raffleWinners, setRaffleWinners,
    fixedDeposits, setFixedDeposits, verificationRequests, setVerificationRequests,
    adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations
  };

  const renderDashboard = () => {
    switch (currentUser?.role) {
      case 'DEVELOPER': 
      case 'ADMIN': return <DeveloperDashboard {...commonProps} />;
      case 'DISTRIBUTOR': return <MerchantDashboard {...commonProps} />;
      case 'MERCHANT': return <MerchantDealCreator {...commonProps} />;
      case 'USER': return <UserDashboard {...commonProps} />;
      default: return null;
    }
  };

  return (
    <NotificationProvider>
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
              <p className="text-[8px] text-white/40 mt-3 font-mono">{new Date(n.timestamp).toLocaleString(currentUser?.language || 'en-US')}</p>
            </div>
          ))}
        </div>

        {currentUser ? (
          renderDashboard()
        ) : (
          <>
            <LandingPage siteConfig={siteConfig} services={services} pages={pages} currentPath={currentPath} setCurrentPath={setCurrentPath} onLoginClick={() => setIsLoginModalOpen(true)} onRegisterClick={() => setIsRegisterModalOpen(true)} user={null} />
            {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={(u) => { setCurrentUserId(u.id); setIsLoginModalOpen(false); }} accounts={accounts} onSwitchToRegister={() => { setIsLoginModalOpen(false); setIsRegisterModalOpen(true); }} />}
            {isRegisterModalOpen && <RegisterModal onClose={() => setIsRegisterModalOpen(false)} accounts={accounts} onRegister={(u) => { handleAddUser(u); setCurrentUserId(u.id); setIsRegisterModalOpen(false); }} onSwitchToLogin={() => { setIsRegisterModalOpen(false); setIsLoginModalOpen(true); }} />}
          </>
        )}
      </div>
    </NotificationProvider>
  );
};

export default App;
