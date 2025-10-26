import { createContext } from '@/composables/create-context';

const [provider, injection] = createContext('forwardRefSetter');

export type ForwardRefSetter<T = Element> = (el: T | null) => void;

export function providerForwardRefSetter<T = Element>(setForwardRef: ForwardRefSetter<T>) {
  provider(setForwardRef);
}

export function useForwardRefSetter<T = Element>(): ForwardRefSetter<T> | undefined;
export function useForwardRefSetter<T = Element>(fallback: ForwardRefSetter<T>): ForwardRefSetter<T>;
export function useForwardRefSetter<T>(fallback?: ForwardRefSetter<T>) {
  return injection(fallback);
}
