import type { InjectionKey, ComputedRef, Ref, WatchStopHandle } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';
import type { ComponentSize } from '@/components/base/ConfigProvider';
import type { ElFormContext, ElFormItemContext } from './typings';

import { computed, inject, ref, getCurrentInstance, onMounted, onUnmounted, toRef, watch } from 'vue';
import { toValue } from '@vueuse/core';
import { useRawProp } from '@/composables/use-prop';
import { useId } from '@/composables/use-id';

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

export interface IUseFormItemInputCommonProps {
  id?: string;
  label?: string | number | boolean | Record<string, any>;
  ariaLabel?: string | number | boolean | Record<string, any>;
}

export function useFormItemInputId(
  props: Partial<IUseFormItemInputCommonProps>,
  {
    formItemContext,
    disableIdGeneration,
    disableIdManagement,
  }: {
    formItemContext?: ElFormItemContext;
    disableIdGeneration?: ComputedRef<boolean> | Ref<boolean>;
    disableIdManagement?: ComputedRef<boolean> | Ref<boolean>;
  },
) {
  if (!disableIdGeneration) {
    disableIdGeneration = ref<boolean>(false);
  }
  if (!disableIdManagement) {
    disableIdManagement = ref<boolean>(false);
  }

  const instance = getCurrentInstance()?.proxy;

  const inLabel = () => {
    let parent = instance?.$parent;
    while (parent) {
      if (parent.$options.name === 'ElFormItem') {
        return false;
      }
      if (parent.$options.name === 'ElLabelWrap') {
        return true;
      }
      parent = parent.$parent;
    }
    return false;
  };

  const inputId = ref<string>();
  let idUnwatch: WatchStopHandle | undefined;

  const isLabeledByFormItem = computed<boolean>(() => !!(
    !(props.label || props.ariaLabel) &&
      formItemContext &&
      formItemContext.inputIds &&
      formItemContext.inputIds?.length <= 1
  ));

  // Generate id for ElFormItem label if not provided as prop
  onMounted(() => {
    idUnwatch = watch(
      [toRef(props, 'id'), disableIdGeneration] as any,
      ([id, disableIdGeneration]: [string, boolean]) => {
        const newId = id ?? (!disableIdGeneration ? useId().value : undefined);
        if (newId !== inputId.value) {
          if (formItemContext?.removeInputId && !inLabel()) {
            inputId.value && formItemContext.removeInputId(inputId.value);
            if (!disableIdManagement?.value && !disableIdGeneration && newId) {
              formItemContext.addInputId(newId);
            }
          }
          inputId.value = newId;
        }
      },
      { immediate: true },
    );
  });

  onUnmounted(() => {
    idUnwatch && idUnwatch();
    if (formItemContext?.removeInputId) {
      inputId.value && formItemContext.removeInputId(inputId.value);
    }
  });

  return {
    isLabeledByFormItem,
    inputId,
  };
}
