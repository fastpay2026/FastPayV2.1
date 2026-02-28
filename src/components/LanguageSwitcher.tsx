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
        className="flex items-center gap-2 rounded-lg px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        onClick={toggleDropdown}
      >
        <Languages size={18} strokeWidth={3} />
        <span>{language.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          style={{ zIndex: 99999 }}
        >
          <div className="py-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${
                  lang.code === language 
                    ? 'bg-yellow-400 text-black' 
                    : 'text-black hover:bg-gray-100'
                } block px-4 py-2 text-sm w-full text-left font-bold border-b last:border-0 border-black`}
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
