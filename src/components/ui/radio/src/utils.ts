import type { ComputedRef } from 'vue';
import type { ComponentSize } from '@/components/base/ConfigProvider';
import { inject, provide } from 'vue';

export type RadioValue = string | number | boolean;

export interface RadioGroupContext<T extends RadioValue = RadioValue> {
  modelValue: ComputedRef<T>;
  disabled: ComputedRef<boolean>;
  button: ComputedRef<boolean>;
  size: ComputedRef<ComponentSize | undefined>;
  name: ComputedRef<string>;
  setModelValue: (value: T) => void;
}

const radioGroupContextKey = Symbol('radioGroupContext');

export function provideRadioGroup<T extends RadioValue>(context: RadioGroupContext<T>) {
  provide(radioGroupContextKey, context);
}

export function useRadioGroup<T extends RadioValue>(): RadioGroupContext<T> | undefined;
export function useRadioGroup<T extends RadioValue>(fallback: RadioGroupContext<T>): RadioGroupContext<T>;
export function useRadioGroup<T extends RadioValue>(fallback?: RadioGroupContext<T>) {
  return inject(radioGroupContextKey, fallback);
}
