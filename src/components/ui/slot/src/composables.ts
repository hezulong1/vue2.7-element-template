import { inject, provide } from 'vue';

const forwardRefSetterContextKey = Symbol('forwardRefSetterContext');

export type ForwardRefSetter<T = Element> = (el: T | null) => void;

export function provideForwardRefSetter<T = Element>(setForwardRef: ForwardRefSetter<T>) {
  provide(forwardRefSetterContextKey, setForwardRef);
}

export function useForwardRefSetter<T = Element>(): ForwardRefSetter<T> | undefined;
export function useForwardRefSetter<T = Element>(fallback: ForwardRefSetter<T>): ForwardRefSetter<T>;
export function useForwardRefSetter<T>(fallback?: ForwardRefSetter<T>) {
  return inject(forwardRefSetterContextKey, fallback);
}
