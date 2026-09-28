<template>
  <div ref="selectRef">
    <slot />

    <ElTooltipContent
      ref="contentRef"
      :fallback-placements="fallbackPlacements"
      :placement="placement"
      :popper-options="popperOptions"
      :show-arrow="showArrow"
      :persistent="persistent"
      :disabled="disabled"
      :transition="transition"
      :teleported="teleported"
      :append-to="appendTo"
      :class="popperClass"
      :style="popperStyle"
      :offset="offset"
      :reference-el="referenceEl"
      pure
      effect="light"
    >
      <div
        ref="menuRef"
        class="el-select-dropdown"
        :class="{ 'is-multiple': multiple }"
        :style="dropdownStyle"
      >
        <div v-if="$slots.header" class="el-select-dropdown__header" @click.stop>
          <slot name="header" />
        </div>

        <ElScrollbar
          v-show="show"
          :id="contentId"
          ref="scrollbarRef"
          tag="ul"
          wrap-class="el-select-dropdown__wrap"
          view-class="el-select-dropdown__list"
          :class="{ 'is-empty': empty, 'has-header': $slots.header, 'has-footer': $slots.footer }"
          role="listbox"
          :aria-label="ariaLabel"
          aria-orientation="vertical"
          @scroll="e => $emit('scroll', e)"
          @end-reached="d => $emit('end-reached', d)"
        >
          <slot name="content" />
        </ElScrollbar>

        <div v-if="$slots.loading && loading" class="el-select-dropdown__loading">
          <slot name="loading" />
        </div>

        <div v-else-if="loading || empty" class="el-select-dropdown__empty">
          <slot name="empty" />
        </div>

        <div v-if="$slots.footer" class="el-select-dropdown__footer" @click.stop>
          <slot name="footer" />
        </div>
      </div>
    </ElTooltipContent>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { TooltipContentInstance } from '../../tooltip';
import type { ScrollbarDirection, ScrollbarInstance, ScrollbarScrollEvent } from '../../scrollbar';

import { computed, inject, onMounted, ref, shallowRef, toRef, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { rAF } from '@/utils/async';
import { addUnit } from '@/utils/dom';
import { TooltipContent as ElTooltipContent, createTooltipRoot } from '../../tooltip';
import { Scrollbar as ElScrollbar } from '../../scrollbar';
import { selectDropdownProps } from './props';
import { BORDER_HORIZONTAL_WIDTH, SELECT_CONTEXT_KEY } from './utils';

defineOptions({ name: 'ElSelectDropdown' });

const props = defineProps(selectDropdownProps);
const emit = defineEmits<{
  (type: 'before-show'): void;
  (type: 'hide'): void;
  (type: 'mouseenter'): void;
  (type: 'mouseleave'): void;
  (type: 'scroll', event: ScrollbarScrollEvent): void;
  (type: 'end-reached', direction: ScrollbarDirection): void;
}>();

const scrollbarRef = shallowRef<ScrollbarInstance>();
const selectRef = shallowRef<HTMLElement>();
const contentRef = shallowRef<TooltipContentInstance>();
const menuRef = shallowRef<HTMLElement>();
const minWidth = ref<CSSProperties['minWidth']>('');

const selectContext = inject(SELECT_CONTEXT_KEY);
const options = computed(() => selectContext?.optionsArray ?? []);
const show = computed(() => options.value.length > 0 && !props.loading);
const empty = computed(() => {
  const filtered = options.value.filter(({ visible }) => !!visible);
  return filtered.length === 0;
});

createTooltipRoot({
  visible: toRef(props, 'visible'),
  disabled: toRef(props, 'disabled'),
  onBeforeShow(e) {
    emit('before-show');
  },
  onHide(e) {
    emit('hide');
  },
});

const dropdownStyle = computed(() => {
  const style: CSSProperties = {};
  const name = props.fitInputWidth ? 'width' : 'minWidth';
  style[name] = minWidth.value;
  return style;
});

function updateMinWidth() {
  const offsetWidth = selectRef.value?.offsetWidth;
  minWidth.value = offsetWidth ? addUnit(offsetWidth - BORDER_HORIZONTAL_WIDTH) : '';
}

function updatePopper(shouldUpdateZIndex?: boolean) {
  contentRef.value?.updatePopper(shouldUpdateZIndex);
}

// #21498
let stop: VoidFunction | undefined;
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      stop = useResizeObserver(menuRef, () => {
        updatePopper();
      }).stop;
    } else {
      stop?.();
      stop = undefined;
    }
  },
);

onMounted(() => {
  updateMinWidth();
  useResizeObserver(selectRef, () => {
    rAF(updateMinWidth);
  });
});

defineExpose({
  popperRef: computed(() => contentRef.value?.popperRef),
  updatePopper,
  isFocusInsideContent: (event?: FocusEvent) => contentRef.value?.isFocusInsideContent(event),
  update: () => scrollbarRef.value?.update(),
  handleScroll: () => scrollbarRef.value?.handleScroll(),
});
</script>
