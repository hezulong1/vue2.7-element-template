import type { InjectionKey, PropOptions, PropType } from 'vue';

import { defineComponent, inject, provide, reactive, watchEffect } from 'vue';

// UseSize
// ----------------------------------------

const componentSizes = ['', 'small'] as const;
export type ComponentSize = typeof componentSizes[number];

export const useSizeProp: PropOptions<ComponentSize> = {
  type: String as PropType<ComponentSize>,
  default: '',
  validator: (value: ComponentSize) => componentSizes.includes(value),
};

// ConfigProvider
// ----------------------------------------

export interface ConfigProviderContext {
  locale: string;
  theme: string;
}

const configProviderContextKey = Symbol('configProvider') as InjectionKey<ConfigProviderContext>;

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
    locale: String,
    theme: String,
  },
  setup(props, { slots }) {
    const context = reactive({
      locale: '',
      theme: '',
    });

    watchEffect(() => {
      context.locale = props.locale || import.meta.env.VITE_DEFAULT_LANGUAGE;
      context.theme = props.theme || import.meta.env.VITE_DEFAULT_THEME;
    });

    provide(configProviderContextKey, context);
    return () => slots.default?.();
  },
});
