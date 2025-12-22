import type { ComputedRef } from 'vue';
import { computed, getCurrentInstance } from 'vue';
import { hasOwn } from '@/utils/object';

export function useRawProp<T>(name: string): ComputedRef<T | undefined> {
  const vm = getCurrentInstance();
  return computed(() => {
    const value = (vm?.proxy?.$options?.propsData as any)?.[name];
    return typeof value !== 'undefined' ? (vm!.proxy as any)[name] : value;
  });
}

export function isAbsent(name: string): boolean {
  const vm = getCurrentInstance();
  const propsData = vm?.proxy.$options.propsData;
  return propsData ? !hasOwn(propsData, name) : true;
}
