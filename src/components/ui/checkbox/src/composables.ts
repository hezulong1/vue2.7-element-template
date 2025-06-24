import type { InjectionKey } from 'vue';
import type { CheckboxGroupContext, CheckboxValue } from './typings';

import { inject } from 'vue';

export const checkboxGroupContextKey = 'elCheckboxGroupContextKey' as unknown as InjectionKey<CheckboxGroupContext>;

export function useCheckboxGroup<T extends CheckboxValue = CheckboxValue>() {
  return inject(checkboxGroupContextKey, undefined) as unknown as CheckboxGroupContext<T>;
}
