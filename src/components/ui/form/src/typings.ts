import type {
  ValidateFieldsError,
} from 'async-validator';

// ElForm
// ----------------------------------------

import type { ComponentSize } from '@/components/base/ConfigProvider';

export interface ElFormProps {
  model?: object;
  rules?: object;
  labelPosition?: string;
  labelWidth?: string;
  labelSuffix?: string;
  inline?: boolean;
  inlineMessage?: boolean;
  statusIcon?: boolean;
  /**
   * @default true
   */
  showMessage?: boolean;
  size?: ComponentSize;
  disabled?: boolean;
  /**
   * @default true
   */
  validateOnRuleChange?: boolean;
  hideRequiredAsterisk?: boolean;
}

export interface ElFormEmits {
  (e: 'validate', isValid: boolean, invalidFields: object): void;
}

export interface ElFormContext extends ElFormProps, ElFormEmits {
  resetFields(): void;
}

// ElFormItem
// ----------------------------------------

export interface ElFormItemProps {
  label?: string;
  labelWidth?: string;
  prop?: string;
  /**
   * @default undefined
   */
  required?: boolean;
  rules?: object | object[];
  error?: string;
  validateStatus?: string;
  for?: string;
  /**
   * @default ''
   */
  inlineMessage?: string | boolean;
  /**
   * @default true
   */
  showMessage?: boolean;
  size?: ComponentSize;
}

export type ElFormItemValidateState = '' | 'success' | 'error' | 'validating';

export type FormValidationResult = Promise<boolean>;
export type FormValidateCallback = (
  isValid: boolean,
  invalidFields?: ValidateFieldsError
) => Promise<void> | void;

export interface ElFormItemContext extends ElFormItemProps {
  $el: HTMLDivElement | undefined;
  size: ComponentSize;
  elFormItemSize: ComponentSize;
  validateState: ElFormItemValidateState;
  isGroup: boolean;
  labelId: string;
  inputIds: string[];
  hasLabel: boolean;
  fieldValue: any;
  addInputId: (id: string) => void;
  removeInputId: (id: string) => void;
  validate: (trigger: string, callback?: FormValidateCallback) => FormValidationResult;
  resetField(): void;
  clearValidate(): void;
}
