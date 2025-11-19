import type { ComputedRef } from 'vue';
import type { ComponentSize } from '@/components/base/ConfigProvider';

export type CheckboxValue = string | number | Record<string, any>;

export interface CheckboxGroupContext<T extends CheckboxValue = CheckboxValue> {
  modelValue: ComputedRef<T[]>;
  disabled: ComputedRef<boolean>;
  button: ComputedRef<boolean>;
  size: ComputedRef<ComponentSize | undefined>;
  min: ComputedRef<number | undefined>;
  max: ComputedRef<number | undefined>;
  id: ComputedRef<string>;
  name: ComputedRef<string>;
  setModelValue: (value: T, checked: boolean) => void;
}
