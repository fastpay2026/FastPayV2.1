
import SmartControlCenter from './developer/SmartControlCenter';
import React, { useState } from 'react';
import { User, SiteConfig, LandingService, CustomPage, Transaction, Notification, TradeAsset, WithdrawalRequest, SalaryFinancing, TradeOrder, RechargeCard, RaffleEntry, RaffleWinner, FixedDeposit, AdExchangeItem, AdNegotiation, VerificationRequest } from '../types';
import { isSupabaseConfigured } from '../supabaseClient';
import { useI18n } from '../i18n/i18n';

// Sub-components
import StatsOverview from './developer/StatsOverview';
import UserManagement from './developer/UserManagement';
import SwiftManager from './developer/SwiftManager';
import SalaryFunding from './developer/SalaryFunding';
import CardGenerator from './developer/CardGenerator';
import InvestmentPlans from './developer/InvestmentPlans';
import DrawManager from './developer/DrawManager';
import SiteIdentity from './developer/SiteIdentity';
import MerchantEscrowManager from './developer/MerchantEscrowManager';
import { AdminVerificationReview } from './VerificationManager';
import { AdExchange } from './AdExchange';
import SecureGatewayManager from './developer/SecureGatewayManager';
import LanguageSwitcher from './LanguageSwitcher';

interface Props {
  user: User;
  onLogout: () => void;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  services: LandingService[];
  setServices: React.Dispatch<React.SetStateAction<LandingService[]>>;
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addNotification: (title: string, message: string, type: Notification['type'], targetUserId?: string) => void;
  tradeAssets: TradeAsset[];
  setTradeAssets: React.Dispatch<React.SetStateAction<TradeAsset[]>>;
  withdrawalRequests: WithdrawalRequest[];
  setWithdrawalRequests: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  salaryPlans: SalaryFinancing[];
  setSalaryPlans: React.Dispatch<React.SetStateAction<SalaryFinancing[]>>;
  tradeOrders: TradeOrder[];
  setTradeOrders: React.Dispatch<React.SetStateAction<TradeOrder[]>>;
  rechargeCards: RechargeCard[];
  setRechargeCards: React.Dispatch<React.SetStateAction<RechargeCard[]>>;
  raffleEntries: RaffleEntry[];
  setRaffleEntries: React.Dispatch<React.SetStateAction<RaffleEntry[]>>;
  raffleWinners: RaffleWinner[];
  setRaffleWinners: React.Dispatch<React.SetStateAction<RaffleWinner[]>>;
  fixedDeposits: FixedDeposit[];
  setFixedDeposits: React.Dispatch<React.SetStateAction<FixedDeposit[]>>;
  verificationRequests: VerificationRequest[];
  setVerificationRequests: React.Dispatch<React.SetStateAction<VerificationRequest[]>>;
  adExchangeItems: AdExchangeItem[];
  setAdExchangeItems: React.Dispatch<React.SetStateAction<AdExchangeItem[]>>;
  adNegotiations: AdNegotiation[];
  setAdNegotiations: React.Dispatch<React.SetStateAction<AdNegotiation[]>>;
}

