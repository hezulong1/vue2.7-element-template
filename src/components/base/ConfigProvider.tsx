import type { ComputedRef, InjectionKey, PropOptions, PropType } from 'vue';
import { computed, defineComponent, inject, provide } from 'vue';

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
  locale: ComputedRef<string>;
  theme: ComputedRef<string>;
}

const configProviderContextKey = '$configProviderContext' as unknown as InjectionKey<ConfigProviderContext>;

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
    provide(configProviderContextKey, {
      locale: computed(() => props.locale),
      theme: computed(() => props.theme),
    });

    return () => slots.default?.();
  },
});
