import type { Language, LocaleMessages } from '.';
import { isClient } from '@vueuse/core';
import zhHans from './src/zh-Hans';
import localeMap from '.';

// 同时设置
export const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE;
export const defaultLocale = zhHans;

export const i18n = new class I18n {
  constructor(
    public lang: Language = defaultLanguage,
    public locale: LocaleMessages = defaultLocale,
  ) { }
}();

const loadedLanguages: string[] = [import.meta.env.VITE_DEFAULT_LANGUAGE];

function setLanguage(lang: Language) {
  i18n.lang = lang;
  if (isClient) {
    document.documentElement.setAttribute('lang', lang);
  }
  return lang;
}

export async function loadLocaleMessages(lang: string) {
  if (i18n.lang === lang) {
    return setLanguage(lang);
  }

  if (loadedLanguages.includes(lang)) {
    return setLanguage(lang as Language);
  }

  const locale = await localeMap[lang]();
  i18n.locale = locale.default;
  loadedLanguages.push(lang);

  return setLanguage(lang);
}
