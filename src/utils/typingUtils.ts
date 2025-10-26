export type { Prettify } from '@vue/shared';

/**
 * 为了 TS 更好的提示
 */
export function objectKeys<T extends object>(obj: T): Array<keyof T & (string | number | boolean | null | undefined)> {
  return Object.keys(obj) as any;
}
