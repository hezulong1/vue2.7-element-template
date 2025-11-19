<template>
  <div :id="idRef" class="el-radio-group" role="radiogroup" aria-label="radio-group">
    <slot />
  </div>
</template>

<script setup lang="ts" generic="T extends RadioValue">
import type { PropType } from 'vue';
import type { RadioValue } from './typings';

import { computed, nextTick, watch } from 'vue';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useId } from '@/composables/useId';
import { useFormItem } from '../../form';
import { provideRadioGroup } from './composables';

defineOptions({
  name: 'ElRadioGroup',
});

const props = defineProps({
  value: {
    type: [String, Number, Boolean] as unknown as PropType<T>,
    default: undefined as unknown as T,
  },
  id: String,
  name: String,
  disabled: Boolean,
  button: Boolean,
  size: useSizeProp,
});

const emit = defineEmits<{
  (e: 'input', value: T): void;
  (e: 'change', value: T): void;
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
const radioId = useId(undefined, idRef.value);
const nameRef = computed(() => props.name || radioId.value);

provideRadioGroup<T>({
  modelValue: computed(() => modelValue.value),
  disabled: computed(() => props.disabled),
  button: computed(() => props.button),
  size: computed(() => props.size),
  name: nameRef,
  setModelValue,
});

watch(
  () => props.value,
  () => {
    formItem?.validate('change');
  },
);

function setModelValue(value: T) {
  modelValue.value = value;
}
</script>
