import { hasOwn } from '@vue/shared';

export { hasOwn };

/**
 * 检查 `obj` 中是否存在 `key`
 *
 * @param obj 被查询的对象
 * @param key `obj` 中存在的键
 */
export function isKeyof<T extends object>(obj: T | undefined | null, key: keyof any): key is keyof T {
  if (!obj) return false;
  return key in obj;
}
