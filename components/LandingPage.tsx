
import React, { useEffect, useState, useRef } from 'react';
import { SiteConfig, LandingService, CustomPage, User } from '../types';
import { useI18n } from '../i18n/i18n';
import { BadgeCheck } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

interface Props {
  siteConfig: SiteConfig;
  services: LandingService[];
  pages: CustomPage[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  user?: User | null;
}

interface MarketAsset {
  id: string;
  name: string;
  price: number;
  change: number;
  icon: string;
  isUp?: boolean;
  flash?: 'up' | 'down' | null;
}

const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 justify-center" dir="ltr">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 p-2 md:p-4 rounded-xl md:rounded-2xl w-16 md:w-24 text-center">
          <p className="text-xl md:text-3xl font-black text-amber-500 font-mono">{String(item.value).padStart(2, '0')}</p>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

const LandingPage: React.FC<Props> = ({ 
  siteConfig, 
  services, 
  pages,
  currentPath, 
  setCurrentPath, 
  onLoginClick, 
  onRegisterClick,
  user
}) => {
  const { t, isRtl } = useI18n();
  
  const activeCustomPage = pages.find(p => p.slug === currentPath && p.isActive);
  const [speedLines, setSpeedLines] = useState<number[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    setSpeedLines(Array.from({ length: 15 }, () => Math.random() * 100));
  }, []);

