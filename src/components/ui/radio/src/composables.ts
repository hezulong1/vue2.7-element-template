import type { InjectionKey } from 'vue';
import type { RadioGroupContext, RadioValue } from './typings';

import { inject } from 'vue';

export const radioGroupContextKey = 'elRadioGroupContextKey' as unknown as InjectionKey<RadioGroupContext>;

export function useRadioGroup<T extends RadioValue = RadioValue>() {
  return inject(radioGroupContextKey, undefined) as unknown as RadioGroupContext<T>;
}
