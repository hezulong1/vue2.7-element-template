import { inject, provide, type InjectionKey } from 'vue';

export const createContextKey = <T>(description: string) => Symbol(description + 'Context') as InjectionKey<T>;

export function createContext<Context>(description: string) {
  const contextKey = createContextKey<Context>(description);

  function provider<T extends Context>(context: T) {
    provide(contextKey, context);
  }

  function injection<T extends Context>(): T | undefined;
  function injection<T extends Context>(fallback: T): T;
  function injection<T extends Context>(fallback?: T) {
    return inject(contextKey, fallback);
  }

  return [provider, injection, contextKey] as const;
}
