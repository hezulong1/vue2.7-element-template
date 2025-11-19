import type { RadioGroupContext, RadioValue } from './typings';
import { inject, provide } from 'vue';

const radioGroupContextKey = Symbol('radioGroupContext');

export function provideRadioGroup<T extends RadioValue>(context: RadioGroupContext<T>) {
  provide(radioGroupContextKey, context);
}

export function useRadioGroup<T extends RadioValue>(): RadioGroupContext<T> | undefined;
export function useRadioGroup<T extends RadioValue>(fallback: RadioGroupContext<T>): RadioGroupContext<T>;
export function useRadioGroup<T extends RadioValue>(fallback?: RadioGroupContext<T>) {
  return inject(radioGroupContextKey, fallback);
}
