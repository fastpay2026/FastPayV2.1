import React, { useState, useEffect } from 'react';
import { SiteConfig } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
}

const SiteIdentity: React.FC<Props> = ({ siteConfig, onUpdateConfig }) => {
  const { t } = useI18n();
  const [editingLang, setEditingLang] = useState<'ar' | 'en'>('ar');
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'navigation' | 'hero' | 'ads_campaigns' | 'footer_services' | 'visibility' | 'login_portal'>('branding');
  
  // Non-localized values and general settings
  const [tempConfig, setTempConfig] = useState<SiteConfig>(siteConfig);

  // Deep clone and load siteConfig values initially
  useEffect(() => {
    setTempConfig(siteConfig);
  }, [siteConfig]);

  // Keys that are fully localized (translated in Ar and En)
  const localizedKeys = [
    'heroTitle', 'heroSubtitle', 'heroCtaText', 'salesCtaText',
    'servicesTitle', 'servicesSubtitle',
    'gatewayAdTitle', 'gatewayAdDesc', 'gatewayCtaText',
    'raffleAdTitle', 'raffleAdDesc', 'raffleCtaText', 'rafflePrize1Title', 'rafflePrize1Desc', 'rafflePrize2Title', 'rafflePrize2Desc',
    'salaryAdTitle', 'salaryAdDesc', 'salaryCtaText',
    'tradingAdTitle', 'tradingAdDesc', 'tradingCtaText',
    'footerAbout', 'footerLinksTitle', 'contactSectionTitle', 'galleryTitle',
    'navHomeText', 'navRaffleText', 'navGatewayText', 'navTransferText', 'navTradingText',
    'footerLink1Text', 'footerLink2Text', 'footerLink4Text',
    'loginRoleDevTitle', 'loginRoleDevDesc',
    'loginRoleDistTitle', 'loginRoleDistDesc',
    'loginRoleAgentTitle', 'loginRoleAgentDesc',
    'loginRoleMerchantTitle', 'loginRoleMerchantDesc',
    'loginRoleUserTitle', 'loginRoleUserDesc'
  ];

  type ValueMap = Record<string, { ar: string; en: string }>;
  const [localTexts, setLocalTexts] = useState<ValueMap>({});

  // Populate localized values on mount / config change
  useEffect(() => {
    const initialTexts: ValueMap = {};
    
    localizedKeys.forEach(key => {
      const rawVal = ((siteConfig as any)[key] || '') as string;
      if (rawVal.trim().startsWith('{') && rawVal.trim().endsWith('}')) {
        try {
          const parsed = JSON.parse(rawVal);
          initialTexts[key] = {
            ar: parsed.ar || '',
            en: parsed.en || ''
          };
        } catch {
          initialTexts[key] = { ar: rawVal, en: rawVal };
        }
      } else {
        // Known fallbacks
        const fallbacks: Record<string, { ar: string; en: string }> = {
          heroTitle: { ar: 'بوابتك الذكية للتمويل الرقمي والخدمات المالية', en: 'Your Smart Digital Finance & Services Gateway' },
          heroSubtitle: { ar: 'خدمات سحب فوري، تداول احترافي، تمويل رواتب، والمشاركة في السحوبات والمسابقات الكبرى على منصة واحدة آمنة.', en: 'Instant withdrawals, professional trading, salary funding, and major prize draws on a single secure platform.' },
          heroCtaText: { ar: 'سجل الآن مجاناً', en: 'Register Now for Free' },
          salesCtaText: { ar: 'استكشف الخدمات الذكية', en: 'Explore Smart Services' },
          servicesTitle: { ar: 'حزمة الخدمات والوثائق والمستندات الرسمية', en: 'All Official Services Documents & Corporate Licenses' },
          servicesSubtitle: { ar: 'تصفح قائمة الوثائق والمستندات واللوائح والاتفاقيات الخاصة بنا بأكثر من لغة.', en: 'Browse our corporate documents, regulations, guidelines, and agreements in multiple languages.' },
          gatewayAdTitle: { ar: 'بوابة قبول مدفوعات USDT الأكثر أماناً', en: 'The Most Secure USDT Payment Gateway' },
          gatewayAdDesc: { ar: 'عوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة بعمولات تنافسية تبدأ من 0.8% فقط.', en: 'Convert your e-commerce into a global leading payment platform with margins starting at just 0.8%.' },
          gatewayCtaText: { ar: 'تفعيل بوابة الدفع المتطورة', en: 'Activate Advanced Gateway' },
          raffleAdTitle: { ar: 'السحب الكلاسيكي الكبير والجوائز العملاقة', en: 'Standard Mega Draw & Corporate Prizes' },
          raffleAdDesc: { ar: 'احجز تذاكر السحب لفرص حصرية للربح الفوري أو الفوز بجوائز Porsche الكبرى أو تذاكر العمرة السنوية.', en: 'Book tickets for exclusive opportunities to win instant cash, luxury Porsche, or annual Umrah travel passes.' },
          raffleCtaText: { ar: 'حجز التذاكر الآن', en: 'Reserve Tickets Now' },
          rafflePrize1Title: { ar: 'بورشه تايكان Porsche', en: 'Porsche Taycan luxury sport' },
          rafflePrize1Desc: { ar: 'سيارة كهربائية خارقة بقوة تفوق الخيال.', en: 'Outstanding performance luxury electric supercar.' },
          rafflePrize2Title: { ar: 'تأشيرات ورحلات عمرة سنوية متكاملة', en: 'Grand Umrah fully-funded packages' },
          rafflePrize2Desc: { ar: 'تفاصيل الرحلة والمسكن شاملة بالكامل.', en: 'All-inclusive flight passes and hotel stays included.' },
          salaryAdTitle: { ar: 'التمويل المسبق للرواتب والتغطيات المالية', en: 'Instant Salary Pre-Financing Options' },
          salaryAdDesc: { ar: 'حلول تمويلية ذكية للرواتب تضمن لك تسييل الأموال والرواتب مسبقاً قبل موعد نزولها بجدولة سداد ميسرة.', en: 'Smart financing options allowing you to withdraw salary advances prior to pay-day with fully flexible terms.' },
          salaryCtaText: { ar: 'طلب تمويل فوري مسبق لراتبك', en: 'Request Advance Funding Now' },
          tradingAdTitle: { ar: 'بيئة تداول عالمية متكاملة لجميع الأصول', en: 'Global Integrated Trading Environment' },
          tradingAdDesc: { ar: 'تداول في سوق فوركس، السلع، الذهب، الأسهم والعملات الرقمية بأضيق فروقات أسعار وعمولة فائقة الصغر.', en: 'Trade Forex, Commodities, Gold, Equities, and Cryptocurrencies with microscopic spreads and premium safety.' },
          tradingCtaText: { ar: 'دخول منصة التداول الاحترافية PRO', en: 'Access Elite PRO Trading Suite' },
          footerAbout: { ar: 'أقوى بنية تحتية مالية رقمية متكاملة تضمن مستويات تشغيل فائقة الأمان وسرعة تنفيذ غير مسبوقة لكافة الخدمات الفردية والتجارية.', en: 'The most powerful integrated digital financial infrastructure ensuring elite security and unprecedented execution speed.' },
          footerLinksTitle: { ar: 'روابط هامة وسريعة', en: 'Quick & Essential Links' },
          contactSectionTitle: { ar: 'تواصل مع الإدارة المالية والدعم الفني', en: 'Contact Corporate Office & Financial Support' },
          galleryTitle: { ar: 'تراخيص ووثائق الخدمات', en: 'Service Licenses & Corporate Docs' },
          navHomeText: { ar: 'الرئيسية', en: 'Corporate Home' },
          navRaffleText: { ar: 'السحب والقرعة', en: 'Mega Draw' },
          navGatewayText: { ar: 'بوابة الدفع USDT', en: 'USDT Gateway' },
          navTransferText: { ar: 'تمويل الرواتب', en: 'Salary Funding' },
          navTradingText: { ar: 'منصة التداول PRO', en: 'PRO Trading Platform' },
          footerLink1Text: { ar: 'سياسة الخصوصية وأمن المعلومات', en: 'Privacy & Cybersecurity Policy' },
          footerLink2Text: { ar: 'شروط الخدمة والسياسات العامة', en: 'Terms of Use & General Policies' },
          footerLink4Text: { ar: 'وثائق الشركة والتراخيص', en: 'Company Documents' },
          loginRoleDevTitle: { ar: 'الإدارة التنفيذية', en: 'Executive Management' },
          loginRoleDevDesc: { ar: 'إدارة الشبكة والسيولة المالية', en: 'Network & cash liquidity management' },
          loginRoleDistTitle: { ar: 'منصة الموزعين', en: 'Distributors Platform' },
          loginRoleDistDesc: { ar: 'عمليات الربط والمبيعات المباشرة', en: 'Integration operations & direct sales' },
          loginRoleAgentTitle: { ar: 'Agent Portal', en: 'Agent Portal' },
          loginRoleAgentDesc: { ar: 'Agent secure access portal', en: 'Agent secure access portal' },
          loginRoleMerchantTitle: { ar: 'جناح التاجر', en: 'Merchant Suite' },
          loginRoleMerchantDesc: { ar: 'إدارة الصفقات والاعتمادات المستندية', en: 'Deals management & digital letter of credits' },
          loginRoleUserTitle: { ar: 'المحفظة الرقمية', en: 'Digital Wallet' },
          loginRoleUserDesc: { ar: 'الحوالات والمدفوعات الشخصية', en: 'Personal money transfers & instant payments' }
        };
        initialTexts[key] = fallbacks[key] || { ar: rawVal, en: rawVal };
      }
    });
    setLocalTexts(initialTexts);
  }, [siteConfig]);

  const handleTextChange = (key: string, value: string) => {
    setLocalTexts(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [editingLang]: value
      }
    }));
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();

    // Clone configuration object
    const updatedConfig = { ...siteConfig };

    // Apply translation variables as JSON strings
    Object.keys(localTexts).forEach(key => {
      (updatedConfig as any)[key] = JSON.stringify(localTexts[key]);
    });

    // Copy general settings
    updatedConfig.logoUrl = tempConfig.logoUrl;
    updatedConfig.logoWidth = tempConfig.logoWidth;
    updatedConfig.siteName = tempConfig.siteName;
    updatedConfig.contactEmail = tempConfig.contactEmail;
    updatedConfig.contactPhone = tempConfig.contactPhone;
    updatedConfig.contactAddress = tempConfig.contactAddress;
    updatedConfig.raffleEntryCost = Number(tempConfig.raffleEntryCost) || 100;
    updatedConfig.raffleEndDate = tempConfig.raffleEndDate;
    updatedConfig.showRaffleCountdown = tempConfig.showRaffleCountdown;
    
    // Copy new image URLs
    updatedConfig.gatewayAdImage = tempConfig.gatewayAdImage;
    updatedConfig.raffleAdImage = tempConfig.raffleAdImage;
    updatedConfig.salaryAdImage = tempConfig.salaryAdImage;
    updatedConfig.tradingAdImage = tempConfig.tradingAdImage;

    // Copy section visibility configs
    updatedConfig.hideHeroSection = !!tempConfig.hideHeroSection;
    updatedConfig.hideRaffleSection = !!tempConfig.hideRaffleSection;
    updatedConfig.hideGatewaySection = !!tempConfig.hideGatewaySection;
    updatedConfig.hideSalarySection = !!tempConfig.hideSalarySection;
    updatedConfig.hideTradingSection = !!tempConfig.hideTradingSection;
    updatedConfig.hideServicesSection = !!tempConfig.hideServicesSection;
    updatedConfig.adminCustomPath = tempConfig.adminCustomPath || '';
    updatedConfig.hideAuthButtons = !!tempConfig.hideAuthButtons;
    updatedConfig.disabledLanguages = tempConfig.disabledLanguages || [];
    updatedConfig.hideDevRole = !!tempConfig.hideDevRole;
    updatedConfig.hideDistRole = !!tempConfig.hideDistRole;
    updatedConfig.hideAgentRole = !!tempConfig.hideAgentRole;
    updatedConfig.hideMerchantRole = !!tempConfig.hideMerchantRole;
    updatedConfig.hideUserRole = !!tempConfig.hideUserRole;
    updatedConfig.hideRegisterOption = !!tempConfig.hideRegisterOption;

    onUpdateConfig(updatedConfig);
    alert('✅ تم تطبيق كافة تعديلات نصوص وصور الواجهة بنجاح وبكلا اللغتين!');
  };

  const getVal = (key: string) => {
    return localTexts[key]?.[editingLang] || '';
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right pb-40 text-right" dir="rtl">
      <div>
        <h2 className="text-5xl font-black tracking-tighter text-white">إشهار المحتوى ونصوص الواجهة الديناميكية</h2>
        <p className="text-sm text-slate-400 mt-2">تحكم كامل بكل نصوص ومترجمات الصفحة الرئيسية والتنقل والإعلانات الترويجية بمختلف اللغات.</p>
      </div>

      {/* Language Editing Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827] p-8 rounded-[2rem] border border-white/5 shadow-xl gap-4">
        <div>
          <h4 className="text-2xl font-black text-white">لغة الإشهار والتحرير الحالية</h4>
          <p className="text-xs text-slate-500 mt-1">اختر اللغة لتعديل نصوص الصفحة الرئيسية المخصصة لها.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditingLang('ar')}
            className={`px-8 py-3.5 rounded-2xl font-black transition-all text-sm outline-none flex items-center gap-2 ${editingLang === 'ar' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <span>🇸🇦</span> العربية (AR)
          </button>
          <button
            type="button"
            onClick={() => setEditingLang('en')}
            className={`px-8 py-3.5 rounded-2xl font-black transition-all text-sm outline-none flex items-center gap-2 ${editingLang === 'en' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <span>🇺🇸</span> English (EN)
          </button>
        </div>
      </div>

      {/* Sub-tabs Selection with elegant design */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {[
          { id: 'branding', label: 'العلامة التجارية والهوية', icon: '🎨' },
          { id: 'navigation', label: 'شريط التنقل وقنوات الموقع', icon: '🔗' },
          { id: 'hero', label: 'القسم الترويجي الأول (Hero)', icon: '🚀' },
          { id: 'ads_campaigns', label: 'الحملات الإعلانية والصور', icon: '📢' },
          { id: 'footer_services', label: 'الخدمات وحواشي الفوتر', icon: '📦' },
          { id: 'visibility', label: 'إظهار وإخفاء الأقسام والتبويبات', icon: '👁️' },
          { id: 'login_portal', label: 'بوابات وأزرار الدخول', icon: '👥' }
        ].map((subTab) => (
          <button
            key={subTab.id}
            type="button"
            onClick={() => setActiveSubTab(subTab.id as any)}
            className={`px-6 py-3 rounded-2xl font-black text-xs md:text-sm transition-all flex items-center gap-2 ${activeSubTab === subTab.id ? 'bg-white text-black shadow-lg font-black' : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'}`}
          >
            <span>{subTab.icon}</span>
            <span>{subTab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSaveConfig} className="bg-[#0f172a] p-10 md:p-12 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-10">

        {/* Branding Tab */}
        {activeSubTab === 'branding' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="text-2xl font-black border-r-8 border-sky-500 pr-5 uppercase tracking-widest text-sky-400">العلامة البرمجية والهوية البصرية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">رابط صورة الشعار (Logo URL)</label>
                <input value={tempConfig.logoUrl} onChange={e => setTempConfig({ ...tempConfig, logoUrl: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-sky-500 transition-all text-left" dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">اسم المؤسسة / الشبكة المالية (Site Name)</label>
                <input value={tempConfig.siteName} onChange={e => setTempConfig({ ...tempConfig, siteName: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-sky-500 transition-all" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">أقصى عرض للوغو (Logo Width)</label>
                <div className="flex items-center gap-6 bg-black/30 p-4 rounded-2xl border border-white/5">
                  <input type="range" min="60" max="300" value={tempConfig.logoWidth || 180} onChange={e => setTempConfig({ ...tempConfig, logoWidth: parseInt(e.target.value) })} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                  <span className="font-black text-sky-400 w-20 text-center text-sm">{tempConfig.logoWidth || 180}px</span>
                </div>
              </div>
            </div>
            
            <h4 className="text-lg font-black border-r-4 border-slate-500 pr-3 text-slate-300 mt-10">روابط الاتفاقيات وتوثيق الشركة بالفوتر</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">اسم رابط سياسة الخصوصية</label>
                <input value={getVal('footerLink1Text')} onChange={e => handleTextChange('footerLink1Text', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">اسم رابط شروط الخدمة</label>
                <input value={getVal('footerLink2Text')} onChange={e => handleTextChange('footerLink2Text', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">اسم رابط مستندات الشركة القانونية</label>
                <input value={getVal('footerLink4Text')} onChange={e => handleTextChange('footerLink4Text', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-sky-500" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation upper bar Tab */}
        {activeSubTab === 'navigation' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="text-2xl font-black border-r-8 border-violet-500 pr-5 uppercase tracking-widest text-violet-400">شريط التنقل وقنوات المقاطع الرئسية (Header Navbar Links)</h3>
            <p className="text-xs text-slate-400">تغيير العناوين الظاهرة للتنقل داخل الصفحة بمرونة تامة للغتين.</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الرابط 1: الرئيسية</label>
                <input value={getVal('navHomeText')} onChange={e => handleTextChange('navHomeText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500 transition-all text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الرابط 2: السحب والقرعة</label>
                <input value={getVal('navRaffleText')} onChange={e => handleTextChange('navRaffleText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500 transition-all text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الرابط 3: بوابة المدفوعات</label>
                <input value={getVal('navGatewayText')} onChange={e => handleTextChange('navGatewayText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500 transition-all text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الرابط 4: تمويل الرواتب</label>
                <input value={getVal('navTransferText')} onChange={e => handleTextChange('navTransferText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500 transition-all text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الرابط 5: التداول PRO</label>
                <input value={getVal('navTradingText')} onChange={e => handleTextChange('navTradingText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500 transition-all text-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Hero Section Tab */}
        {activeSubTab === 'hero' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="text-2xl font-black border-r-8 border-emerald-500 pr-5 uppercase tracking-widest text-emerald-400">القسم الترحيبي الأول (Hero Intro Banner)</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">العنوان التمهيدي الرئيسي</label>
                <input value={getVal('heroTitle')} onChange={e => handleTextChange('heroTitle', e.target.value)} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-emerald-500 transition-all text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase mr-2">الوصف اللحاقي التمهيدي</label>
                <textarea value={getVal('heroSubtitle')} onChange={e => handleTextChange('heroSubtitle', e.target.value)} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-medium outline-none h-32 focus:border-emerald-500 transition-all text-sm leading-relaxed" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase mr-2">نص زر التوثيق والاشتراك الأيسر</label>
                  <input value={getVal('heroCtaText')} onChange={e => handleTextChange('heroCtaText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase mr-2">نص زر تصفح المستندات الأيمن</label>
                  <input value={getVal('salesCtaText')} onChange={e => handleTextChange('salesCtaText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-bold outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotional Ads with Campaign Images */}
        {activeSubTab === 'ads_campaigns' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            <h3 className="text-2xl font-black border-r-8 border-amber-500 pr-5 uppercase tracking-widest text-amber-400">إدارة نصوص الإعلانات الترويجية والصور الجذابة</h3>
            <p className="text-xs text-slate-500">تحكم كامل بكل إعلانات الصفحة الرئيسية: العناوين، الأوصاف، صور الحملات والروابط الترويجية.</p>

            {/* 1. Payment Gateway */}
            <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
              <h4 className="text-lg font-black text-violet-400 flex items-center gap-2"><span>💳</span> 1. إعلان بوابة دفع USDT الاحترافية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">رابط صورة إعلان البوابة (Gateway Image URL)</label>
                  <input value={tempConfig.gatewayAdImage || ''} onChange={e => setTempConfig({ ...tempConfig, gatewayAdImage: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-semibold outline-none focus:border-violet-500 text-left text-xs" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">عنوان الإعلان</label>
                  <input value={getVal('gatewayAdTitle')} onChange={e => handleTextChange('gatewayAdTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">نص زر تفعيل الخدمة (CTA Text)</label>
                  <input value={getVal('gatewayCtaText')} onChange={e => handleTextChange('gatewayCtaText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-violet-500" placeholder="مثال: تفعيل بوابة الدفع" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">وصف الإعلان الترويجي</label>
                  <textarea value={getVal('gatewayAdDesc')} onChange={e => handleTextChange('gatewayAdDesc', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-medium outline-none focus:border-violet-500 h-24 text-sm" />
                </div>
              </div>
            </div>

            {/* 2. Monthly Draw */}
            <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
              <h4 className="text-lg font-black text-amber-500 flex items-center gap-2"><span>🎟️</span> 2. إعلان القرعة السنوية والسحوبات الكلاسيكية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">رابط صورة إعلان القرعة والجوائز (Raffle Image URL)</label>
                  <input value={tempConfig.raffleAdImage || ''} onChange={e => setTempConfig({ ...tempConfig, raffleAdImage: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-semibold outline-none focus:border-amber-500 text-left text-xs" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">عنوان القرعة الكبير</label>
                  <input value={getVal('raffleAdTitle')} onChange={e => handleTextChange('raffleAdTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">نص زر حجز التذكرة</label>
                  <input value={getVal('raffleCtaText')} onChange={e => handleTextChange('raffleCtaText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">وصف السحب وباقي السحوبات</label>
                  <textarea value={getVal('raffleAdDesc')} onChange={e => handleTextChange('raffleAdDesc', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-medium outline-none focus:border-amber-500 h-24 text-sm" />
                </div>

                {/* Sub Cards: Porsche and Umrah customizable boxes */}
                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                  <h5 className="font-bold text-amber-500">مربع الجائزة الأولى (الافتراضية: بورشه)</h5>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400">العنوان</label>
                    <input value={getVal('rafflePrize1Title')} onChange={e => handleTextChange('rafflePrize1Title', e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400">الوصف</label>
                    <input value={getVal('rafflePrize1Desc')} onChange={e => handleTextChange('rafflePrize1Desc', e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs" />
                  </div>
                </div>

                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                  <h5 className="font-bold text-amber-500">مربع الجائزة الثانية (الافتراضية: عمرة)</h5>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400">العنوان</label>
                    <input value={getVal('rafflePrize2Title')} onChange={e => handleTextChange('rafflePrize2Title', e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400">الوصف</label>
                    <input value={getVal('rafflePrize2Desc')} onChange={e => handleTextChange('rafflePrize2Desc', e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs" />
                  </div>
                </div>

                {/* General Raffle control */}
                <div className="space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <label className="text-[10px] font-bold text-slate-400">تكلفة بطاقة المشاركة بالـ USDT</label>
                  <input type="number" value={tempConfig.raffleEntryCost || 100} onChange={e => setTempConfig({ ...tempConfig, raffleEntryCost: parseInt(e.target.value) || 100 })} className="w-full p-4 bg-[#0a0c10] border border-white/10 rounded-xl font-bold text-sky-400" />
                </div>
                <div className="space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <label className="text-[10px] font-bold text-slate-400">تاريخ غلق واحتساب القرعة بالتقويم</label>
                  <input type="datetime-local" value={tempConfig.raffleEndDate ? tempConfig.raffleEndDate.slice(0, 16) : ''} onChange={e => setTempConfig({ ...tempConfig, raffleEndDate: new Date(e.target.value).toISOString() })} className="w-full p-4 bg-[#0a0c10] border border-white/10 rounded-xl font-bold text-sky-400 text-left" dir="ltr" />
                </div>
                <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-950/60 rounded-xl border border-white/5">
                  <input type="checkbox" id="show-raffle-countdown" checked={tempConfig.showRaffleCountdown} onChange={e => setTempConfig({ ...tempConfig, showRaffleCountdown: e.target.checked })} className="w-6 h-6 accent-sky-500 rounded cursor-pointer" />
                  <label htmlFor="show-raffle-countdown" className="text-sm font-black text-slate-300 select-none cursor-pointer">إظهار عداد الأيام والتنازل الباقي مباشرة فوق القرعة</label>
                </div>
              </div>
            </div>

            {/* 3. Salary Pre-Financing */}
            <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
              <h4 className="text-lg font-black text-indigo-400 flex items-center gap-2"><span>💸</span> 3. إعلان التمويل المسبق للرواتب</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">رابط صورة إعلان الراتب (Salary Image URL)</label>
                  <input value={tempConfig.salaryAdImage || ''} onChange={e => setTempConfig({ ...tempConfig, salaryAdImage: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-semibold outline-none focus:border-indigo-500 text-left text-xs" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">عنوان الإعلان</label>
                  <input value={getVal('salaryAdTitle')} onChange={e => handleTextChange('salaryAdTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">نص زر طلب التمويل المقابل</label>
                  <input value={getVal('salaryCtaText')} onChange={e => handleTextChange('salaryCtaText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">وصف إعلان الراتب لعامة الموظفين</label>
                  <textarea value={getVal('salaryAdDesc')} onChange={e => handleTextChange('salaryAdDesc', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-medium outline-none focus:border-indigo-500 h-24 text-sm" />
                </div>
              </div>
            </div>

            {/* 4. Trading Pro Suite */}
            <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
              <h4 className="text-lg font-black text-sky-400 flex items-center gap-2"><span>📈</span> 4. إعلان منصة التداول الاحترافية PRO</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">رابط صورة إعلان التداول والأصول (Trading Image URL)</label>
                  <input value={tempConfig.tradingAdImage || ''} onChange={e => setTempConfig({ ...tempConfig, tradingAdImage: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-semibold outline-none focus:border-sky-500 text-left text-xs" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">عنوان الإعلان</label>
                  <input value={getVal('tradingAdTitle')} onChange={e => handleTextChange('tradingAdTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-sky-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">نص زر دخول منصة التداول والأسواق</label>
                  <input value={getVal('tradingCtaText')} onChange={e => handleTextChange('tradingCtaText', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-sky-500" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">وصف إعلان التداول والمزايا</label>
                  <textarea value={getVal('tradingAdDesc')} onChange={e => handleTextChange('tradingAdDesc', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-medium outline-none focus:border-sky-500 h-24 text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services & Footer Tab */}
        {activeSubTab === 'footer_services' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="text-2xl font-black border-r-8 border-slate-500 pr-5 uppercase tracking-widest text-slate-400">الخدمات وعناوين التواصل ومعلومات الفوتر الحاشية الكلية</h3>
            
            <h4 className="text-lg font-black text-sky-400 border-r-4 border-sky-400 pr-3">1. قسم الخدمات الرئيسي بالموقع</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">العنوان الرئيسي لقائمة الخدمات المتاحة بالموقع</label>
                <input value={getVal('servicesTitle')} onChange={e => handleTextChange('servicesTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-black outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">العنوان الفرعي اللحاقي لتبويب الخدمات</label>
                <input value={getVal('servicesSubtitle')} onChange={e => handleTextChange('servicesSubtitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-sky-500" />
              </div>
            </div>

            <h4 className="text-lg font-black text-emerald-400 border-r-4 border-emerald-400 pr-3 mt-8">2. نصوص التواصل بالموقع والفوتر</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">البريد الإلكتروني للشركة</label>
                <input value={tempConfig.contactEmail} onChange={e => setTempConfig({ ...tempConfig, contactEmail: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-emerald-500 text-left" dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">الهاتف والاتصال</label>
                <input value={tempConfig.contactPhone} onChange={e => setTempConfig({ ...tempConfig, contactPhone: e.target.value })} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-emerald-500 text-left" dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">عنوان ومقر الشركة بالتفصيل</label>
                <input value={getVal('contactAddress')} onChange={e => handleTextChange('contactAddress', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-emerald-500" />
              </div>
            </div>

            <h4 className="text-lg font-black text-slate-300 border-r-4 border-slate-300 pr-3 mt-8">3. عن الشركة وباقي أقسام التذييل</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">الصياغة الكلية والمختصرة "عن المؤسسة" أسفل اللوغو بالفوتر</label>
                <textarea value={getVal('footerAbout')} onChange={e => handleTextChange('footerAbout', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-medium outline-none focus:border-slate-500 h-28 text-sm leading-relaxed" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">عنوان ترويسة قائمة الروابط الهامة</label>
                <input value={getVal('footerLinksTitle')} onChange={e => handleTextChange('footerLinksTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">عنوان ترويسة قائمة الاتصال</label>
                <input value={getVal('contactSectionTitle')} onChange={e => handleTextChange('contactSectionTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 mr-2">عنوان حقوق الملكية بجوار اللوغو</label>
                <input value={getVal('galleryTitle')} onChange={e => handleTextChange('galleryTitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none col-span-2" />
              </div>
            </div>
          </div>
        )}

        {/* Visibility Tab with modern animated switches */}
        {activeSubTab === 'visibility' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black border-r-8 border-slate-500 pr-5 uppercase tracking-widest text-slate-400">إظهار وإخفاء الأقسام والتبويبات بالصفحة الرئيسية</h3>
              <p className="text-sm text-slate-400 mt-2">من هنا يمكنك إخفاء أو إظهار أي قسم من الصفحة الرئيسية كلياً، وسيقوم النظام تلقائياً بفلترة وحذف التبويب من أشرطة التنقل العلوية والقوائم لتوفير واجهة مستخدم متناسقة وديناميكية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Hero Section Card */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-sky-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-sky-400">🚀 القسم الترويجي الأول (Hero)</h4>
                  <p className="text-xs text-slate-500">يتضمن العناوين الترحيبية الكبرى، زر التسجيل وزر الخدمات التفاعلي الرئيسي.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, hideHeroSection: !tempConfig.hideHeroSection })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideHeroSection ? 'bg-sky-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideHeroSection ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Gateway Section Card */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-violet-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-violet-400">💳 بوابة الدفع USDT</h4>
                  <p className="text-xs text-slate-500">القسم الترويجي لبوابة قبول مدفوعات العملات الرقمية للتجار وأصحاب المواقع.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, hideGatewaySection: !tempConfig.hideGatewaySection })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideGatewaySection ? 'bg-violet-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideGatewaySection ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Raffle Section Card */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-amber-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-amber-400">🎟️ السحب والقرعة الشهرية</h4>
                  <p className="text-xs text-slate-500">قسم إعلان جوائز القرعة الكبرى، العداد التنازلي، وحجز تذاكر المشاركة.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, hideRaffleSection: !tempConfig.hideRaffleSection })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideRaffleSection ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideRaffleSection ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Salary Section Card */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-indigo-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-indigo-400">💰 التمويل المسبق للرواتب</h4>
                  <p className="text-xs text-slate-500">إعلان تمويل رواتب الموظفين للحصول على سداد بنكي مسبق بجدولة جيدة.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, hideSalarySection: !tempConfig.hideSalarySection })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideSalarySection ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideSalarySection ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Trading Section Card */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-sky-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-sky-400">📈 منصة التداول والأسواق PRO</h4>
                  <p className="text-xs text-slate-500">إعلان بيئة التداول السريعة لتداول الذهب الأصول والعملات الرقمية الفورية.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, hideTradingSection: !tempConfig.hideTradingSection })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideTradingSection ? 'bg-sky-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideTradingSection ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Services Section Card */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-emerald-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-emerald-400">📦 الوثائق والتراخيص الرسمية</h4>
                  <p className="text-xs text-slate-500">قسم عرض اللوائح، التراخيص الحكومية، والمستندات القانونية والمستندات.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempConfig({ ...tempConfig, hideServicesSection: !tempConfig.hideServicesSection })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideServicesSection ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideServicesSection ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Auth Buttons Visibility Card */}
              <div className="md:col-span-2 p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-emerald-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-emerald-400">👤 أزرار تسجيل الدخول وإنشاء حساب بالرئيسية</h4>
                  <p className="text-xs text-slate-500">يقوم هذا الخيار بإظهار أو إخفاء أزرار تسجيل الدخول وإنشاء حساب من الواجهة الرئيسية وشريط التنقل للهواتف وأجهزة الكمبيوتر بشكل كامل.</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold transition-colors ${!tempConfig.hideAuthButtons ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {!tempConfig.hideAuthButtons ? '✅ ظاهرة حالياً' : '👁️‍🗨️ مخفية حالياً'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, hideAuthButtons: !tempConfig.hideAuthButtons })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideAuthButtons ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideAuthButtons ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Custom Admin Login Entrance URL Setup */}
              <div className="md:col-span-2 p-8 bg-slate-900/60 rounded-3xl border border-white/5 space-y-4 hover:border-sky-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white">🔐 بوابة دخول المدير المخصصة (عنوان URL السري)</h4>
                  <p className="text-xs text-slate-400">حدد رابطًا سريًا ومخصصًا عبر الهاش (Hash) للدخول المباشر للوحة الإدارة التنفيذية، لحماية موقعك وتجنب تثبيت رابط الدخول أمام الزوار العاديين.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm select-none">#/</span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-6 py-4 bg-slate-950/80 border border-white/10 rounded-2xl outline-none focus:border-sky-500 text-white font-mono text-sm font-bold text-left"
                      value={tempConfig.adminCustomPath || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, adminCustomPath: e.target.value.trim().replace(/[^a-zA-Z0-9_-]/g, '') })}
                      placeholder="admin-secure-portal"
                    />
                  </div>
                </div>
                {tempConfig.adminCustomPath && (
                  <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-slate-300 space-y-2">
                    <p className="text-xs font-bold font-mono text-sky-400 text-right">سوف تتمكن من الوصول إلى لوحة تحكم الإدارة العليا عبر هذا الرابط السري فقط:</p>
                    <p className="text-xs selection:bg-sky-500/30 font-mono select-all break-all text-emerald-400 bg-black/40 p-3 rounded-lg border border-white/5 text-left">
                      {window.location.origin}/#{tempConfig.adminCustomPath}
                    </p>
                  </div>
                )}

                {/* Custom direct domain-specific help links */}
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-slate-300 space-y-4">
                  <h5 className="text-sm font-black text-emerald-400 text-right">🔗 روابط الدخول المباشرة لاسم النطاق fastflow-group.uk :</h5>
                  <p className="text-xs text-slate-400 text-right leading-relaxed">بإمكانك الدخول لوحة تحكم الأدمن مباشرة من خلال كتابة أحد الروابط السريعة التالية في المتصفح:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-left font-mono text-xs">
                    <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] font-black text-sky-400 block text-right">رابط الهاش المباشر (موصى به - يعمل دائماً):</span>
                      <p className="text-emerald-400 font-bold select-all break-all text-left">https://www.fastflow-group.uk/#admin</p>
                      <p className="text-slate-500 font-bold text-right text-[9px] mt-1">كما يمكنك استخدام الهاش السري الخاص بك</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] font-black text-sky-400 block text-right">رابط المسار المباشر (Direct Path):</span>
                      <p className="text-emerald-400 font-bold select-all break-all text-left">https://www.fastflow-group.uk/admin</p>
                      <p className="text-slate-500 font-bold text-right text-[9px] mt-1">أو عبر المسار المباشر: /control-panel</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black text-sky-400 block text-right">رابط رمز الاستعلام المباشر:</span>
                      <p className="text-emerald-400 font-bold select-all break-all text-left">https://www.fastflow-group.uk/?admin=true</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enabled Languages Setup Card */}
              <div className="md:col-span-2 p-8 bg-slate-900/60 rounded-3xl border border-white/5 space-y-4 hover:border-emerald-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-emerald-400">🌐 اللغات المعروضة بالصفحة الرئيسية</h4>
                  <p className="text-xs text-slate-500">اختر اللغات التي ترغب في إظهارها في شريط اختيار اللغات بالصفحة الرئيسية. اللغات غير المحددة سيتم إخفاؤها تماماً من زوار الموقع.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {[
                    { code: 'ar', label: 'العربية (AR)' },
                    { code: 'en', label: 'English (EN)' },
                    { code: 'fr', label: 'Français (FR)' },
                    { code: 'tr', label: 'Türkçe (TR)' },
                    { code: 'zh', label: '中文 (ZH)' },
                    { code: 'ku', label: 'Kurdî (KU)' },
                    { code: 'ru', label: 'Русский (RU)' }
                  ].map((lang) => {
                    const isDisabled = (tempConfig.disabledLanguages || []).includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          const currentDisabled = tempConfig.disabledLanguages || [];
                          let nextDisabled = [];
                          if (isDisabled) {
                            nextDisabled = currentDisabled.filter(c => c !== lang.code);
                          } else {
                            nextDisabled = [...currentDisabled, lang.code];
                          }
                          setTempConfig({ ...tempConfig, disabledLanguages: nextDisabled });
                        }}
                        className={`p-4 rounded-xl border font-bold text-xs flex items-center justify-between gap-3 transition-all ${
                          !isDisabled 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'
                        }`}
                      >
                        <span>{lang.label}</span>
                        <span className="text-lg">{!isDisabled ? '👁️' : '🙈'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Portal Roles Setup Tab */}
        {activeSubTab === 'login_portal' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h3 className="text-2xl font-black border-r-8 border-sky-500 pr-5 uppercase tracking-widest text-sky-400">بوابات وأزرار الدخول للأنظمة</h3>
            <p className="text-sm text-slate-400">من هنا يمكنك تعديل المسميات والوصف وتفعيل أو تعطيل (إخفاء) أي دور أو بوابة دخول من نافذة تسجيل الدخول الرئيسية.</p>
            
            <div className="space-y-8">
              {[
                {
                  id: 'Dev',
                  label: 'الإدارة التنفيذية (Executive)',
                  color: 'border-sky-500/20',
                  hideKey: 'hideDevRole',
                  titleKey: 'loginRoleDevTitle',
                  descKey: 'loginRoleDevDesc',
                  icon: '⚡'
                },
                {
                  id: 'Dist',
                  label: 'منصة الموزعين (Distributor)',
                  color: 'border-amber-500/20',
                  hideKey: 'hideDistRole',
                  titleKey: 'loginRoleDistTitle',
                  descKey: 'loginRoleDistDesc',
                  icon: '💼'
                },
                {
                  id: 'Agent',
                  label: 'بوابة الوكلاء (Agent Portal)',
                  color: 'border-purple-500/20',
                  hideKey: 'hideAgentRole',
                  titleKey: 'loginRoleAgentTitle',
                  descKey: 'loginRoleAgentDesc',
                  icon: '🕵️'
                },
                {
                  id: 'Merchant',
                  label: 'جناح التاجر (Merchant Suit)',
                  color: 'border-teal-500/20',
                  hideKey: 'hideMerchantRole',
                  titleKey: 'loginRoleMerchantTitle',
                  descKey: 'loginRoleMerchantDesc',
                  icon: '🏪'
                },
                {
                  id: 'User',
                  label: 'المحفظة الرقمية (Client Wallet)',
                  color: 'border-emerald-500/20',
                  hideKey: 'hideUserRole',
                  titleKey: 'loginRoleUserTitle',
                  descKey: 'loginRoleUserDesc',
                  icon: '👤'
                }
              ].map((role) => {
                const isHidden = !!(tempConfig as any)[role.hideKey];
                return (
                  <div key={role.id} className={`p-6 bg-slate-900/40 rounded-3xl border ${role.color} space-y-6 hover:border-sky-500/10 transition-all`}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{role.icon}</span>
                        <h4 className="text-lg font-black text-white">{role.label}</h4>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${isHidden ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isHidden ? '👁️‍🗨️ مخفي حالياً' : '✅ نشط ومظاهر في النافذة'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTempConfig({ ...tempConfig, [role.hideKey]: !isHidden })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!isHidden ? 'bg-sky-500' : 'bg-slate-700'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${!isHidden ? 'translate-x-[1.25rem]' : 'translate-x-[0.25rem]'}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الاسم المعروض للزر ({editingLang.toUpperCase()})</label>
                        <input
                          type="text"
                          value={getVal(role.titleKey)}
                          onChange={e => handleTextChange(role.titleKey, e.target.value)}
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-sky-500 transition-all text-sm text-white"
                          placeholder="الاسم المخصص..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-1">الوصف الفرعي المعروض للزر ({editingLang.toUpperCase()})</label>
                        <input
                          type="text"
                          value={getVal(role.descKey)}
                          onChange={e => handleTextChange(role.descKey, e.target.value)}
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-xl font-bold outline-none focus:border-sky-500 transition-all text-sm text-white"
                          placeholder="الوصف المخصص..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Toggle Hiding Register Option/Button */}
              <div className="p-8 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-between gap-6 hover:border-emerald-500/30 transition-all">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-emerald-400">⚡ خيار إنشاء حساب جديد داخل نافذة الدخول</h4>
                  <p className="text-xs text-slate-500">تحكم بظهور أو إخفاء جملة وزر "إنشاء حساب جديد" (Create New Account) المعروضة أسفل قائمة بوابات تسجيل الدخول.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold transition-colors ${!tempConfig.hideRegisterOption ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {!tempConfig.hideRegisterOption ? '✅ ظاهر حالياً' : '👁️‍عون مخفي حالياً'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempConfig({ ...tempConfig, hideRegisterOption: !tempConfig.hideRegisterOption })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${!tempConfig.hideRegisterOption ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${!tempConfig.hideRegisterOption ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Big Submit Button */}
        <button
          type="submit"
          className="w-full py-6 bg-sky-600 rounded-3xl font-black text-2xl shadow-2xl hover:bg-sky-500 transition-all text-white outline-none active:scale-[0.98] cursor-pointer mt-12"
        >
          حفظ وتطبيق كافة إعدادات ونصوص وصور الواجهة
        </button>
      </form>
    </div>
  );
};

export default SiteIdentity;
