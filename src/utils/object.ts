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

/**
 * taked from naive-ui/_utils/vue.ts
 * 提取对象的某些属性生成新的对象
 */
export function objectOmit<T, K extends keyof T, R extends Record<string, any>>(
  object: T,
  keys: K[] = [],
  rest?: R,
): Omit<T, K> & (R extends undefined ? Record<string, unknown> : R) {
  const omitedObject: any = {};
  const originalKeys = Object.getOwnPropertyNames(object);
  originalKeys.forEach((originalKey) => {
    if (!(keys as string[]).includes(originalKey)) {
      omitedObject[originalKey] = object[originalKey as keyof T];
    }
  });
  return Object.assign(omitedObject, rest);
}

/**
 * 根据路径字符串获取对象中的值。
 *
 * 可以用于读取深层对象属性，支持连续访问 `a.b.c` 这样的路径。
 * 若中间某一层为 `null` 或 `undefined`，则直接返回 `undefined`。
 *
 * @param obj 目标对象
 * @param path 路径字符串，例如 `user.name`、`a.b.c`
 * @returns 路径对应的值；如果路径不存在或中途为空，则返回 `undefined`
 *
 * @example
 * const user = { name: 'Tom', profile: { age: 18, city: 'Beijing' } };
 * getByPath(user, 'name'); // 'Tom'
 * getByPath(user, 'profile.age'); // 18
 * getByPath(user, 'profile.city'); // 'Beijing'
 * getByPath(user, 'profile.address'); // undefined
 *
 * @example
 * const data = { a: { b: { c: 1 } } };
 * getByPath(data, 'a.b.c'); // 1
 * getByPath(data, 'a.d.c'); // undefined
 */
export function getByPath(obj: any, path: string) {
  const segments = path.split('.');
  const len = segments.length;

  let cur = obj;

  for (let i = 0; i < len; i++) {
    if (cur == null) return void 0;
    cur = cur[segments[i] as keyof typeof cur];
  }

  return cur;
}
