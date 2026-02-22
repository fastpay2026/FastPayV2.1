
import React, { useState } from 'react';
import { User, SiteConfig, LandingService, CustomPage, Transaction, Notification, TradeAsset, WithdrawalRequest, SalaryFinancing, TradeOrder, RechargeCard, RaffleEntry, RaffleWinner, FixedDeposit, AdExchangeItem, AdNegotiation, VerificationRequest } from '../types';
import { isSupabaseConfigured } from '../supabaseClient';

// Sub-components
import StatsOverview from './developer/StatsOverview';
import UserManagement from './developer/UserManagement';
import SwiftManager from './developer/SwiftManager';
import DealsEngine from './developer/DealsEngine';
import SalaryFunding from './developer/SalaryFunding';
import CardGenerator from './developer/CardGenerator';
import InvestmentPlans from './developer/InvestmentPlans';
import DrawManager from './developer/DrawManager';
import SiteIdentity from './developer/SiteIdentity';
import MerchantEscrowManager from './developer/MerchantEscrowManager';
import { AdminVerificationReview } from './VerificationManager';
import { AdExchange } from './AdExchange';

interface Props {
  user: User;
  onLogout: () => void;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  accounts: User[];
  setAccounts: React.Dispatch<React.SetStateAction<User[]>>;
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
  user, onLogout, siteConfig, onUpdateConfig, accounts, setAccounts, 
  services, setServices, pages, setPages, addNotification, 
  transactions, setTransactions, notifications, setNotifications, tradeAssets, setTradeAssets,
  withdrawalRequests, setWithdrawalRequests, salaryPlans, setSalaryPlans,
  tradeOrders, setTradeOrders, rechargeCards, setRechargeCards, raffleEntries, setRaffleEntries,
  raffleWinners, setRaffleWinners, fixedDeposits, setFixedDeposits,
  verificationRequests, setVerificationRequests,
  adExchangeItems, setAdExchangeItems, adNegotiations, setAdNegotiations
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'withdrawals' | 'salary' | 'cards' | 'invest' | 'trading' | 'raffle' | 'content' | 'escrow' | 'verification' | 'ads'>('home');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase غير مهيأ. يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY');
      return;
    }
    setIsSyncing(true);
    try {
      const { supabaseService } = await import('../supabaseService');
      await Promise.all([
        supabaseService.updateSiteConfig(siteConfig),
        ...accounts.map(acc => supabaseService.updateUser(acc)),
        ...transactions.map(t => supabaseService.addTransaction(t)),
        ...notifications.map(n => supabaseService.addNotification(n)),
        ...adExchangeItems.map(i => supabaseService.upsertAdItem(i)),
        ...adNegotiations.map(n => supabaseService.upsertAdNegotiation(n)),
        ...withdrawalRequests.map(w => supabaseService.upsertWithdrawal(w)),
        ...salaryPlans.map(s => supabaseService.upsertSalaryFinancing(s)),
        ...fixedDeposits.map(d => supabaseService.upsertFixedDeposit(d)),
        ...verificationRequests.map(v => supabaseService.upsertVerification(v))
      ]);
      alert('تمت المزامنة الكاملة مع Supabase بنجاح ✅');
    } catch (e) {
      console.error(e);
      alert('فشلت المزامنة. تحقق من لوحة التحكم (Console) لمزيد من التفاصيل.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex bg-[#020617] text-white text-right font-sans overflow-hidden" dir="rtl">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar">
        <div className="p-10 border-b border-white/5 text-center">
           <img src={siteConfig.logoUrl} style={{ width: `120px` }} className="mx-auto mb-4" alt="Logo" />
           <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">إدارة العمليات السيادية v28.5 Elite</p>
           <div className="mt-4 flex items-center justify-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className={`text-[8px] font-bold ${isSupabaseConfigured ? 'text-emerald-500' : 'text-red-500'}`}>
               {isSupabaseConfigured ? 'Supabase Connected' : 'Supabase Disconnected'}
             </span>
           </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'home', l: 'نظرة عامة', i: '🛰️' },
            { id: 'users', l: 'إدارة الأعضاء', i: '👥' },
            { id: 'withdrawals', l: 'حوالات Swift', i: '🏦' },
            { id: 'trading', l: 'محرك الصفقات', i: '📈' },
            { id: 'salary', l: 'تمويل الرواتب', i: '💵' },
            { id: 'cards', l: 'توليد البطاقات', i: '🎫' },
            { id: 'invest', l: 'خطط الاستثمار', i: '💎' },
            { id: 'escrow', l: 'اعتمادات التاجر', i: '🏪' },
            { id: 'ads', l: 'بورصة الإعلانات', i: '📢' },
            { id: 'verification', l: 'توثيق الهوية', i: '🛡️' },
            { id: 'raffle', l: 'إدارة القرعة', i: '🎁' },
            { id: 'content', l: 'هوية الموقع', i: '⚙️' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === t.id ? 'bg-sky-600 shadow-xl text-white scale-105' : 'hover:bg-white/5 text-slate-400'}`}>
              <span className="text-xl ml-4">{t.i}</span>
              <span className="font-black text-sm">{t.l}</span>
            </button>
          ))}
        </nav>
        <div className="p-8"><button onClick={onLogout} className="w-full p-4 bg-red-600/10 text-red-500 rounded-xl font-black border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">خروج آمن</button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto p-12 custom-scrollbar relative">
        {activeTab === 'home' && <StatsOverview accounts={accounts} withdrawalRequests={withdrawalRequests} tradeOrders={tradeOrders} siteConfig={siteConfig} onManualSync={handleManualSync} isSyncing={isSyncing} />}
        {activeTab === 'users' && <UserManagement accounts={accounts} setAccounts={setAccounts} />}
        {activeTab === 'withdrawals' && <SwiftManager withdrawalRequests={withdrawalRequests} setWithdrawalRequests={setWithdrawalRequests} setAccounts={setAccounts} />}
        {activeTab === 'trading' && <DealsEngine tradeAssets={tradeAssets} setTradeAssets={setTradeAssets} tradeOrders={tradeOrders} setTradeOrders={setTradeOrders} setAccounts={setAccounts} />}
        {activeTab === 'salary' && <SalaryFunding salaryPlans={salaryPlans} setSalaryPlans={setSalaryPlans} accounts={accounts} setAccounts={setAccounts} />}
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
            onUpdateUser={(u) => setAccounts(prev => prev.map(acc => acc.id === u.id ? u : acc))}
            siteConfig={siteConfig}
          />
        )}
        {activeTab === 'verification' && (
          <AdminVerificationReview 
            verificationRequests={verificationRequests} 
            setVerificationRequests={setVerificationRequests} 
            setAccounts={setAccounts} 
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
