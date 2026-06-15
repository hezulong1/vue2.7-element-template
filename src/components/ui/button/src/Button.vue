<template>
  <button
    :class="buttonClasses"
    :type="nativeType"
    :autofocus="autofocus"
    :disabled="buttonDisabled"
    :aria-disabled="`${buttonDisabled}`"
    @click="handleClick"
  >
    <Icon v-if="loading" :content="Loading" loading modifier="left" />
    <Icon v-if="!loading && icon" :content="icon" :modifier="$slots.default ? 'left' : ''" />
    <span v-if="$slots.default"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import type { PropType, Component } from 'vue';
import type { ButtonNativeType, ButtonType } from './typings';

import { computed, useSlots } from 'vue';
import { Loading } from 'element-icons';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useFormItem, useFormDisabled, useFormSize } from '../../form';
import { Icon } from '../../icon';

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

const _disabled = useFormDisabled();
const buttonSize = useFormSize();
const buttonDisabled = computed(() => !!(_disabled.value || props.loading));

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
      'is-disabled': _disabled.value,
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
  if (buttonDisabled.value) {
    evt.stopPropagation();
    return;
  }
  if (props.nativeType === 'reset') {
    elForm?.resetFields();
  }
  emit('click', evt);
}
</script>
