<script setup lang="ts">
import type { Component, PropType } from 'vue';
import { computed } from 'vue';

defineOptions({
  name: 'ElIcon',
  inheritAttrs: false,
});

const props = defineProps({
  tag: {
    type: String,
    default: 'i',
  },
  content: Object as PropType<Component>,
  loading: Boolean,
  /**
   * icon 位置描述符，预设 `left(2?)` 与 `right(2?)`。
   * 如果需要更多预设值，注意在 [icon.scss](../../../../styles/ui/_icon.scss) 补充相关样式
   */
  modifier: String as PropType<'left' | 'left2' | 'right' | 'right2' | (string & {})>,
});

const iconKls = computed(() => {
  const classNames = ['el-icon'];

  if (props.modifier) classNames.push(`el-icon--${ props.modifier }`);
  if (props.loading) classNames.push('is-loading');

  return classNames;
});
</script>

<template>
  <component :is="tag" :class="iconKls">
    <slot>
      <component :is="content" />
    </slot>
  </component>
</template>
