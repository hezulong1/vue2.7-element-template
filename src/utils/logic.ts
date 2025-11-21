export function cacheStringFunction<T extends (str: string) => string>(fn: T): T {
  const cache: Record<string, string> = Object.create(null);
  return function cachedFn(str: string) {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  } as T;
}
