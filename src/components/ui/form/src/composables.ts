import type { InjectionKey } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';
import type { ComponentSize } from '@/components/base/ConfigProvider';
import type { ElFormContext, ElFormItemContext } from './typings';

import { computed, inject } from 'vue';
import { toValue } from '@vueuse/core';
import { useRawProp } from '@/composables/use-prop';

export const formContextKey = 'elFormContextKey' as unknown as InjectionKey<ElFormContext>;
export const formItemContextKey = 'elFormItemContextKey' as unknown as InjectionKey<ElFormItemContext>;

export function useFormItem() {
  const form = inject(formContextKey, undefined);
  const formItem = inject(formItemContextKey, undefined);
  return {
    form,
    formItem,
  };
}

export function useFormDisabled(fallback?: MaybeRefOrGetter<boolean | undefined>) {
  const disabled = useRawProp<boolean>('disabled');
  const form = inject(formContextKey, undefined);
  return computed(() => disabled.value || toValue(fallback) || form?.disabled || false);
}

export function useFormSize(fallback?: MaybeRefOrGetter<ComponentSize | undefined>) {
  const size = useRawProp<ComponentSize>('size');
  const { form, formItem } = useFormItem();
  return computed(() => size.value || toValue(fallback) || formItem?.size || form?.size || '');
}
