<template>
  <div class="el-scrollbar">
    <div
      ref="wrapRef"
      :class="wrapClass"
      :style="wrapStyle"
      :tabindex="tabindex"
      @scroll="handleScroll"
    >
      <component
        :is="tag"
        :id="id"
        ref="viewRef"
        :class="['el-scrollbar__view', viewClass]"
        :style="viewStyle"
        :role="role"
        :aria-label="ariaLabel"
        :aria-orientation="ariaOrientation"
      >
        <slot />
      </component>
    </div>

    <template v-if="!native">
      <Bar
        :move="state.moveY"
        :size="state.sizeHeight"
        :ratio="state.ratioY"
        :always="always"
        vertical
      />
      <Bar
        :move="state.moveX"
        :size="state.sizeWidth"
        :ratio="state.ratioX"
        :always="always"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType, StyleValue } from 'vue';
import type { ScrollbarDirection, ScrollbarScrollEvent } from './utils';

import { computed, nextTick, onMounted, shallowRef, watch } from 'vue';
import { useResizeObserver, useEventListener } from '@vueuse/core';
import { addUnit } from '@/utils/dom';
import { useScrollable } from './utils';
import Bar from './Bar.vue';

defineOptions({ name: 'ElScrollbar' });

const props = defineProps({
  height: {
    type: [String, Number] as PropType<string | number>,
    default: '',
  },
  maxHeight: {
    type: [String, Number] as PropType<string | number>,
    default: '',
  },
  native: Boolean,
  wrapStyle: [Object, String, Array] as PropType<StyleValue>,
  wrapClass: [Object, String, Array] as PropType<any>,
  viewStyle: [Object, String, Array] as PropType<StyleValue>,
  viewClass: [Object, String, Array] as PropType<any>,
  noresize: Boolean, // 如果 container 尺寸不会发生变化，最好设置它可以优化性能
  tag: {
    type: String,
    default: 'div',
  },
  always: Boolean,
  minSize: {
    type: Number,
    default: 20,
  },
  tabindex: {
    type: [String, Number],
    default: undefined,
  },
  id: String,
  role: String,
  ariaLabel: String,
  ariaOrientation: {
    type: String as PropType<'horizontal' | 'vertical'>,
    validator: (value: string) => ['horizontal', 'vertical'].includes(value),
  },
});
const emit = defineEmits<{
  (e: 'scroll', event: ScrollbarScrollEvent): void;
  (e: 'end-reached', event: ScrollbarDirection): void;
}>();

const viewRef = shallowRef<HTMLElement>();

const {
  state,
  wrapRef,
  update,
  scrollTo,
  handleScroll,
  setScrollTop,
  setScrollLeft,
  getScrollbarWidth,
} = useScrollable(props, emit);

const wrapClass = computed(() => {
  const classNames = ['el-scrollbar__wrap'];
  const hidden = !props.native || (getScrollbarWidth() === 0);
  if (hidden) classNames.push('el-scrollbar__wrap--hidden-default');

  classNames.push(props.wrapClass);
  return classNames;
});

const wrapStyle = computed(() => {
  const style: CSSProperties = {};
  if (props.height) style.height = addUnit(props.height);
  if (props.maxHeight) style.maxHeight = addUnit(props.maxHeight);

  const gutterWidth = getScrollbarWidth();
  if (gutterWidth) {
    style.marginRight = `-${ addUnit(gutterWidth) }`;
    style.marginBottom = `-${ addUnit(gutterWidth) }`;
  }

  return [props.wrapStyle, style];
});

let stopResizeObserver: VoidFunction | undefined;
let stopWrapResizeObserver: VoidFunction | undefined;
let stopResizeListener: VoidFunction | undefined;

watch(
  () => props.noresize,
  (noresize) => {
    if (noresize) {
      stopResizeObserver?.();
      stopWrapResizeObserver?.();
      stopResizeListener?.();
    } else {
      ({ stop: stopResizeObserver } = useResizeObserver(viewRef, update));
      ({ stop: stopWrapResizeObserver } = useResizeObserver(wrapRef, update));
      stopResizeListener = useEventListener('resize', update);
    }
  },
  { immediate: true },
);

function doUpdate() {
  if (props.native) return;
  nextTick(update);
}

watch(
  () => [props.maxHeight, props.height],
  doUpdate,
);

onMounted(doUpdate);

defineExpose({
  wrapRef,
  update: doUpdate,
  scrollTo,
  setScrollTop,
  setScrollLeft,
  handleScroll,
});
</script>
