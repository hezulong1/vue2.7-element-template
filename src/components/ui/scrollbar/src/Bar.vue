<template>
  <div
    ref="barRef"
    :class="['el-scrollbar__bar', 'is-' + barKeys.key, { 'is-always': always }]"
    :style="size ? '' : 'display: none;'"
    @mousedown="clickTrackHandler"
  >
    <div
      ref="thumbRef"
      class="el-scrollbar__thumb"
      :style="renderThumbStyle({ size, move, barKeys })"
      @mousedown="clickThumbHandler"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { isClient } from '@vueuse/core';
import { renderThumbStyle, BAR_MAP } from './utils';
import { useScrollbar } from './composables';

const props = defineProps({
  vertical: Boolean,
  size: String,
  move: Number,
  always: Boolean,
  ratio: Number,
});

const scrollbarIns = useScrollbar();

if (!scrollbarIns) {
  throw new Error('can not inject scrollbar context');
}

let cursorDown = false;
let originalOnSelectStart:
  | ((this: GlobalEventHandlers, ev: Event) => any)
  | null = isClient ? document.onselectstart : null;

const thumbState = ref<Partial<Record<'X' | 'Y', number>>>({});
const barRef = ref<HTMLElement>();
const thumbRef = ref<HTMLElement>();
const wrapRef = computed(() => scrollbarIns.wrapElement);

const barKeys = computed(() => BAR_MAP[props.vertical ? 'vertical' : 'horizontal']);
const offsetRatio = computed(() => {
  if (!barRef.value || !thumbRef.value) return 1;
  if (typeof props.ratio !== 'number') return 1;

  // offsetRatioX = original width of thumb / current width of thumb / ratioX
  // offsetRatioY = original height of thumb / current height of thumb / ratioY
  // instance height = wrap height - GAP
  const offset = barRef.value[barKeys.value.offset];
  const scrollSize = wrapRef.value ? wrapRef.value[barKeys.value.scrollSize] : null;
  const originalThumb = scrollSize == null ? 0 : offset * offset / scrollSize;
  return originalThumb / thumbRef.value[barKeys.value.offset] / props.ratio;
});

onBeforeUnmount(() => {
  restoreOnselectstart();
  document.removeEventListener('mouseup', mouseUpDocumentHandler, false);
});

function mouseMoveDocumentHandler(e: MouseEvent) {
  if (!barRef.value || !thumbRef.value) return;
  if (!cursorDown) return;

  const prevPage = thumbState.value[barKeys.value.axis];
  if (!prevPage) return;

  const offset = ((barRef.value.getBoundingClientRect()[barKeys.value.direction] - e[barKeys.value.client]) * -1);
  const thumbClickPosition = (thumbRef.value[barKeys.value.offset] - prevPage);
  const thumbPositionPercentage = ((offset - thumbClickPosition) * 100 * offsetRatio.value / barRef.value[barKeys.value.offset]);

  if (wrapRef.value) {
    wrapRef.value[barKeys.value.scroll] = (thumbPositionPercentage * wrapRef.value[barKeys.value.scrollSize] / 100);
  }
}

function mouseUpDocumentHandler(e: MouseEvent) {
  cursorDown = false;
  thumbState.value[barKeys.value.axis] = 0;
  document.removeEventListener('mousemove', mouseMoveDocumentHandler, false);
  document.removeEventListener('mouseup', mouseUpDocumentHandler, false);
  restoreOnselectstart();
}

function startDrag(e: MouseEvent) {
  e.stopImmediatePropagation();
  cursorDown = true;
  document.addEventListener('mousemove', mouseMoveDocumentHandler, false);
  document.addEventListener('mouseup', mouseUpDocumentHandler, false);
  originalOnSelectStart = document.onselectstart;
  document.onselectstart = () => false;
}

function clickThumbHandler(e: MouseEvent) {
  // prevent click event of right button
  e.stopPropagation();
  if (e.ctrlKey || [1, 2].includes(e.button)) return;

  window.getSelection()?.removeAllRanges();
  startDrag(e);

  const currentEl = e.currentTarget as HTMLElement;
  thumbState.value[barKeys.value.axis] = (currentEl[barKeys.value.offset] - (e[barKeys.value.client] - currentEl.getBoundingClientRect()[barKeys.value.direction]));
}

function clickTrackHandler(e: MouseEvent) {
  if (!barRef.value || !thumbRef.value) return;

  const currentEl = e.target as HTMLElement;
  const offset = Math.abs(currentEl.getBoundingClientRect()[barKeys.value.direction] - e[barKeys.value.client]);
  const thumbHalf = (thumbRef.value[barKeys.value.offset] / 2);
  const thumbPositionPercentage = ((offset - thumbHalf) * 100 * offsetRatio.value / barRef.value[barKeys.value.offset]);

  if (wrapRef.value) {
    wrapRef.value[barKeys.value.scroll] = (thumbPositionPercentage * wrapRef.value[barKeys.value.scrollSize] / 100);
  }
}

function restoreOnselectstart() {
  if (document.onselectstart !== originalOnSelectStart) {
    document.onselectstart = originalOnSelectStart;
  }
}
</script>
