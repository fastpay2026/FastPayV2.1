import React from 'react';
import { SiteConfig, LandingService, CustomPage, User } from '../../types';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../../i18n/i18n';

interface LandingPageProps {
  siteConfig: SiteConfig;
  services: LandingService[];
  pages: CustomPage[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  user: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ siteConfig, setCurrentPath, onLoginClick, onRegisterClick }) => {
  const { t, isRtl } = useI18n();

  return (
    <div className={`min-h-screen bg-[#020617] text-white font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Navbar */}
      <nav className="bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10 p-4 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={siteConfig.logoUrl} alt={siteConfig.siteName} className="h-10 w-auto" />
            <span className="text-xl font-black tracking-tighter hidden md:block">{siteConfig.siteName}</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-white/60">
              <button onClick={() => setCurrentPath('home')} className="hover:text-sky-400 transition-colors">{t('nav_home')}</button>
              <button onClick={() => setCurrentPath('raffle')} className="hover:text-sky-400 transition-colors">{t('raffle')}</button>
              <button onClick={() => setCurrentPath('swift')} className="hover:text-sky-400 transition-colors">{t('nav_swift')}</button>
              <button onClick={() => setCurrentPath('gateway')} className="hover:text-sky-400 transition-colors">{t('nav_gateway')}</button>
              <button onClick={() => setCurrentPath('transfer')} className="hover:text-sky-400 transition-colors">{t('nav_transfer')}</button>
              <button onClick={() => setCurrentPath('trading')} className="hover:text-sky-400 transition-colors">{t('nav_trading')}</button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 border-l border-white/10 pl-4 md:pl-8 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 md:rtl:pr-8">
              {/* زر تغيير اللغة - الآن بجانب تسجيل الدخول مباشرة ومرئي دائماً */}
              <div className="relative z-[9999]">
                <LanguageSwitcher />
              </div>

              <button 
                onClick={onLoginClick} 
                className="px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white/5 transition-all whitespace-nowrap"
              >
                {t('login')}
              </button>

              <button 
                onClick={onRegisterClick} 
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-black shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                {t('register')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#38bdf820,transparent_50%)]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-black mb-8">
            {t('global_excellence')}
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tight leading-[0.9] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            {t('hero_title')}
          </h1>
          <p className="text-lg md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button onClick={onRegisterClick} className="bg-white text-black font-black py-5 px-12 rounded-2xl text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10">
              {t('open_royal_account')}
            </button>
            <button className="bg-white/5 border border-white/10 text-white font-black py-5 px-12 rounded-2xl text-lg transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
              {t('contact_management')}
            </button>
          </div>
        </div>
      </header>

      {/* Advertising Sections - استخدام t() مباشرة للإصلاح */}
      <main className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        
        {/* Section 1: Salary Financing */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="text-sky-400 font-black text-sm uppercase tracking-widest">{t('smart_salary_financing')}</div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">{t('salary_ad_title')}</h2>
            <p className="text-xl text-white/60 leading-relaxed">{t('salary_ad_desc')}</p>
            <div className="pt-4">
              <button className="group flex items-center gap-3 text-white font-bold hover:text-sky-400 transition-colors">
                {t('hero_cta_text')}
                <span className="w-8 h-px bg-white/20 group-hover:bg-sky-400 transition-all"></span>
              </button>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-sky-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <img src={siteConfig.salaryAdImage} alt="Salary" className="relative rounded-[2rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </section>

        {/* Section 2: Trading Engine */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative group order-2 lg:order-1">
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <img src={siteConfig.tradingAdImage} alt="Trading" className="relative rounded-[2rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <div className="text-emerald-400 font-black text-sm uppercase tracking-widest">{t('professional_trading_engine')}</div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">{t('trading_ad_title')}</h2>
            <p className="text-xl text-white/60 leading-relaxed">{t('trading_ad_desc')}</p>
            <div className="pt-4">
              <button className="group flex items-center gap-3 text-white font-bold hover:text-emerald-400 transition-colors">
                {t('hero_cta_text')}
                <span className="w-8 h-px bg-white/20 group-hover:bg-emerald-400 transition-all"></span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Monthly Raffle */}
        <section className="relative p-12 md:p-24 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-purple-700 overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-widest">{t('raffle')}</div>
              <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">{t('raffle_ad_title')}</h2>
              <p className="text-xl text-white/80 leading-relaxed">{t('raffle_ad_desc')}</p>
              <button className="bg-white text-indigo-600 font-black py-5 px-12 rounded-2xl text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl">
                {t('hero_cta_text')}
              </button>
            </div>
            <div className="relative">
              <img src={siteConfig.raffleAdImage} alt="Raffle" className="rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </section>

        {/* Section 4: Global Liquidity (Swift) */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="text-sky-400 font-black text-sm uppercase tracking-widest">{t('nav_swift')}</div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">{t('transfer_ad_title')}</h2>
            <p className="text-xl text-white/60 leading-relaxed">{t('transfer_ad_desc')}</p>
          </div>
          <div className="relative group">
            <img src={siteConfig.transferAdImage} alt="Swift" className="relative rounded-[2rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </section>

        {/* Section 5: Checkout Gateway */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative group order-2 lg:order-1">
            <img src={siteConfig.gatewayAdImage} alt="Gateway" className="relative rounded-[2rem] border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <div className="text-sky-400 font-black text-sm uppercase tracking-widest">{t('nav_gateway')}</div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">{t('gateway_ad_title')}</h2>
            <p className="text-xl text-white/60 leading-relaxed">{t('gateway_ad_desc')}</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-white/5 py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <img src={siteConfig.logoUrl} alt="Logo" className="h-12" />
            <p className="text-white/40 max-w-md leading-relaxed font-medium">{t('footer_about')}</p>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-sm uppercase tracking-widest">{t('footer_links_title')}</h4>
            <ul className="space-y-4 text-white/60 font-bold text-sm">
              <li><button className="hover:text-sky-400 transition-colors">{t('footer_link1_text')}</button></li>
              <li><button className="hover:text-sky-400 transition-colors">{t('footer_link2_text')}</button></li>
              <li><button className="hover:text-sky-400 transition-colors">{t('footer_link3_text')}</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-sm uppercase tracking-widest">{t('contact_section_title')}</h4>
            <ul className="space-y-4 text-white/60 font-bold text-sm">
              <li>{siteConfig.contactEmail}</li>
              <li>{siteConfig.contactPhone}</li>
              <li>{siteConfig.contactAddress}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-white/20 text-xs font-bold">
          &copy; {new Date().getFullYear()} {siteConfig.siteName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};


export default LandingPage;
