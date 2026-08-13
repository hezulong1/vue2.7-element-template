import type { Arrayable } from '@vueuse/core';

export {
  looseEqual,
} from '@vue/shared';

export function ensureArray<T>(arr?: Arrayable<T> | null): T[] {
  if (!arr && (arr as any) !== 0) return [];
  return Array.isArray(arr) ? arr : [arr as T];
}
