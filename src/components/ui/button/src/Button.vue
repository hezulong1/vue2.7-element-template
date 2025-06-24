<template>
  <button
    :disabled="buttonDisabled || loading"
    :autofocus="autofocus"
    :type="nativeType"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading" class="el-icon el-icon-loading el-icon--left">
      <Loading />
    </span>
    <span v-if="icon && !loading" class="el-icon" :class="{ 'el-icon--left': $slots.default }">
      <component :is="icon" />
    </span>
    <span v-if="$slots.default"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import type { PropType, Component } from 'vue';
import type { ButtonNativeType, ButtonType } from './typings';

import { computed, useSlots } from 'vue';
import { Loading } from '@/components/base/icons';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useFormItem, useFormDisabled, useFormSize } from '../../form';

defineOptions({
  name: 'ElButton',
});

const props = defineProps({
  type: {
    type: String as PropType<ButtonType>,
    default: 'default',
  },
  size: useSizeProp,
  icon: Object as PropType<Component>,
  nativeType: {
    type: String as PropType<ButtonNativeType>,
    default: 'button',
  },
  loading: Boolean,
  disabled: Boolean,
  plain: Boolean,
  autofocus: Boolean,
  square: Boolean,
  block: Boolean,
  link: Boolean,
  text: Boolean,
  bg: Boolean,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const slots = useSlots();

const { form: elForm } = useFormItem();

const buttonSize = useFormSize();
const buttonDisabled = useFormDisabled();

const buttonClasses = computed(() => {
  const type = props.type ? 'el-button--' + props.type : '';
  const size = buttonSize.value ? 'el-button--' + buttonSize.value : '';

  let square = slots.default ? slots.default().length <= 0 : !!props.icon;
  let link = false;
  let plain = false;
  let text = false;
  let hasBg = false;

  if (props.link) {
    link = true;
  } else if (props.plain) {
    plain = true;
  } else if (props.text) {
    text = true;

    if (props.bg) {
      hasBg = true;
    }
  }

  return [
    'el-button',
    type,
    size,
    {
      'is-disabled': buttonDisabled.value,
      'is-loading': props.loading,
      'is-plain': plain,
      'is-square': props.square || square,
      'is-block': props.block,
      'is-link': link,
      'is-text': text,
      'is-has-bg': hasBg,
    },
  ];
});

function handleClick(evt: MouseEvent) {
  if (buttonDisabled.value || props.loading) {
    evt.stopPropagation();
    return;
  }
  if (props.nativeType === 'reset') {
    elForm?.resetFields();
  }
  emit('click', evt);
}
</script>
