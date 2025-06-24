<template>
  <div :id="idRef" class="el-checkbox-group" role="group" aria-label="checkbox-group">
    <slot />
  </div>
</template>

<script setup lang="ts" generic="T extends CheckboxValue">
import type { PropType } from 'vue';
import type { CheckboxGroupContext, CheckboxValue } from './typings';

import { computed, nextTick, provide, watch } from 'vue';
import { isDefined } from '@vueuse/core';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useId } from '@/composables/useId';
import { useFormItem } from '../../form';
import { checkboxGroupContextKey } from './composables';

defineOptions({
  name: 'ElCheckboxGroup',
});

const props = defineProps({
  value: {
    type: Array as PropType<T[]>,
    default: () => [] as T[],
  },
  id: String,
  name: String,
  disabled: Boolean,
  button: Boolean,
  min: Number,
  max: Number,
  size: useSizeProp,
});

const emit = defineEmits<{
  (e: 'input', value: T[]): void;
  (e: 'change', value: T[]): void;
}>();

const { formItem } = useFormItem();

const modelValue = computed({
  get() {
    return props.value;
  },
  set(value) {
    emit('input', value);
    nextTick(() => {
      emit('change', value);
    });
  },
});

const idRef = useId(props.id);
const checkboxId = useId(undefined, idRef.value);
const nameRef = computed(() => props.name || checkboxId.value);

provide<CheckboxGroupContext<T>>(checkboxGroupContextKey, {
  modelValue: computed(() => modelValue.value),
  disabled: computed(() => props.disabled),
  button: computed(() => props.button),
  size: computed(() => props.size),
  min: computed(() => props.min),
  max: computed(() => props.max),
  id: computed(() => idRef.value),
  name: nameRef,
  setModelValue,
});

watch(
  () => props.value,
  (v) => {
    formItem?.validate('change');
  },
);

function setModelValue(value: T, checked: boolean) {
  let result = [...modelValue.value];
  let length = result.length;

  if (checked) {
    if (isDefined(props.max) && length >= props.max) return;
    if (result.includes(value)) return;
    result.push(value);
  } else {
    if (isDefined(props.min) && length <= props.min) return;
    if (!result.includes(value)) return;
    result = result.filter(v => v !== value);
  }

  modelValue.value = result;
}
</script>
