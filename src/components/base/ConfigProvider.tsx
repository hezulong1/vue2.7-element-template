import type { InjectionKey, PropType } from 'vue';
import type { LocaleMessages } from '@/locales';

import { computed, defineComponent, inject, provide, reactive } from 'vue';
import { defaultLocale } from '@/locales/utils';

export interface ConfigProviderContext {
  locale: LocaleMessages;
  theme: string;
}

const configProviderContextKey: InjectionKey<ConfigProviderContext> = Symbol('configProvider');

export function useConfigProvider() {
  const config = inject(configProviderContextKey, undefined);
  if (!config) {
    throw new Error('useConfigProvider must be used inside a ConfigProvider');
  }
  return config;
}

export default defineComponent({
  name: 'ConfigProvider',
  props: {
    locale: Object as PropType<LocaleMessages>,
    theme: String,
  },
  setup(props, { slots }) {
    const inheritContext = inject(configProviderContextKey, undefined);

    const localeRef = computed(() => props.locale || inheritContext?.locale || defaultLocale);
    const themeRef = computed(() => props.theme || inheritContext?.theme || import.meta.env.VITE_DEFAULT_THEME);

    const context: ConfigProviderContext = reactive({
      locale: localeRef,
      theme: themeRef,
    });

    provide(configProviderContextKey, context);
    return () => slots.default?.();
  },
});
