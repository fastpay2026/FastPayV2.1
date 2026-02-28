import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/i18n';
import { Language } from '../types/i18n';
import { Languages } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  const supportedLanguages: { code: Language; name: string; }[] = [
    { code: Language.EN, name: t('languageName_en') },
    { code: Language.AR, name: t('languageName_ar') },
    { code: Language.FR, name: t('languageName_fr') },
    { code: Language.TR, name: t('languageName_tr') },
    { code: Language.ZH, name: t('languageName_zh') },
    { code: Language.KU, name: t('languageName_ku') },
    { code: Language.RU, name: t('languageName_ru') },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" style={{ zIndex: 99999 }} ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-black text-[11px] uppercase tracking-[0.2em] border border-white/10 backdrop-blur-xl transition-all duration-300 group"
        onClick={toggleDropdown}
      >
        <Languages size={14} className="text-sky-400 group-hover:scale-110 transition-transform" />
        <span>{language.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ zIndex: 99999 }}
        >
          <div className="p-2 space-y-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-between px-4 py-3 text-[12px] w-full rounded-xl font-black uppercase tracking-wider transition-all duration-200 ${
                  lang.code === language 
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{lang.name}</span>
                {lang.code === language && (
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#0ea5e9]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
