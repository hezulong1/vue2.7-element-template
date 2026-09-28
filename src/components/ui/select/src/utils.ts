import type { InjectionKey } from 'vue';
import type { OptionPublicInstance, SelectStates } from './typings';
import type { SelectProps, OptionValue } from './props';

import { shallowRef, watch } from 'vue';
import { isObject } from '@/utils/types';
import { getByPath } from '@/utils/object';

// SelectGroupContext
// ----------------------------------------

export interface SelectGroupContext {
  disabled: boolean;
}

export const SELECT_GROUP_CONTEXT_KEY: InjectionKey<SelectGroupContext> = Symbol('selectGroupContext');

// SelectContext
// ----------------------------------------

export interface SelectContext {
  props: SelectProps;
  states: SelectStates;
  optionsArray: OptionPublicInstance[];
  setSelected(): void;
  onOptionCreate(vm: OptionPublicInstance): void;
  onOptionDestroy(key: OptionValue, vm: OptionPublicInstance): void;
  removeCachedOption(key: OptionValue, vm: OptionPublicInstance): void;
  handleOptionSelect(vm: OptionPublicInstance): void;
}

export const SELECT_CONTEXT_KEY: InjectionKey<SelectContext> = Symbol('selectContext');

export const MINIMUM_INPUT_WIDTH = 11;
export const BORDER_HORIZONTAL_WIDTH = 2;

export function findLastIndex<T>(arr: T[], predicate: (value: T, index: number) => boolean) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i)) return i;
  }
  return -1;
}

export function escapeStringRegexp(string = '') {
  return string.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&').replace(/-/g, '\\x2d');
}

// code from select-v2/src/useProps.ts
// ----------------------------------------

export interface OptionPropsAlias {
  label?: string;
  value?: string;
  disabled?: string;
  options?: string;
}

export const defaultOptionProps: Required<OptionPropsAlias> = {
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  options: 'options',
};

export interface UseOptionPropsOptions {
  props?: OptionPropsAlias;
}

export function useOptionProps(opts: UseOptionPropsOptions) {
  const aliasProps = shallowRef({ ...defaultOptionProps, ...opts.props });

  let cache = { ...opts.props };

  watch(
    () => opts.props,
    (val) => {
      // The props is an object, and its properties may be modified without changing the reference.
      // In this case, the watch values before and after are equal. Here, we compare using the cached previous value.

      let changed = false;
      let k: keyof typeof cache;

      if (val) {
        for (k in cache) {
          if (cache[k] !== val[k]) {
            changed = true;
            break;
          }
        }
      }

      if (changed) {
        aliasProps.value = { ...defaultOptionProps, ...val };
        cache = { ...val };
      }
    },
    { deep: true },
  );

  const getLabel = (option: Record<string, any>) => getByPath(option, aliasProps.value.label);
  const getValue = (option: Record<string, any>) => getByPath(option, aliasProps.value.value);
  const getDisabled = (option: Record<string, any>) => getByPath(option, aliasProps.value.disabled);
  const getOptions = (option: Record<string, any>) => getByPath(option, aliasProps.value.options);

  const getOptionProps = (option: Record<string, any>) => ({
    label: getLabel(option),
    value: getValue(option),
    disabled: getDisabled(option),
  });

  return {
    getLabel,
    getValue,
    getDisabled,
    getOptions,
    getOptionProps,
  };
}

export function getValueKey(item: { value: unknown }, valueKey: string) {
  return isObject(item.value) ? getByPath(item.value, valueKey) : item.value;
}

/**
 * TS 提示，仅在 Select 中使用
 */
export const isArray: <T>(arr: T | T[] | undefined | null) => arr is T[] = Array.isArray;
