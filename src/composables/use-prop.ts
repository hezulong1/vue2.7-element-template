import type { ComputedRef } from 'vue';
import { computed, getCurrentInstance } from 'vue';

export function useRawProp<T>(name: string): ComputedRef<T | undefined> {
  const vm = getCurrentInstance();
  return computed(() => {
    const value = (vm?.proxy?.$options?.propsData as any)?.[name];
    return typeof value !== 'undefined' ? (vm!.proxy as any)[name] : value;
  });
}
