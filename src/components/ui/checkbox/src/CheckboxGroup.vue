<template>
  <div :id="id" class="el-checkbox-group" role="group" aria-label="checkbox-group">
    <slot />
  </div>
</template>

<script setup lang="ts" generic="T extends CheckboxValue">
import type { CheckboxValue } from './typings';

import { computed, nextTick, watch, type PropType } from 'vue';
import { isDefined } from '@/utils/types';
import { nanoid } from '@/utils/nanoid';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useFormItem } from '../../form';
import { provideCheckboxGroup } from './composables';

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

const checkboxName = nanoid(12);

provideCheckboxGroup<T>({
  modelValue: computed(() => modelValue.value),
  disabled: computed(() => props.disabled),
  button: computed(() => props.button),
  size: computed(() => props.size),
  min: computed(() => props.min),
  max: computed(() => props.max),
  name: computed(() => props.name || checkboxName),
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
