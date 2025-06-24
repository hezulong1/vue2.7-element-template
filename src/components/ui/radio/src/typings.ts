import type { ComputedRef } from 'vue';
import type { ComponentSize } from '@/components/base/ConfigProvider';

export type RadioValue = string | number | boolean;

export interface RadioGroupContext<T extends RadioValue = RadioValue> {
  modelValue: ComputedRef<T>;
  disabled: ComputedRef<boolean>;
  button: ComputedRef<boolean>;
  size: ComputedRef<ComponentSize | undefined>;
  name: ComputedRef<string>;
  setModelValue: (value: T) => void;
}
