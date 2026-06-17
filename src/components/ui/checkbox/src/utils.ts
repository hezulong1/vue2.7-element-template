import type { ComputedRef } from 'vue';
import type { ComponentSize } from '@/components/base/ConfigProvider';
import { inject, provide } from 'vue';

export type CheckboxValue = string | number | Record<string, any>;

export interface CheckboxGroupContext<T extends CheckboxValue = CheckboxValue> {
  modelValue: ComputedRef<T[]>;
  disabled: ComputedRef<boolean>;
  button: ComputedRef<boolean>;
  size: ComputedRef<ComponentSize | undefined>;
  min: ComputedRef<number | undefined>;
  max: ComputedRef<number | undefined>;
  name: ComputedRef<string>;
  setModelValue: (value: T, checked: boolean) => void;
}

const checkboxGroupContextKey = Symbol('checkboxGroupContext');

export function provideCheckboxGroup<T extends CheckboxValue>(context: CheckboxGroupContext<T>) {
  provide(checkboxGroupContextKey, context);
}

export function useCheckboxGroup<T extends CheckboxValue>(): CheckboxGroupContext<T> | undefined;
export function useCheckboxGroup<T extends CheckboxValue>(fallback: CheckboxGroupContext<T>): CheckboxGroupContext<T>;
export function useCheckboxGroup<T extends CheckboxValue>(fallback?: CheckboxGroupContext<T>) {
  return inject(checkboxGroupContextKey, fallback);
}
