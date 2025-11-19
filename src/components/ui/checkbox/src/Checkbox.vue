<template>
  <label
    :for="idRef"
    :class="checkboxKls"
    :aria-controls="selfIndeterminate ? ariaControls : undefined"
  >
    <span :class="buttonRef ? 'el-toggle-button__input' : 'el-toggle__input'">
      <input
        :id="idRef"
        ref="inputRef"
        :checked="selfModel"
        :class="buttonRef ? 'el-toggle-button__original' : 'el-toggle__original'"
        :disabled="disabledRef"
        :value="value || label"
        :name="nameRef"
        :indeterminate="indeterminate"
        type="checkbox"
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

<script setup lang="ts" generic="T extends Arrayable<CheckboxValue | boolean>">
import type { PropType } from 'vue';
import type { Arrayable } from '@vueuse/core';
import type { CheckboxValue } from './typings';

import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { isDefined } from '@vueuse/core';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useId } from '@/composables/use-id';
import { useRawProp } from '@/composables/use-prop';
import { useFormDisabled, useFormItem, useFormSize } from '../../form';
import { useCheckboxGroup } from './composables';

defineOptions({
  name: 'ElCheckbox',
  // https://v2.cn.vuejs.org/v2/guide/forms.html#%E5%9F%BA%E7%A1%80%E7%94%A8%E6%B3%95
  // v-model 绑定与 Vue 原生一致
  model: {
    prop: 'checked',
    event: 'change',
  },
});

const props = defineProps({
  value: {
    type: [String, Number, Object] as PropType<CheckboxValue>,
    default: undefined,
  },
  trueValue: {
    type: [String, Number, Object] as PropType<CheckboxValue>,
    default: undefined,
  },
  falseValue: {
    type: [String, Number, Object] as PropType<CheckboxValue>,
    default: undefined,
  },
  label: {
    type: String as PropType<string>,
    default: undefined,
  },
  id: String,
  name: String,
  ariaControls: String,
  size: useSizeProp,
  indeterminate: Boolean,
  disabled: Boolean,
  button: Boolean,
  checked: [Boolean, String, Number, Object, Array] as unknown as PropType<T>,
});

const emit = defineEmits<{
  (e: 'change', value: T): void;
  (e: 'update:indeterminate', value: boolean): void;
}>();

const { formItem } = useFormItem();
const checkboxGroup = useCheckboxGroup();

const isLimitDisabled = computed(() => {
  if (!checkboxGroup) return false;

  const max = checkboxGroup.max.value;
  const min = checkboxGroup.min.value;
  const modelValue = checkboxGroup.modelValue.value;
  const length = modelValue.length;
  const isChecked = modelValue.includes(props.value || props.label);

  return (max !== undefined && length >= max && !isChecked)
    || (min !== undefined && length <= min && isChecked)
    || checkboxGroup.disabled.value;
});

const sizeRef = useFormSize(checkboxGroup?.size);
const disabledRef = useFormDisabled(isLimitDisabled);
const buttonRef = computed(() => checkboxGroup?.button.value || props.button);
const hasCustomValue = computed(() => {
  const trueValue = useRawProp<CheckboxValue>('trueValue');
  const falseValue = useRawProp<CheckboxValue>('falseValue');
  return isDefined(trueValue) && isDefined(falseValue);
});
const actualValue = computed(() => isDefined(props.value) ? props.value : props.label);

// 传入 id 优先使用，否则根据情况，是否自动生成
const idRef = checkboxGroup ? ref(props.id) : useId(props.id);

const focus = ref(false);
const selfModel = ref(false);
const selfIndeterminate = ref(false);
const inputRef = ref<HTMLInputElement>();

watchEffect(() => {
  if (checkboxGroup) {
    selfModel.value = checkboxGroup.modelValue.value.includes(actualValue.value);
    selfIndeterminate.value = false;
  } else {
    const trueValue = hasCustomValue.value ? props.trueValue : true;

    selfModel.value = Array.isArray(props.checked)
      ? props.checked.includes(actualValue.value)
      : props.checked === trueValue;
    selfIndeterminate.value = props.indeterminate;
  }
});

const nameRef = computed(() => props.name || checkboxGroup?.name.value);
const checkboxKls = computed(() => {
  const classNames = [];
  const { value: size } = sizeRef;

  if (buttonRef.value) {
    classNames.push('el-checkbox-button', 'el-toggle-button');
    size && classNames.push(`el-toggle-button--${size}`);
  } else {
    classNames.push('el-checkbox', 'el-toggle');
    size && classNames.push(`el-toggle--${size}`);
    selfIndeterminate.value && classNames.push('is-indeterminate');
  }

  if (disabledRef.value) classNames.push('is-disabled');
  if (selfModel.value) classNames.push('is-checked');
  if (focus.value) classNames.push('is-focus');

  return classNames;
});

watch(
  () => props.checked,
  () => {
    formItem?.validate('change');
  },
);

watch(
  selfIndeterminate,
  (value) => {
    emit('update:indeterminate', value);
  },
);

onMounted(() => {
  watch(
    () => props.indeterminate,
    (value) => {
      // CheckboxGroup 中忽略 indeterminate 属性
      if (checkboxGroup) return;

      const isIndeterminate = !!value;
      selfIndeterminate.value = isIndeterminate;

      // (?) Vue2 中似乎不支持 indeterminate 属性绑定赋值，再处理一遍
      if (inputRef.value) {
        inputRef.value.indeterminate = isIndeterminate;
      }
    },
    {
      immediate: true,
    },
  );
});

function handleChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;

  if (checkboxGroup) {
    checkboxGroup.setModelValue(actualValue.value, checked);
    return;
  }

  if (selfIndeterminate.value) {
    selfIndeterminate.value = false;
  }

  selfModel.value = checked;

  const emitValue = Array.isArray(props.checked)
    ? (checked ? [...props.checked, actualValue.value] : props.checked.filter(v => v !== actualValue.value))
    : (hasCustomValue.value ? (checked ? props.trueValue : props.falseValue) : !!checked);

  emit('change', emitValue as T);
}
</script>