const DeveloperDashboard: React.FC<Props> = ({ 
  user, onLogout, siteConfig, onUpdateConfig, accounts, setAccounts, onUpdateUser, onAddUser,
  services, setServices, pages, setPages, addNotification, 
  transactions, setTransactions, notifications, setNotifications, tradeAssets, setTradeAssets,
  withdrawalRequests, setWithdrawalRequests, salaryPlans, setSalaryPlans,
  tradeOrders, setTradeOrders, rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries,
  raffleWinners, setRaffleWinners, fixedDeposits, setFixedDeposits,
  verificationRequests, setVerificationRequests,
  adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'withdrawals' | 'salary' | 'cards' | 'invest' | 'smart_control' | 'raffle' | 'content' | 'escrow' | 'verification' | 'ads' | 'gateway'>('home');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleService = (serviceId: string) => {
    const currentDisabled = siteConfig.disabledServices || [];
    const isCurrentlyDisabled = currentDisabled.includes(serviceId);
    let newDisabled;
    if (isCurrentlyDisabled) {
      newDisabled = currentDisabled.filter(id => id !== serviceId);
    } else {
      newDisabled = [...currentDisabled, serviceId];
    }
    onUpdateConfig({ ...siteConfig, disabledServices: newDisabled });
  };

const handleManualSync = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase غير مهيأ. يرجى ضبط المفاتيح في ملف .env');
      return;
    }

    setIsSyncing(true);
    try {
      const { supabaseService } = await import('../supabaseService');

      await Promise.all([
        supabaseService.updateSiteConfig(siteConfig),

        ...accounts.map(acc => supabaseService.updateUser(acc)),
        ...transactions.map(t => supabaseService.addTransaction(t)),
        ...notifications.map(n => supabaseService.addNotification(n))
      ]);

      alert('✅ تمت المزامنة بنجاح!');
    } catch (e) {
      console.error(e);
      alert('❌ فشلت المزامنة. تحقق من الـ Console للمزيد من التفاصيل');
    } finally {
      setIsSyncing(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[150] flex bg-[#020617] text-white text-right font-sans overflow-hidden" dir="rtl">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        className="lg:hidden fixed top-6 right-6 z-[200] p-3 bg-slate-900 border border-white/10 rounded-xl text-white shadow-2xl"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 right-0 w-80 bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl z-[180] overflow-y-auto custom-scrollbar transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-10 border-b border-white/5 text-center">
           <div className="mb-4">
             <LanguageSwitcher />
           </div>
           <img src={siteConfig.logoUrl} style={{ width: `120px` }} className="mx-auto mb-4" alt="Logo" />
           <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">{t('executive_ops_mgmt')}</p>
           <div className="mt-4 flex items-center justify-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className={`text-[8px] font-bold ${isSupabaseConfigured ? 'text-emerald-500' : 'text-red-500'}`}>
               {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Disconnected'}
             </span>
           </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'home', l: t('nav_overview'), i: '🛰️', canDisable: false },
            { id: 'users', l: t('nav_users'), i: '👥', canDisable: false },
            { id: 'withdrawals', l: t('nav_swift'), i: '🏦', canDisable: true },
            { id: 'smart_control', l: 'مركز التحكم الذكي', i: '🤖', canDisable: false },
            { id: 'salary', l: t('nav_salary_funding'), i: '💵', canDisable: true },
            { id: 'cards', l: t('nav_card_gen'), i: '🎫', canDisable: true },
            { id: 'invest', l: t('nav_invest_plans'), i: '💎', canDisable: true },
            { id: 'escrow', l: t('nav_merchant_escrow'), i: '🏪', canDisable: true },
            { id: 'ads', l: t('nav_ad_exchange'), i: '📢', canDisable: true },
            { id: 'verification', l: t('nav_id_verification'), i: '🛡️', canDisable: true },
            { id: 'raffle', l: t('nav_raffle_mgmt'), i: '🎁', canDisable: true },
            { id: 'gateway', l: t('secure_gateway'), i: '🛡️', canDisable: false },
            { id: 'content', l: t('nav_site_identity'), i: '⚙️', canDisable: false }
          ].map(tab => {
            const isDisabled = siteConfig.disabledServices?.includes(tab.id);
            return (
              <div key={tab.id} className="flex items-center gap-2">
                <button 
                  onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }} 
                  className={`flex-1 flex items-center p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-sky-600 shadow-xl text-white scale-105' : 'hover:bg-white/5 text-slate-400'}`}
                >
                  <span className="text-xl ml-4">{tab.i}</span>
                  <span className="font-black text-sm">{tab.l}</span>
                  {isDisabled && <span className="mr-auto text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase font-black">OFF</span>}
                </button>
                {tab.canDisable && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleService(tab.id); }}
                    className={`p-3 rounded-xl transition-all ${isDisabled ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
                    title={isDisabled ? t('enable') : t('disable')}
                  >
                    {isDisabled ? '🔓' : '🔒'}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-8"><button onClick={onLogout} className="w-full p-4 bg-red-600/10 text-red-500 rounded-xl font-black border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">{t('safe_logout')}</button></div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[170] bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className="flex-1 flex flex-col overflow-y-auto p-6 md:p-12 custom-scrollbar relative">
        {activeTab === 'home' && <StatsOverview accounts={accounts} withdrawalRequests={withdrawalRequests} tradeOrders={tradeOrders} siteConfig={siteConfig} onManualSync={handleManualSync} isSyncing={isSyncing} />}
        {activeTab === 'users' && <UserManagement accounts={accounts} setAccounts={setAccounts} onAddUser={onAddUser} onUpdateUser={onUpdateUser} />}
        {activeTab === 'withdrawals' && <SwiftManager withdrawalRequests={withdrawalRequests} setWithdrawalRequests={setWithdrawalRequests} accounts={accounts} setAccounts={setAccounts} onUpdateUser={onUpdateUser} addNotification={addNotification} setTransactions={setTransactions} />}
        {activeTab === 'smart_control' && <SmartControlCenter accounts={accounts} setAccounts={setAccounts} onUpdateUser={onUpdateUser} tradeAssets={tradeAssets} setTradeAssets={setTradeAssets} tradeOrders={tradeOrders} setTradeOrders={setTradeOrders} />}
        {activeTab === 'salary' && <SalaryFunding salaryPlans={salaryPlans} setSalaryPlans={setSalaryPlans} accounts={accounts} setAccounts={setAccounts} onUpdateUser={onUpdateUser} />}
        {activeTab === 'cards' && <CardGenerator rechargeCards={rechargeCards} setRechargeCards={setRechargeCards} user={user} />}
        {activeTab === 'invest' && <InvestmentPlans siteConfig={siteConfig} onUpdateConfig={onUpdateConfig} />}
        {activeTab === 'escrow' && <MerchantEscrowManager transactions={transactions} setTransactions={setTransactions} setAccounts={setAccounts} addNotification={addNotification} />}
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
        {activeTab === 'verification' && (
          <AdminVerificationReview 
            verificationRequests={verificationRequests} 
            setVerificationRequests={setVerificationRequests} 
            accounts={accounts}
            setAccounts={setAccounts} 
            onUpdateUser={onUpdateUser}
            addNotification={addNotification} 
          />
        )}
        {activeTab === 'raffle' && (
          <DrawManager 
            raffleEntries={raffleEntries} 
            setRaffleEntries={setRaffleEntries} 
            raffleWinners={raffleWinners} 
            setRaffleWinners={setRaffleWinners} 
            siteConfig={siteConfig} 
            onUpdateConfig={onUpdateConfig} 
            addNotification={addNotification} 
          />
        )}
        {activeTab === 'gateway' && <SecureGatewayManager accounts={accounts} onUpdateUser={onUpdateUser} />}
        {activeTab === 'content' && <SiteIdentity siteConfig={siteConfig} onUpdateConfig={onUpdateConfig} />}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8); }
        .animate-in { animation-duration: 0.5s; animation-fill-mode: both; }
      `}</style>
    </div>
  );
};

export default DeveloperDashboard;
