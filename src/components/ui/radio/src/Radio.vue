<template>
  <label :for="idRef" :class="radioKls">
    <span :class="buttonRef ? 'el-toggle-button__input' : 'el-toggle__input'">
      <input
        :id="idRef"
        :class="buttonRef ? 'el-toggle-button__original' : 'el-toggle__original'"
        :checked="selfModel"
        :disabled="disabledRef"
        :value="value || label"
        :name="nameRef"
        type="radio"
        role="presentation"
        @focus="focus = true"
        @blur="focus = false"
        @change="handleChange"
      >
      <span :class="buttonRef ? 'el-toggle-button__inner' : 'el-toggle__inner'" />
    </span>
    <span v-if="$slots.default || label" :class="buttonRef ? 'el-toggle-button__label' : 'el-toggle__label'">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts" generic="T extends RadioValue">
import type { PropType } from 'vue';
import type { RadioValue } from './typings';

import { computed, ref, watchEffect } from 'vue';
import { isDefined } from '@vueuse/core';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useId } from '@/composables/useId';
import { useFormDisabled, useFormSize } from '../../form';
import { useRadioGroup } from './composables';

defineOptions({
  name: 'ElRadio',
  model: {
    prop: 'checked',
    event: 'change',
  },
});

const props = defineProps({
  value: {
    type: [String, Number, Boolean] as PropType<RadioValue>,
    default: undefined,
  },
  label: {
    type: [String, Number, Boolean] as PropType<RadioValue>,
    default: undefined,
  },
  id: String,
  name: String,
  size: useSizeProp,
  checked: [Boolean, String, Number] as unknown as PropType<T>,
  button: Boolean,
  disabled: Boolean,
});

const emit = defineEmits<{
  (e: 'change', value: T): void;
}>();

const radioGroup = useRadioGroup();

const sizeRef = useFormSize(radioGroup?.size);
const disabledRef = useFormDisabled(radioGroup?.disabled);
const buttonRef = computed(() => radioGroup?.button.value || props.button);
const actualValue = computed(() => isDefined(props.value) ? props.value : props.label);

const focus = ref(false);
const selfModel = ref(false);
// 传入 id 优先使用，否则根据情况，是否自动生成
const idRef = radioGroup ? ref(props.id) : useId(props.id);

watchEffect(() => {
  selfModel.value = radioGroup
    ? radioGroup.modelValue.value === actualValue.value
    : props.checked === actualValue.value;
});

const nameRef = computed(() => props.name || radioGroup?.name.value);
const radioKls = computed(() => {
  const classNames = [];
  const { value: size } = sizeRef;

  if (buttonRef.value) {
    classNames.push('el-radio-button', 'el-toggle-button');
    size && classNames.push(`el-toggle-button--${size}`);
  } else {
    classNames.push('el-radio', 'el-toggle');
    size && classNames.push(`el-toggle--${size}`);
  }

  if (disabledRef.value) classNames.push('is-disabled');
  if (selfModel.value) classNames.push('is-checked');
  if (focus.value) classNames.push('is-focus');

  return classNames;
});

function handleChange(e: Event) {
  if (radioGroup) {
    radioGroup.setModelValue(actualValue.value);
    return;
  }
  // 内部赋值，表现与原生 radio 一致
  selfModel.value = (e.target as HTMLInputElement).checked;
  // 同步到 v-model
  emit('change', actualValue.value as T);
}
</script>
