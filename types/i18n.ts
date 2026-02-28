export enum Language {
  EN = 'en',
  AR = 'ar',
  FR = 'fr',
  TR = 'tr',
  ZH = 'zh',
  KU = 'ku',
  RU = 'ru',
}

export const RTL_LANGUAGES = [Language.AR, Language.KU];

export interface Translations {
  [key: string]: {
    [key in Language]?: string;
  } | any;
}

export interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  isRtl: boolean;
}


