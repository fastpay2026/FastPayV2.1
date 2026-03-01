import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n/i18n';
import { Language } from '../../types/i18n';
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
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 backdrop-blur-md transition-all active:scale-95"
        onClick={toggleDropdown}
      >
        <Languages size={18} className="text-sky-400" />
        <span className="uppercase tracking-wider">{language}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-48 rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in duration-200"
          style={{ zIndex: 99999 }}
        >
          <div className="py-2">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${
                  lang.code === language 
                    ? 'bg-sky-500/20 text-sky-400' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                } block px-5 py-3 text-sm w-full text-left font-bold transition-colors`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
