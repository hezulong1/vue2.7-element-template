import type { Language, LocaleMessages } from '.';
import { isClient } from '@vueuse/core';
import zhHans from './src/zh-Hans';
import localeMap from '.';

// 同时设置
export const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE;
export const defaultLocale = zhHans;

const loadedLanguages = new Map<string, LocaleMessages>([[defaultLanguage, defaultLocale]]);

export interface I18n {
  readonly lang: Language;
  readonly locale: LocaleMessages;
}

export const i18n = new class I18n implements I18n {
  constructor(
    public lang: Language = defaultLanguage,
  ) { }
  get locale() {
    return loadedLanguages.get(this.lang)!;
  }
}();

function setLanguage(lang: Language) {
  i18n.lang = lang;
  if (isClient) document.documentElement.setAttribute('lang', lang);
  return i18n;
}

export async function loadLocaleMessages(lang: string) {
  if (i18n.lang === lang) {
    return setLanguage(lang);
  }

  const locale = loadedLanguages.get(lang);
  if (locale) {
    return setLanguage(lang as Language);
  }

  const loaded = await localeMap[lang]();
  loadedLanguages.set(lang, loaded.default);

  return setLanguage(lang);
}
