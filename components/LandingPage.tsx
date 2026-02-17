
import React, { useEffect, useState, useRef } from 'react';
import { SiteConfig, LandingService, CustomPage, User } from '../types';

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
  
  const activeCustomPage = pages.find(p => p.slug === currentPath && p.isActive);
  const [speedLines, setSpeedLines] = useState<number[]>([]);
  
  const [marketData, setMarketData] = useState<MarketAsset[]>([
    { id: '1', name: 'الذهب الملكي', price: 2410.50, change: 1.1, icon: '📀' },
    { id: '2', name: 'بيتكوين (BTC)', price: 92421.10, change: 4.5, icon: '₿' },
    { id: '3', name: 'نفط برنت', price: 88.14, change: 1.3, icon: '🛢️' },
    { id: '4', name: 'إيثيريوم (ETH)', price: 2845.30, change: -0.8, icon: '💎' },
    { id: '5', name: 'EUR / USD', price: 1.0842, change: 0.05, icon: '🇪🇺' },
    { id: '6', name: 'GBP / USD', price: 1.2654, change: 0.12, icon: '🇬🇧' },
    { id: '7', name: 'USD / JPY', price: 151.20, change: -0.22, icon: '🇯🇵' },
    { id: '8', name: 'ناسداك 100', price: 18240.5, change: 0.65, icon: '📊' },
    { id: '9', name: 'آبل (AAPL)', price: 192.42, change: 1.2, icon: '🍎' },
    { id: '10', name: 'انفيديا (NVDA)', price: 1150.20, change: 3.4, icon: '🟢' },
  ]);

  useEffect(() => {
    setSpeedLines(Array.from({ length: 15 }, () => Math.random() * 100));
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(asset => {
        const volatility = 0.0005;
        const move = (Math.random() - 0.5) * asset.price * volatility;
        const newPrice = asset.price + move;
        const isUp = move > 0;
        return {
          ...asset,
          price: Number(newPrice.toFixed(asset.price < 10 ? 5 : 2)),
          flash: isUp ? 'up' : 'down',
          isUp: isUp
        };
      }));
      setTimeout(() => {
        setMarketData(prev => prev.map(a => ({ ...a, flash: null })));
      }, 1000);
    }, 3000);
    return () => clearInterval(interval);
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
    <div className="flex flex-col min-h-screen bg-[#020617] text-white overflow-x-hidden text-right" dir="rtl">
      
      <div className="fixed inset-0 z-0 bg-mesh opacity-60"></div>
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {speedLines.map((top, idx) => (
          <div key={idx} className="speed-line" style={{ top: `${top}%`, left: '-10%', width: '30%', animationDelay: `${idx * 0.2}s` }}></div>
        ))}
      </div>

      <div className="fixed top-0 w-full z-[100] bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4 overflow-hidden">
         <div className="flex animate-marquee whitespace-nowrap gap-20 items-center">
            {[...marketData, ...marketData].map((asset, idx) => (
              <div key={`${asset.id}-${idx}`} className={`flex items-center gap-4 font-black text-[11px] tracking-widest group cursor-default transition-all duration-1000 ${asset.flash === 'up' ? 'text-emerald-400 scale-105' : asset.flash === 'down' ? 'text-red-400 scale-105' : 'text-white'}`}>
                 <span className="text-white/40 group-hover:text-sky-400 transition-colors">{asset.icon} {asset.name}</span>
                 <span className={`font-mono text-sm transition-colors duration-300 ${asset.flash === 'up' ? 'text-emerald-400' : asset.flash === 'down' ? 'text-red-400' : 'text-white'}`}>
                   ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}
                 </span>
                 <span className={`font-mono text-[10px] ${asset.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {asset.change >= 0 ? '▲' : '▼'} {Math.abs(asset.change)}%
                 </span>
              </div>
            ))}
         </div>
      </div>

      <nav className="fixed w-full z-[90] top-14 px-8 md:px-24">
        <div className="max-w-[1600px] mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] py-6 px-12 md:px-20 flex justify-between items-center shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
          <div className={`flex items-center gap-12 group cursor-pointer flex-1 ${siteConfig.logoPosition === 'center' ? 'justify-center' : siteConfig.logoPosition === 'left' ? 'justify-start' : 'justify-end'}`} onClick={() => setCurrentPath('home')}>
            {siteConfig.logoUrl && (
              <img 
                src={siteConfig.logoUrl} 
                alt="Logo" 
                style={{ width: `${siteConfig.logoWidth || 180}px` }}
                className="object-contain transform group-hover:scale-110 transition-all duration-700" 
              />
            )}
            {siteConfig.logoPosition === 'right' && (
                <span className="text-3xl font-black tracking-tighter hidden xl:block bg-gradient-to-r from-white to-sky-400 bg-clip-text text-transparent">
                  {siteConfig.siteName}
                </span>
            )}
          </div>
          
          <div className="hidden lg:flex space-x-reverse space-x-12 text-slate-400 font-black text-[13px] uppercase tracking-widest mx-12">
            {[
              { label: 'الرئيسية', id: 'home' },
              { label: 'القرعة', id: 'raffle-ad' },
              { label: 'Swift', id: 'transfer-ad' },
              { label: 'بوابة الدفع', id: 'gateway-ad' },
              { label: 'التمويل', id: 'salary-ad' },
              { label: 'التداول', id: 'trading-ad' }
            ].map((item, idx) => (
              <button key={idx} onClick={() => item.id === 'home' ? setCurrentPath('home') : scrollToSection(item.id)} className="hover:text-white transition-all relative py-2 group">
                {item.label}
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-sky-500 group-hover:w-full transition-all duration-500"></span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-8">
            <button onClick={onLoginClick} className="px-10 py-4 rounded-3xl text-white bg-sky-600 font-black text-base hover:bg-sky-500 transition-all shadow-2xl shadow-sky-900/40">الدخول</button>
            <button onClick={onRegisterClick} className="px-10 py-4 rounded-3xl text-slate-200 bg-white/5 border border-white/10 font-black text-base hover:bg-white/10 transition-all hidden sm:block">انظم معنا</button>
          </div>
        </div>
      </nav>

      {currentPath === 'home' ? (
        <>
          <section className="relative pt-[35vh] pb-32 px-8 md:px-24 z-10 overflow-hidden">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-24">
              <div className="w-full lg:w-[55%] space-y-12 order-2 lg:order-1">
                 <div className="inline-flex items-center gap-4 px-8 py-3 bg-sky-500/10 border border-sky-500/20 rounded-full shadow-[0_0_50px_rgba(14,165,233,0.2)]">
                    <span className="w-3 h-3 bg-sky-500 rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9]"></span>
                    <span className="text-sky-400 font-black text-xs uppercase tracking-[0.3em]">نظام {siteConfig.siteName} v5.5 Premium</span>
                 </div>
                 <h1 className="text-5xl md:text-[6.5rem] font-black leading-[1.1] tracking-tighter hero-gradient-text text-glow" dangerouslySetInnerHTML={{ __html: siteConfig.heroTitle.replace(' ', '<br/>') }}></h1>
                 <p className="text-xl md:text-3xl text-slate-300 max-w-3xl leading-relaxed font-bold border-r-[12px] border-sky-500 pr-8">{siteConfig.heroSubtitle}</p>
                 <div className="flex flex-wrap gap-8 pt-6">
                    <button onClick={onRegisterClick} className="px-14 py-6 rounded-[2.5rem] bg-white text-black font-black text-2xl shadow-[0_25px_60px_rgba(255,255,255,0.2)] hover:scale-105 transition-all flex items-center gap-6 group">
                      <span>{siteConfig.heroCtaText}</span>
                      <span className="text-3xl group-hover:translate-x-[-10px] transition-transform">⚡</span>
                    </button>
                    <button onClick={() => scrollToSection('services')} className="px-14 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-white font-black text-2xl backdrop-blur-3xl hover:bg-white/10 transition-all">{siteConfig.salesCtaText}</button>
                 </div>
              </div>
              
              <div className="w-full lg:w-[45%] order-1 lg:order-2">
                 <div className="relative animate-float group">
                    <div className="relative w-full aspect-[1.58/1] rounded-[3.5rem] border border-white/20 shadow-[0_80px_160px_rgba(0,0,0,0.9)] overflow-hidden p-12 flex flex-col justify-between backdrop-blur-3xl bg-black/40 card-shimmer">
                       <div className="absolute inset-0 holo-glow"></div>
                       <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                       
                       <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-4">
                            {siteConfig.logoUrl && <img src={siteConfig.logoUrl} style={{ width: `120px` }} className="opacity-90 filter brightness-200" alt="Logo" />}
                            <div className="flex items-center gap-3">
                               <div className="w-16 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg border border-amber-300/30 overflow-hidden relative">
                                  <div className="absolute inset-0 flex flex-col gap-1.5 p-2">
                                     <div className="h-px bg-black/20 w-full"></div>
                                     <div className="h-px bg-black/20 w-full"></div>
                                     <div className="h-px bg-black/20 w-full"></div>
                                     <div className="h-px bg-black/20 w-full"></div>
                                  </div>
                               </div>
                               <div className="text-[20px]">📶</div>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-[12px] font-black tracking-[0.4em] text-white/40 uppercase">Sovereign Edition</p>
                            <p className="text-[14px] font-black text-sky-400 mt-1">WORLD ELITE</p>
                          </div>
                       </div>

                       <div className="relative z-10 space-y-4">
                          <div className="text-3xl md:text-5xl font-mono tracking-[0.25em] text-white drop-shadow-lg">
                             7724 <span className="opacity-20">•</span> 9912 <span className="opacity-20">•</span> 0042 <span className="opacity-20">•</span> 1109
                          </div>
                       </div>

                       <div className="flex justify-between items-end relative z-10">
                          <div className="space-y-2">
                             <p className="text-[10px] text-white/30 font-black tracking-widest uppercase">ELITE ASSET HOLDER</p>
                             <p className="text-2xl font-black tracking-[0.1em] text-white uppercase">{user?.fullName || "FASTPAY MEMBER"}</p>
                          </div>
                          <div className="flex -space-x-4 opacity-90 scale-125">
                             <div className="w-14 h-14 bg-red-600 rounded-full shadow-lg"></div>
                             <div className="w-14 h-14 bg-amber-500 rounded-full shadow-lg mix-blend-screen"></div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Transfer/Swift Section */}
          <section id="transfer-ad" className="py-40 px-8 md:px-24">
            <div className="max-w-[1800px] mx-auto group glass-card rounded-[6rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[700px] shadow-3xl border border-emerald-500/10 hover:border-emerald-500/40 transition-all duration-1000 relative">
               <div className="w-full lg:w-[55%] p-20 md:p-32 space-y-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-6 text-emerald-400 font-black text-sm uppercase tracking-[0.5em]"><span className="w-20 h-px bg-emerald-500"></span>محرك السيولة العالمي</div>
                  <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter group-hover:text-emerald-400 transition-all duration-700">{siteConfig.transferAdTitle}</h2>
                  <p className="text-2xl md:text-3xl text-slate-200 font-bold leading-relaxed border-r-8 border-emerald-500 pr-10">{siteConfig.transferAdDesc}</p>
                  <div className="flex flex-wrap gap-8 items-center pt-8">
                    <button onClick={onLoginClick} className="bg-emerald-600 px-20 py-8 rounded-[3rem] font-black text-2xl hover:bg-emerald-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(16,185,129,0.3)] w-max">ابدأ التحويل العالمي 🌐</button>
                    <div className="flex items-center gap-4 text-slate-500 font-black text-xs uppercase tracking-widest bg-white/5 px-6 py-3 rounded-full">
                       <span>Swift Secured</span>
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       <span>Instant P2P</span>
                    </div>
                  </div>
               </div>
               <div className="w-full lg:w-[45%] relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.transferAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Global Transfers" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent hidden lg:block"></div>
               </div>
            </div>
          </section>

          {/* New Payment Gateway Section */}
          <section id="gateway-ad" className="py-40 px-8 md:px-24">
            <div className="max-w-[1800px] mx-auto group glass-card rounded-[6rem] overflow-hidden flex flex-col lg:flex-row-reverse items-stretch min-h-[700px] shadow-3xl border border-violet-500/10 hover:border-violet-500/40 transition-all duration-1000 relative">
               <div className="w-full lg:w-[55%] p-20 md:p-32 space-y-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-6 text-violet-400 font-black text-sm uppercase tracking-[0.5em]"><span className="w-20 h-px bg-violet-500"></span>بوابة الدفع الاحترافية</div>
                  <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter group-hover:text-violet-400 transition-all duration-700">{siteConfig.gatewayAdTitle}</h2>
                  <p className="text-2xl md:text-3xl text-slate-200 font-bold leading-relaxed border-r-8 border-violet-500 pr-10">{siteConfig.gatewayAdDesc}</p>
                  <div className="flex flex-wrap gap-8 items-center pt-8">
                    <button onClick={onLoginClick} className="bg-violet-600 px-20 py-8 rounded-[3rem] font-black text-2xl hover:bg-violet-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(124,58,237,0.3)] w-max">تفعيل بوابة الدفع 🚀</button>
                    <div className="flex -space-x-4">
                       {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-12 h-12 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-xs font-black shadow-lg overflow-hidden">
                             <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="Merchant" />
                          </div>
                       ))}
                       <div className="w-12 h-12 rounded-full border-2 border-[#020617] bg-violet-600 flex items-center justify-center text-[10px] font-black shadow-lg">+500</div>
                    </div>
                  </div>
               </div>
               <div className="w-full lg:w-[45%] relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.gatewayAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Payment Gateway" />
                  <div className="absolute inset-0 bg-gradient-to-l from-[#020617] via-transparent to-transparent hidden lg:block"></div>
               </div>
            </div>
          </section>

          <section id="raffle-ad" className="py-40 px-8 md:px-24">
            <div className="max-w-[1800px] mx-auto group glass-card rounded-[6rem] overflow-hidden flex flex-col lg:flex-row-reverse items-stretch min-h-[800px] shadow-[0_50px_120px_rgba(0,0,0,0.7)] border border-amber-500/10 hover:border-amber-500/40 transition-all duration-1000 relative">
               <div className="w-full lg:w-[55%] p-20 md:p-32 space-y-12 flex flex-col justify-center relative z-10 bg-gradient-to-br from-slate-950 via-[#020617] to-indigo-950/20">
                  <div className="flex items-center gap-6 text-amber-500 font-black text-sm uppercase tracking-[0.5em]"><span className="w-20 h-px bg-amber-500"></span>سحب FastPay الشهري</div>
                  <h2 className="text-6xl md:text-9xl font-black text-white leading-tight tracking-tighter group-hover:text-amber-400 transition-all duration-700">{siteConfig.raffleAdTitle}</h2>
                  <p className="text-2xl md:text-3xl text-slate-200 font-bold leading-relaxed border-r-8 border-amber-500 pr-10">{siteConfig.raffleAdDesc}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6">
                     <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                        <span className="text-5xl">🏎️</span>
                        <h4 className="text-xl font-black">سيارة Porsche 911 GT3</h4>
                        <p className="text-sm text-slate-500 font-bold">اصدار 2024 الرياضي - ملك الطريق</p>
                     </div>
                     <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                        <span className="text-5xl">🕋</span>
                        <h4 className="text-xl font-black">رحلة عمرة ملكية (VIP)</h4>
                        <p className="text-sm text-slate-500 font-bold">اقامة في جناح مطل على الحرم - طيران خاص</p>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-8 items-center pt-8">
                    <button onClick={onRegisterClick} className="bg-amber-600 px-20 py-8 rounded-[3rem] font-black text-2xl hover:bg-amber-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(245,158,11,0.3)] w-max">احجز تذكرتك {siteConfig.raffleEntryCost}$</button>
                    <p className="text-slate-500 font-black text-sm animate-pulse tracking-widest">المقاعد محدودة جداً لهذا السحب</p>
                  </div>
               </div>
               <div className="w-full lg:w-[45%] relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.raffleAdImage} className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-90 transition-all duration-[8s]" alt="Sports Car" />
                  <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent hidden lg:block"></div>
                  <div className="absolute top-12 left-12 bg-white text-black p-8 rounded-full font-black text-center shadow-2xl animate-bounce">
                     <p className="text-xs">قيمة الجائزة تتجاوز</p>
                     <p className="text-3xl tracking-tighter">$250,000</p>
                  </div>
               </div>
            </div>
          </section>

          {activeAds.length > 0 && (
            <section id="dynamic-ads" className="py-20 px-8 md:px-24">
               <div className="max-w-[1600px] mx-auto space-y-20">
                  <div className="flex items-center gap-12">
                     <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white">حملاتنا العالمية</h2>
                     <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                     {activeAds.map(ad => (
                        <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="group glass-card rounded-[4rem] overflow-hidden flex flex-col shadow-2xl hover:border-sky-500/40 transition-all duration-700 hover:-translate-y-4">
                           <div className="h-80 relative overflow-hidden">
                              <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt={ad.title} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                           </div>
                           <div className="p-10 space-y-4">
                              <h3 className="text-3xl font-black text-white group-hover:text-sky-400 transition-colors">{ad.title}</h3>
                              <div className="flex items-center gap-4 text-sky-500 font-black text-sm uppercase tracking-widest">
                                 <span>اكتشف المزيد</span>
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
            <div id="salary-ad" className="group glass-card rounded-[6rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[700px] shadow-3xl border border-indigo-500/10 hover:border-indigo-500/40 transition-all duration-1000 relative">
               <div className="w-full lg:w-[55%] p-20 md:p-32 space-y-12 flex flex-col justify-center relative z-10">
                  <div className="flex items-center gap-6 text-indigo-400 font-black text-sm uppercase tracking-[0.5em]"><span className="w-20 h-px bg-indigo-500"></span>ابتكار مالي حصري</div>
                  <h2 className="text-6xl md:text-8xl font-black text-white leading-tight tracking-tighter group-hover:text-indigo-400 transition-all duration-700">{siteConfig.salaryAdTitle}</h2>
                  <p className="text-2xl md:text-3xl text-slate-200 font-bold leading-relaxed border-r-8 border-indigo-500 pr-10">{siteConfig.salaryAdDesc}</p>
                  <button onClick={onRegisterClick} className="bg-indigo-600 px-20 py-8 rounded-[3rem] font-black text-2xl hover:bg-indigo-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(79,70,229,0.3)] w-max">اطلب التمويل المسبق</button>
               </div>
               <div className="w-full lg:w-[45%] relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.salaryAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Salary" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent hidden lg:block"></div>
               </div>
            </div>

            <div id="trading-ad" className="group glass-card rounded-[6rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[700px] shadow-3xl hover:border-sky-500/30 transition-all duration-1000">
               <div className="w-full lg:w-[55%] p-20 md:p-32 space-y-12 flex flex-col justify-center">
                  <div className="flex items-center gap-6 text-sky-400 font-black text-sm uppercase tracking-[0.5em]"><span className="w-20 h-px bg-sky-500"></span>تداول بمستوى النخبة</div>
                  <h2 className="text-6xl md:text-9xl font-black text-white leading-tight tracking-tighter group-hover:text-glow transition-all duration-700">{siteConfig.tradingAdTitle}</h2>
                  <p className="text-2xl md:text-3xl text-slate-300 font-bold leading-relaxed border-r-8 border-sky-500 pr-10">{siteConfig.tradingAdDesc}</p>
                  <button onClick={onLoginClick} className="bg-sky-600 px-20 py-8 rounded-[3rem] font-black text-2xl hover:bg-sky-500 hover:scale-105 transition-all shadow-[0_30px_60px_rgba(14,165,233,0.4)] w-max">دخول المنصة الاحترافية</button>
               </div>
               <div className="w-full lg:w-[45%] relative bg-slate-900 overflow-hidden">
                  <img src={siteConfig.tradingAdImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-[5s]" alt="Trading" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent hidden lg:block"></div>
               </div>
            </div>
          </section>

          <section id="services" className="py-60 px-8 md:px-24">
             <div className="max-w-[1600px] mx-auto">
                <div className="text-center space-y-8 mb-40">
                   <h2 className="text-7xl md:text-9xl font-black text-white tracking-tighter">{siteConfig.servicesTitle}</h2>
                   <h3 className="text-2xl md:text-3xl text-slate-400 font-bold max-w-4xl mx-auto">{siteConfig.servicesSubtitle}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                   {services.map(s => (
                      <div key={s.id} className="group p-20 glass-card rounded-[5rem] hover:bg-white/5 transition-all duration-700 hover:-translate-y-8 relative overflow-hidden">
                         <div className="text-[10rem] mb-16 filter drop-shadow-[0_20px_50px_rgba(14,165,233,0.3)] transform group-hover:scale-110 transition-transform duration-700 text-center">{s.icon}</div>
                         <h3 className="text-5xl font-black mb-10 text-white group-hover:text-sky-400 transition-colors">{s.title}</h3>
                         <p className="text-xl md:text-2xl text-slate-400 font-bold leading-[2] group-hover:text-slate-200 transition-colors">{s.description}</p>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          <footer className="bg-[#020617] py-60 px-8 md:px-32 border-t border-white/5 relative z-10 overflow-hidden">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-40">
              <div className="space-y-16">
                {siteConfig.logoUrl && <img src={siteConfig.logoUrl} style={{ width: `${siteConfig.logoWidth}px` }} alt="Logo" />}
                <p className="text-2xl text-slate-400 font-bold leading-[2.2] max-w-2xl">{siteConfig.footerAbout}</p>
              </div>
              <div className="space-y-16">
                 <h4 className="text-4xl font-black text-white border-r-[10px] border-sky-500 pr-10 tracking-tighter uppercase">{siteConfig.footerLinksTitle}</h4>
                 <ul className="space-y-10 text-slate-400 font-bold text-2xl">
                    {pages.filter(p=>p.isActive && p.showInFooter).map(p=>(
                      <li key={p.id} onClick={()=>setCurrentPath(p.slug)} className="hover:text-sky-400 transition-all cursor-pointer flex items-center gap-6"><span className="w-3 h-3 bg-sky-500 rounded-full shadow-[0_0_10px_#0ea5e9]"></span>{p.title}</li>
                    ))}
                    {[siteConfig.footerLink1Text, siteConfig.footerLink2Text, siteConfig.footerLink3Text, siteConfig.footerLink4Text].map(link => (
                      <li key={link} className="hover:text-white transition-all cursor-pointer flex items-center gap-6"><span className="w-3 h-3 bg-slate-700 rounded-full"></span>{link}</li>
                    ))}
                 </ul>
              </div>
              <div className="space-y-16">
                 <h4 className="text-4xl font-black text-white border-r-[10px] border-emerald-500 pr-10 tracking-tighter uppercase">{siteConfig.contactSectionTitle}</h4>
                 <div className="space-y-12 text-slate-400 font-bold text-2xl">
                    <div className="flex items-start gap-10 group cursor-default"><span className="text-5xl group-hover:scale-125 transition-all">📍</span><p className="group-hover:text-white transition-colors leading-relaxed">{siteConfig.contactAddress}</p></div>
                    <div className="flex items-center gap-10 group cursor-default"><span className="text-5xl group-hover:scale-125 transition-all">🌐</span><p className="group-hover:text-white transition-colors">{siteConfig.contactEmail}</p></div>
                    <div className="flex items-center gap-10 group cursor-default" dir="ltr"><span className="text-5xl group-hover:scale-125 transition-all">📱</span><p className="group-hover:text-white transition-colors">{siteConfig.contactPhone}</p></div>
                 </div>
              </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-60 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-600 font-black tracking-[0.5em] text-xs uppercase">
               <span>{siteConfig.siteName} GLOBAL FINANCIAL INFRASTRUCTURE &copy; {new Date().getFullYear()}</span>
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
                <h2 className="text-6xl font-black text-white">المحتوى غير متوفر حالياً</h2>
                <button onClick={() => setCurrentPath('home')} className="px-20 py-8 bg-sky-600 rounded-[3rem] font-black text-3xl hover:bg-sky-500 transition-all">العودة للمركز المالي</button>
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
