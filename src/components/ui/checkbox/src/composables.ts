import type { CheckboxGroupContext, CheckboxValue } from './typings';
import { inject, provide } from 'vue';

const checkboxGroupContextKey = Symbol('checkboxGroupContext');

export function provideCheckboxGroup<T extends CheckboxValue>(context: CheckboxGroupContext<T>) {
  provide(checkboxGroupContextKey, context);
}

export function useCheckboxGroup<T extends CheckboxValue>(): CheckboxGroupContext<T> | undefined;
export function useCheckboxGroup<T extends CheckboxValue>(fallback: CheckboxGroupContext<T>): CheckboxGroupContext<T>;
export function useCheckboxGroup<T extends CheckboxValue>(fallback?: CheckboxGroupContext<T>) {
  return inject(checkboxGroupContextKey, fallback);
}
