<template>
  <div class="el-scrollbar">
    <div
      ref="wrapRef"
      :class="wrapKls"
      :style="wrapStyle"
      :tabindex="tabindex"
      @scroll="handleScroll"
    >
      <component
        :is="tag"
        :id="id"
        ref="resizeRef"
        :class="resizeKls"
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
import type { ScrollbarDirection, ScrollbarScrollEvent } from './typings';

import { computed, nextTick, onActivated, onMounted, reactive, ref, watch } from 'vue';
import { isClient, useEventListener, useResizeObserver } from '@vueuse/core';
import { isNumber } from '@/utils/types';
import { addUnit, getScrollbarWidth } from '@/utils/dom';
import { supportsCustomizeScrollbar } from '@/utils/canIUse';
import { provideScrollbar } from './composables';
import Bar from './Bar.vue';

defineOptions({
  name: 'ElScrollbar',
});

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

const state = reactive({
  sizeWidth: '0',
  sizeHeight: '0',
  moveX: 0,
  moveY: 0,
  ratioX: 1,
  ratioY: 1,
});

let stopResizeObserver: VoidFunction | undefined;
let stopWrapResizeObserver: VoidFunction | undefined;
let stopResizeListener: VoidFunction | undefined;
let wrapScrollTop = 0;
let wrapScrollLeft = 0;
let direction = '' as ScrollbarDirection;

const wrapRef = ref<HTMLElement>();
const resizeRef = ref<HTMLElement>();

const wrapStyle = computed(() => {
  const style: CSSProperties = {};
  if (props.height) style.height = addUnit(props.height);
  if (props.maxHeight) style.maxHeight = addUnit(props.maxHeight);

  const gutterWidth = getGutterWidth();
  if (gutterWidth) {
    style.marginRight = `-${addUnit(gutterWidth)}`;
    style.marginBottom = `-${addUnit(gutterWidth)}`;
  }

  return [props.wrapStyle, style];
});

const wrapKls = computed(() => {
  const hidden = !props.native || (getGutterWidth() === 0);

  return [
    'el-scrollbar__wrap',
    { 'el-scrollbar__wrap--hidden-default': hidden },
    props.wrapClass,
  ];
});

function getGutterWidth() {
  if (supportsCustomizeScrollbar) return 0;
  return getScrollbarWidth();
}

const resizeKls = computed(() => ['el-scrollbar__view', props.viewClass]);

function handleScroll() {
  if (!wrapRef.value) return;

  const clientHeight = wrapRef.value.clientHeight;
  const clientWidth = wrapRef.value.clientWidth;

  state.moveY = ((wrapRef.value.scrollTop * 100) / clientHeight) * state.ratioY;
  state.moveX = ((wrapRef.value.scrollLeft * 100) / clientWidth) * state.ratioX;

  const prevTop = wrapScrollTop;
  const prevLeft = wrapScrollLeft;
  wrapScrollTop = wrapRef.value.scrollTop;
  wrapScrollLeft = wrapRef.value.scrollLeft;

  const arrivedStates = {
    bottom: wrapScrollTop + wrapRef.value.clientHeight >= wrapRef.value.scrollHeight,
    top: wrapScrollTop <= 0 && prevTop !== 0,
    right: wrapScrollLeft + wrapRef.value.clientWidth >= wrapRef.value.scrollWidth && prevLeft !== wrapScrollLeft,
    left: wrapScrollLeft <= 0 && prevLeft !== 0,
  };

  if (prevTop !== wrapScrollTop) {
    direction = wrapScrollTop > prevTop ? 'bottom' : 'top';
  }
  if (prevLeft !== wrapScrollLeft) {
    direction = wrapScrollLeft > prevLeft ? 'right' : 'left';
  }

  emit('scroll', {
    scrollTop: wrapScrollTop,
    scrollLeft: wrapScrollLeft,
  });

  if (arrivedStates[direction]) emit('end-reached', direction);
}

function scrollTo(x?: number | ScrollOptions, y?: number) {
  if (!isClient) return;
  if (!wrapRef.value) return;
  if (!wrapRef.value.scrollTo) return;

  if (isNumber(x)) {
    isNumber(y) && wrapRef.value.scrollTo(x, y);
  } else {
    wrapRef.value.scrollTo(x);
  }
}

function setScrollTop(value: number) {
  if (!isClient) return;
  if (!isNumber(value)) return;
  if (!wrapRef.value) return;
  wrapRef.value.scrollTop = value;
}

function setScrollLeft(value: number) {
  if (!isClient) return;
  if (!isNumber(value)) return;
  if (!wrapRef.value) return;
  wrapRef.value.scrollLeft = value;
}

function update() {
  if (!isClient) return;
  if (props.native) return;
  nextTick(_update);
}

function _update() {
  if (!wrapRef.value) return;

  const {
    clientHeight,
    clientWidth,
    scrollHeight,
    scrollWidth,
  } = wrapRef.value;

  const minHeightPercentage = (props.minSize * 100 / clientHeight);
  const minWidthPercentage = (props.minSize * 100 / clientWidth);

  const originHeightPercentage = (clientHeight * 100 / scrollHeight);
  const originWidthPercentage = (clientWidth * 100 / scrollWidth);

  const heightPercentage = Math.max(minHeightPercentage, originHeightPercentage);
  const widthPercentage = Math.max(minWidthPercentage, originWidthPercentage);

  state.ratioY = (originHeightPercentage / (100 - originHeightPercentage)) / (heightPercentage / (100 - heightPercentage));
  state.ratioX = (originWidthPercentage / (100 - originWidthPercentage)) / (widthPercentage / (100 - widthPercentage));

  if (Number.isNaN(state.ratioY)) state.ratioY = 1;
  if (Number.isNaN(state.ratioX)) state.ratioX = 1;

  state.sizeHeight = (heightPercentage < 100) ? (heightPercentage + '%') : '';
  state.sizeWidth = (widthPercentage < 100) ? (widthPercentage + '%') : '';
}

watch(
  () => props.noresize,
  (noresize) => {
    if (noresize) {
      stopResizeObserver?.();
      stopWrapResizeObserver?.();
      stopResizeListener?.();
    } else {
      ({ stop: stopResizeObserver } = useResizeObserver(resizeRef, _update));
      ({ stop: stopWrapResizeObserver } = useResizeObserver(wrapRef, _update));
      stopResizeListener = useEventListener('resize', _update);
    }
  },
  { immediate: true },
);

watch(
  () => [props.maxHeight, props.height],
  update,
);

provideScrollbar(reactive({
  wrapElement: wrapRef,
}));

onActivated(() => {
  if (wrapRef.value) {
    wrapRef.value.scrollTop = wrapScrollTop;
    wrapRef.value.scrollLeft = wrapScrollLeft;
  }
});

onMounted(() => {
  update();
});

defineExpose({
  wrapRef,
  update,
  scrollTo,
  setScrollTop,
  setScrollLeft,
  handleScroll,
});
</script>