  const scrollToSection = (id: string) => {
    setCurrentPath('home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const activeAds = siteConfig.ads?.filter(ad => ad.isActive) || [];

  return (
    <div className={`flex flex-col min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      <div className="fixed inset-0 z-0 bg-mesh opacity-20"></div>
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {speedLines.map((top, idx) => (
          <div key={idx} className="speed-line" style={{ top: `${top}%`, left: '-10%', width: '30%', animationDelay: `${idx * 0.2}s` }}></div>
        ))}
      </div>

      <nav className="fixed w-full z-[90] top-6 px-4 md:px-12 lg:px-24">
        <div className="max-w-[1600px] mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[4rem] py-2 md:py-3 px-4 md:px-8 flex justify-between items-center shadow-[0_40px_100px_rgba(0,0,0,0.5)] gap-4">
          
          {/* Left: Logo + Actions */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className={`flex items-center gap-3 group cursor-pointer ${siteConfig.logoPosition === 'center' ? 'justify-center' : siteConfig.logoPosition === 'left' ? 'justify-start' : 'justify-end'}`} onClick={() => setCurrentPath('home')}>
              <div className="flex-shrink-0 flex items-center">
                <Logo 
                  siteConfig={siteConfig} 
                  className="object-contain h-auto transform group-hover:scale-110 transition-all duration-700" 
                  style={{ width: `${siteConfig.logoWidth || 120}px` }}
                />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              <button onClick={onLoginClick} className="px-4 md:px-5 py-1.5 rounded-3xl text-white bg-sky-600 font-black text-xs md:text-sm hover:bg-sky-500 transition-all shadow-2xl shadow-sky-900/40 whitespace-nowrap">{t('login')}</button>
              <button onClick={onRegisterClick} className="px-4 md:px-5 py-1.5 rounded-3xl text-slate-200 bg-white/5 border border-white/10 font-black text-xs md:text-sm hover:bg-white/10 transition-all hidden md:block whitespace-nowrap">{t('register')}</button>
            </div>
          </div>
          
          {/* Middle: Nav Links */}
          <div className="hidden xl:flex gap-12 2xl:gap-16 text-slate-200 font-black text-[18px] 2xl:text-[20px] uppercase tracking-widest justify-center items-center flex-1 overflow-x-auto no-scrollbar px-2">
            {[
              { label: t('nav_home'), id: 'home' },
              { label: t('raffle'), id: 'raffle-ad' },
              { label: t('nav_swift'), id: 'transfer-ad' },
              { label: t('nav_gateway'), id: 'gateway-ad' },
              { label: t('nav_transfer'), id: 'salary-ad' },
              { label: t('nav_trading'), id: 'trading-ad' }
            ].map((item, idx) => (
              <button key={idx} onClick={() => item.id === 'home' ? setCurrentPath('home') : scrollToSection(item.id)} className="hover:text-sky-400 transition-all relative py-3 group whitespace-nowrap flex-shrink-0">
                {item.label}
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-sky-500 group-hover:w-full transition-all duration-500"></span>
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0 justify-end">
            {/* زر تغيير اللغة */}
            <div className="relative z-[100] flex-shrink-0">
              <LanguageSwitcher />
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden text-white text-3xl p-2 flex-shrink-0">
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-4 right-4 mt-4 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-4xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-center pb-4 border-b border-white/5">
              <LanguageSwitcher />
            </div>
            <div className={`flex flex-col space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              {[
                { label: t('nav_home'), id: 'home' },
                { label: t('raffle'), id: 'raffle-ad' },
                { label: t('nav_swift'), id: 'transfer-ad' },
                { label: t('nav_gateway'), id: 'gateway-ad' },
                { label: t('nav_transfer'), id: 'salary-ad' },
                { label: t('nav_trading'), id: 'trading-ad' }
              ].map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => {
                    item.id === 'home' ? setCurrentPath('home') : scrollToSection(item.id);
                    setIsMobileMenuOpen(false);
                  }} 
                  className={`text-slate-300 hover:text-white font-black text-lg py-2 border-b border-white/5 ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="w-full py-4 rounded-2xl text-white bg-sky-600 font-black text-lg">{t('login')}</button>
              <button onClick={() => { onRegisterClick(); setIsMobileMenuOpen(false); }} className="w-full py-4 rounded-2xl text-slate-200 bg-white/5 border border-white/10 font-black text-lg">{t('register')}</button>
            </div>
          </div>
        )}
      </nav>

      {currentPath === 'home' ? (
        <>
          <section className="relative pt-[25vh] md:pt-[35vh] pb-20 md:pb-32 px-6 md:px-24 z-10 overflow-hidden">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
              <div className="w-full lg:flex-1 space-y-8 md:space-y-12 order-2 lg:order-1 text-center lg:text-right">
                 <div className="inline-flex items-center gap-4 px-6 md:px-8 py-2 md:py-3 bg-sky-500/10 border border-sky-500/20 rounded-full shadow-[0_0_50px_rgba(14,165,233,0.2)]">
                    <span className="w-2 md:w-3 h-2 md:h-3 bg-sky-500 rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9]"></span>
                    <span className="text-sky-400 font-black text-[10px] md:text-xs uppercase tracking-[0.3em]">{t('system_premium')} {siteConfig.siteName} v5.5 Premium</span>
                 </div>
                 <h1 className="text-4xl md:text-[6.5rem] font-black leading-[1.1] tracking-tighter text-white">{t(siteConfig.heroTitle)}</h1>
                 <p className="text-lg md:text-3xl text-slate-300 max-w-3xl mx-auto lg:mx-0 leading-relaxed font-bold border-r-0 lg:border-r-[12px] border-sky-500 pr-0 lg:pr-8">{t(siteConfig.heroSubtitle)}</p>
                 <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 md:gap-8 pt-6">
                    <button onClick={onRegisterClick} className="px-8 md:px-14 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] bg-white text-black font-black text-xl md:text-2xl shadow-[0_25px_60px_rgba(255,255,255,0.2)] hover:scale-105 transition-all flex items-center justify-center gap-4 md:gap-6 group">
                      <span>{t(siteConfig.heroCtaText)}</span>
                      <span className="text-2xl md:text-3xl group-hover:translate-x-[10px] transition-transform">→</span>
                    </button>
                    <button onClick={() => scrollToSection('services')} className="px-8 md:px-14 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] bg-white/5 border border-white/10 text-white font-black text-xl md:text-2xl backdrop-blur-3xl hover:bg-white/10 transition-all">{t(siteConfig.salesCtaText)}</button>
                 </div>
              </div>
              
              <div className="w-full lg:flex-1 order-1 lg:order-2 max-w-[400px] mx-auto lg:ml-auto">
                 <div className="relative animate-float group perspective-1000">
                     <Logo 
                       siteConfig={siteConfig} 
                       className="w-full h-auto transform group-hover:scale-110 transition-all duration-700" 
                       style={{ width: '100%' }}
                     />
                 </div>
              </div>
            </div>
          </section>

           <section id="transfer-ad" className="py-20 md:py-40 px-6 md:px-24">
            <div className="max-w-[1800px] mx-auto group bg-[#0f0f0f] rounded-[3rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[500px] md:min-h-[700px] shadow-3xl border border-emerald-500/10 relative">
               <div className="w-full lg:w-[50%] p-10 md:p-24 space-y-8 md:space-y-10 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-4 text-emerald-400 font-bold text-xs uppercase tracking-[0.3em]"><span className="w-10 h-px bg-emerald-500"></span>GLOBAL LIQUIDITY ENGINE</div>
                  <h2 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tighter">Global Liquidity Bridge</h2>
                  <p className="text-lg md:text-2xl text-slate-300 font-medium leading-relaxed max-w-lg">Send and receive money instantly via the global Swift system with extreme precision.</p>
                  <div className="flex flex-wrap gap-6 items-center pt-4">
                    <button onClick={onLoginClick} className="bg-emerald-500 px-10 py-5 rounded-full font-bold text-lg text-black hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]">Start Global Transfer 🌐</button>
                    <div className="flex items-center gap-4 text-slate-500 font-bold text-xs uppercase tracking-widest">
                       <span>SWIFT SECURED</span>
                       <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                       <span>INSTANT P2P</span>
                    </div>
                  </div>
               </div>
               <div className="w-full lg:w-[50%] h-64 md:h-auto relative bg-slate-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&h=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Global Transfers" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-transparent to-transparent"></div>
               </div>
            </div>
          </section>

           <section id="gateway-ad" className="py-20 md:py-40 px-6 md:px-24">
            <div className="max-w-[1800px] mx-auto group glass-card rounded-3xl md:rounded-[6rem] overflow-hidden flex flex-col lg:flex-row-reverse items-stretch min-h-[500px] md:min-h-[700px] shadow-3xl border border-violet-500/10 hover:border-violet-500/40 transition-all duration-1000 relative">
               <div className="w-full lg:w-[55%] p-10 md:p-32 space-y-8 md:space-y-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-6 text-violet-400 font-black text-xs md:text-sm uppercase tracking-[0.5em]"><span className="w-12 md:w-20 h-px bg-violet-500"></span>{t('professional_payment_gateway')}</div>
                  <h2 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tighter group-hover:text-violet-400 transition-all duration-700">{t(siteConfig.gatewayAdTitle)}</h2>
                  <p className="text-lg md:text-3xl text-slate-200 font-bold leading-relaxed border-r-4 md:border-r-8 border-violet-500 pr-6 md:pr-10">{t(siteConfig.gatewayAdDesc)}</p>
                  <div className="flex flex-wrap gap-6 md:gap-8 items-center pt-4 md:pt-8">
                    <button onClick={onLoginClick} className="bg-violet-600 px-10 md:px-20 py-4 md:py-8 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-2xl hover:bg-violet-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(124,58,237,0.3)] w-full md:w-max">{t('activate_gateway')}</button>
                    <div className="flex -space-x-4">
                       {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-10 md:w-12 h-10 md:h-12 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-xs font-black shadow-lg overflow-hidden">
                             <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="Merchant" />
                          </div>
                       ))}
                       <div className="w-10 md:w-12 h-10 md:h-12 rounded-full border-2 border-[#020617] bg-violet-600 flex items-center justify-center text-[8px] md:text-[10px] font-black shadow-lg">+500</div>
                    </div>
                  </div>
               </div>
               <div className="w-full lg:w-[45%] h-64 md:h-auto relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.gatewayAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Payment Gateway" />
                  <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-[#020617] via-transparent to-transparent"></div>
               </div>
            </div>
          </section>

          <section id="raffle-ad" className="py-20 md:py-40 px-6 md:px-24">
            <div className="max-w-[1800px] mx-auto group glass-card rounded-3xl md:rounded-[6rem] overflow-hidden flex flex-col lg:flex-row-reverse items-stretch min-h-[600px] md:min-h-[800px] shadow-[0_50px_120px_rgba(0,0,0,0.7)] border border-amber-500/10 hover:border-amber-500/40 transition-all duration-1000 relative">
                <div className="w-full lg:w-[55%] p-10 md:p-32 space-y-8 md:space-y-12 flex flex-col justify-center relative z-10 bg-gradient-to-br from-slate-950 via-[#020617] to-indigo-950/20">
                  <div className="flex items-center gap-6 text-amber-500 font-black text-xs md:text-sm uppercase tracking-[0.5em]"><span className="w-12 md:w-20 h-px bg-amber-500"></span>{t('monthly_raffle_title')}</div>
                  <h2 className="text-3xl md:text-7xl font-black text-white leading-tight tracking-tighter group-hover:text-amber-400 transition-all duration-700">{t(siteConfig.raffleAdTitle)}</h2>
                  <p className="text-lg md:text-3xl text-slate-200 font-bold leading-relaxed border-r-4 md:border-r-8 border-amber-500 pr-6 md:pr-10">{t(siteConfig.raffleAdDesc)}</p>
                  
                  {siteConfig.showRaffleCountdown && siteConfig.raffleEndDate && (
                    <div className="py-4 md:py-6">
                       <p className="text-center text-amber-500 font-black text-[10px] md:text-sm uppercase tracking-[0.3em] mb-4">{t('raffle_countdown_text')}</p>
                       <Countdown targetDate={siteConfig.raffleEndDate} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 py-4 md:py-6">
                     <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 space-y-4">
                        <span className="text-4xl md:text-5xl">🏎️</span>
                        <h4 className="text-lg md:text-xl font-black">{t('porsche_title')}</h4>
                        <p className="text-xs md:text-sm text-slate-500 font-bold">{t('porsche_desc')}</p>
                     </div>
                     <div className="p-6 md:p-8 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 space-y-4">
                        <span className="text-4xl md:text-5xl">🕋</span>
                        <h4 className="text-lg md:text-xl font-black">{t('umrah_title')}</h4>
                        <p className="text-xs md:text-sm text-slate-500 font-bold">{t('umrah_desc')}</p>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-6 md:gap-8 items-center pt-4 md:pt-8">
                    <button onClick={onRegisterClick} className="bg-amber-600 px-10 md:px-20 py-4 md:py-8 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-2xl hover:bg-amber-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(245,158,11,0.3)] w-full md:w-max">{t('book_ticket')} {siteConfig.raffleEntryCost}$</button>
                    <p className="text-slate-500 font-black text-[10px] md:text-sm animate-pulse tracking-widest w-full md:w-auto text-center md:text-right">{t('limited_seats')}</p>
                  </div>
               </div>
               <div className="w-full lg:w-[45%] h-64 md:h-auto relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.raffleAdImage} className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-90 transition-all duration-[8s]" alt="Sports Car" />
                  <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-black via-transparent to-transparent"></div>
                  <div className="absolute top-6 md:top-12 left-6 md:left-12 bg-white text-black p-4 md:p-8 rounded-full font-black text-center shadow-2xl animate-bounce">
                     <p className="text-[8px] md:text-xs">{t('prize_value_exceeds')}</p>
                     <p className="text-xl md:text-3xl tracking-tighter">$250,000</p>
                  </div>
               </div>
            </div>
          </section>

          {activeAds.length > 0 && (
            <section id="dynamic-ads" className="py-20 px-8 md:px-24">
               <div className="max-w-[1600px] mx-auto space-y-20">
                  <div className="flex items-center gap-12">
                     <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white">{t('global_campaigns')}</h2>
                     <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                     {activeAds.map(ad => (
                        <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="group glass-card rounded-3xl md:rounded-[4rem] overflow-hidden flex flex-col shadow-2xl hover:border-sky-500/40 transition-all duration-700 hover:-translate-y-4">
                           <div className="h-80 relative overflow-hidden">
                              <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt={ad.title} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                           </div>
                           <div className="p-10 space-y-4">
                              <h3 className="text-3xl font-black text-white group-hover:text-sky-400 transition-colors">{ad.title}</h3>
                              <div className="flex items-center gap-4 text-sky-500 font-black text-sm uppercase tracking-widest">
                                 <span>{t('discover_more')}</span>
                                 <span className="text-xl">←</span>
                              </div>
                           </div>
                        </a>
                     ))}
                  </div>
               </div>
            </section>
          )}

          <section className="py-40 px-8 md:px-24 space-y-40 max-w-[1800px] mx-auto">
            <div id="salary-ad" className="group glass-card rounded-3xl md:rounded-[6rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[500px] md:min-h-[700px] shadow-3xl border border-indigo-500/10 hover:border-indigo-500/40 transition-all duration-1000 relative">
               <div className="w-full lg:w-[55%] p-10 md:p-32 space-y-8 md:space-y-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-6 text-indigo-400 font-black text-xs md:text-sm uppercase tracking-[0.5em]"><span className="w-12 md:w-20 h-px bg-indigo-500"></span>{t('exclusive_financial_innovation')}</div>
                  <h2 className="text-3xl md:text-7xl font-black text-white leading-tight tracking-tighter group-hover:text-indigo-400 transition-all duration-700">{t(siteConfig.salaryAdTitle)}</h2>
                  <p className="text-lg md:text-3xl text-slate-200 font-bold leading-relaxed border-r-4 md:border-r-8 border-indigo-500 pr-6 md:pr-10">{t(siteConfig.salaryAdDesc)}</p>
                  <button onClick={onRegisterClick} className="bg-indigo-600 px-10 py-4 md:px-20 md:py-8 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-2xl hover:bg-indigo-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(79,70,229,0.3)] w-full md:w-max">{t('request_pre_financing')}</button>
               </div>
               <div className="w-full lg:w-[45%] h-64 md:h-auto relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.salaryAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Salary" />
                  <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-[#020617] via-transparent to-transparent"></div>
               </div>
            </div>

            <div id="trading-ad" className="group glass-card rounded-3xl md:rounded-[6rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[500px] md:min-h-[700px] shadow-3xl hover:border-sky-500/30 transition-all duration-1000">
               <div className="w-full lg:w-[55%] p-10 md:p-32 space-y-8 md:space-y-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-6 text-sky-400 font-black text-xs md:text-sm uppercase tracking-[0.5em]"><span className="w-12 md:w-20 h-px bg-sky-500"></span>{t('elite_level_trading')}</div>
                  <h2 className="text-3xl md:text-7xl font-black text-white leading-tight tracking-tighter group-hover:text-glow transition-all duration-700">{t(siteConfig.tradingAdTitle)}</h2>
                  <p className="text-lg md:text-3xl text-slate-300 font-bold leading-relaxed border-r-4 md:border-r-8 border-sky-500 pr-6 md:pr-10">{t(siteConfig.tradingAdDesc)}</p>
                  <button onClick={onLoginClick} className="bg-sky-600 px-10 py-4 md:px-20 md:py-8 rounded-2xl md:rounded-[3rem] font-black text-lg md:text-2xl hover:bg-sky-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(14,165,233,0.4)] w-full md:w-max">{t('enter_pro_platform')}</button>
               </div>
               <div className="w-full lg:w-[45%] h-64 md:h-auto relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.tradingAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Trading" />
                  <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-[#020617] via-transparent to-transparent"></div>
               </div>
            </div>
          </section>

          <section id="services" className="py-20 md:py-60 px-6 md:px-24">
             <div className="max-w-[1600px] mx-auto">
                <div className="text-center space-y-6 md:space-y-8 mb-20 md:mb-40">
                   <h2 className="text-4xl md:text-9xl font-black text-white tracking-tighter">{t(siteConfig.servicesTitle)}</h2>
                   <h3 className="text-lg md:text-3xl text-slate-400 font-bold max-w-4xl mx-auto">{t('services_subtitle')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-20">
                   {services.map(s => (
                      <div key={s.id} className="group p-8 md:p-20 glass-card rounded-3xl md:rounded-[5rem] hover:bg-white/5 transition-all duration-700 hover:-translate-y-4 md:hover:-translate-y-8 relative overflow-hidden">
                         <div className="text-5xl md:text-[10rem] mb-8 md:mb-16 filter drop-shadow-[0_20px_50px_rgba(14,165,233,0.3)] transform group-hover:scale-110 transition-transform duration-700 text-center">{s.icon}</div>
                         <h3 className="text-2xl md:text-5xl font-black mb-6 md:mb-10 text-white group-hover:text-sky-400 transition-colors">{s.title}</h3>
                         <p className="text-base md:text-2xl text-slate-400 font-bold leading-relaxed md:leading-[2] group-hover:text-slate-200 transition-colors">{s.description}</p>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          <footer className="bg-[#020617] py-20 md:py-60 px-6 md:px-32 border-t border-white/5 relative z-10 overflow-hidden">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-12 md:gap-40">
              <div className="space-y-8 md:space-y-16">
                {siteConfig.logoUrl && <Logo siteConfig={siteConfig} style={{ width: `${siteConfig.logoWidth ? Math.min(siteConfig.logoWidth, 150) : 150}px` }} />}
                <p className="text-lg md:text-2xl text-slate-400 font-bold leading-relaxed md:leading-[2.2] max-w-2xl">{t(siteConfig.footerAbout)}</p>
              </div>
              <div className="space-y-8 md:space-y-16">
                 <h4 className="text-2xl md:text-4xl font-black text-white border-r-4 md:border-r-[10px] border-sky-500 pr-6 md:pr-10 tracking-tighter uppercase">{t('footer_links_title')}</h4>
                 <ul className="space-y-6 md:space-y-10 text-slate-400 font-bold text-lg md:text-2xl">
                    {pages.filter(p=>p.isActive && p.showInFooter).map(p=>(
                      <li key={p.id} onClick={()=>setCurrentPath(p.slug)} className="hover:text-sky-400 transition-all cursor-pointer flex items-center gap-4 md:gap-6"><span className="w-2 md:w-3 h-2 md:h-3 bg-sky-500 rounded-full shadow-[0_0_10px_#0ea5e9]"></span>{p.title}</li>
                    ))}
                    {[siteConfig.footerLink1Text, siteConfig.footerLink2Text, siteConfig.footerLink3Text, siteConfig.footerLink4Text].map((link, idx) => (
                      <li key={idx} className="hover:text-white transition-all cursor-pointer flex items-center gap-4 md:gap-6"><span className="w-2 md:w-3 h-2 md:h-3 bg-slate-700 rounded-full"></span>{t(link)}</li>
                    ))}
                 </ul>
              </div>
              <div className="space-y-8 md:space-y-16">
                 <h4 className="text-2xl md:text-4xl font-black text-white border-r-4 md:border-r-[10px] border-emerald-500 pr-6 md:pr-10 tracking-tighter uppercase">{t('contact_section_title')}</h4>
                 <div className="space-y-8 md:space-y-12 text-slate-400 font-bold text-lg md:text-2xl">
                    <div className="flex items-start gap-6 md:gap-10 group cursor-default"><span className="text-3xl md:text-5xl group-hover:scale-125 transition-all">📍</span><p className="group-hover:text-white transition-colors leading-relaxed">{t(siteConfig.contactAddress)}</p></div>
                    <div className="flex items-center gap-6 md:gap-10 group cursor-default"><span className="text-3xl md:text-5xl group-hover:scale-125 transition-all">🌐</span><p className="group-hover:text-white transition-colors">{siteConfig.contactEmail}</p></div>
                    <div className="flex items-center gap-6 md:gap-10 group cursor-default" dir="ltr"><span className="text-3xl md:text-5xl group-hover:scale-125 transition-all">📱</span><p className="group-hover:text-white transition-colors">{siteConfig.contactPhone}</p></div>
                 </div>
              </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-20 md:mt-60 pt-10 md:pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-600 font-black tracking-[0.2em] md:tracking-[0.5em] text-[8px] md:text-xs uppercase text-center md:text-right">
               <span>{siteConfig.siteName} {t(siteConfig.galleryTitle)} &copy; {new Date().getFullYear()}</span>
               <span>ISO 27001 SECURED SYSTEM</span>
            </div>
          </footer>
        </>
      ) : (
        <section className="relative pt-[40vh] pb-60 px-8 md:px-24 min-h-screen">
          <div className="max-w-[1200px] mx-auto glass-card p-24 md:p-40 rounded-[6rem] shadow-4xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full bg-sky-500"></div>
            {activeCustomPage ? (
              <div className="space-y-24">
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white border-r-[15px] border-sky-500 pr-16">{activeCustomPage.title}</h1>
                <div className="prose prose-invert prose-2xl max-w-none text-slate-300 font-bold leading-[2.5] dynamic-content-render" dangerouslySetInnerHTML={{ __html: activeCustomPage.content }} />
              </div>
            ) : (
              <div className="text-center py-40 space-y-12">
                <h1 className="text-[15rem] font-black text-white/5">404</h1>
                <h2 className="text-6xl font-black text-white">{t('content_not_available')}</h2>
                <button onClick={() => setCurrentPath('home')} className="px-20 py-8 bg-sky-600 rounded-[3rem] font-black text-3xl hover:bg-sky-500 transition-all">{t('back_to_financial_center')}</button>
              </div>
            )}
          </div>
        </section>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
