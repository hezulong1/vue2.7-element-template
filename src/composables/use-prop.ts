import type { ComputedRef } from 'vue';
import { computed, getCurrentInstance } from 'vue';

export function useRawProp<T>(name: string): ComputedRef<T | undefined> {
  const ins = getCurrentInstance();
  return computed(() => {
    const value = (ins?.proxy?.$options?.propsData as any)?.[name];
    return typeof value !== 'undefined' ? (ins!.proxy as any)[name] : value;
  });
}
