<template>
  <ElPopper
    :id="id"
    ref="popperRef"
    class="el-tooltip"
    :fallback-placements="fallbackPlacements"
    :gpu-acceleration="gpuAcceleration"
    :offset="offset"
    :placement="placement"
    :popper-options="popperOptions"
    :strategy="strategy"

    :show-arrow="showArrow"
    :arrow-offset="arrowOffset"
    :effect="effect"
    :persistent="persistentRef"
    :focus-on-show="focusOnShow"
    :z-index="zIndex"
    :transition="transition"
    :aria-label="ariaLabel"

    :role="role"
    :visible="shouldShow"
    :reference-el="referenceRef"

    @before-enter="onBeforeShow"
    @after-enter="onShow"
    @before-leave="onBeforeHide"
    @after-leave="onHide"

    @mouseenter.native="onContentEnter"
    @mouseleave.native="onContentLeave"
    @blur="onBlur"
    @close="onClose"
  >
    <slot />
  </ElPopper>
</template>

<script lang="ts" setup>
import type { PopperInstance } from '../../popper';

import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';

import { ensureArray } from '@/utils/array';
import { Popper as ElPopper } from '../../popper';

import { tooltipContentImplProps } from './props';
import { useTooltipRoot } from './composables';
import { isTriggerType } from './utils';

defineOptions({
  name: 'ElTooltipContentImpl',
  inheritAttrs: false,
});

const props = defineProps(tooltipContentImplProps);

const tooltipRoot = useTooltipRoot();
if (!tooltipRoot) {
  throw new ReferenceError('<el-tooltip-content> requires a TooltipRoot provider.');
}

const {
  triggerEl,
  popperInstanceRef,
  role,
  controlled,
  id,
  open,
  trigger,
  onClose,
  onOpen,
  onShow,
  onHide,
  onBeforeShow,
  onBeforeHide,
} = tooltipRoot;

const popperRef = ref<PopperInstance>();
const referenceRef = computed(() => props.referenceEl || triggerEl.value);
const shouldShow = computed(() => props.disabled ? false : open.value);

watch(
  () => popperRef.value?.instance,
  (instance, _, onCleanup) => {
    onCleanup(() => {
      popperInstanceRef.value = null;
    });

    popperInstanceRef.value = instance;
  },
  { flush: 'sync' },
);

watch(
  () => props.content,
  () => {
    popperRef.value?.updatePopper();
  },
);

const persistentRef = computed(() => {
  // For testing, we would always want the content to be rendered
  // to the DOM, so we need to return true here.
  if (import.meta.env.MODE === 'test') {
    return true;
  }
  return props.persistent;
});

const onContentEnter = () => {
  if (props.enterable && !controlled.value && isTriggerType(trigger.value, 'hover')) {
    onOpen();
  }
};

const onContentLeave = () => {
  if (!controlled.value && isTriggerType(trigger.value, 'hover')) {
    onClose();
  }
};

const onBlur = () => {
  if (!props.virtualTriggering) {
    onClose();
  }
};

let stopHandle: ReturnType<typeof onClickOutside>;

watch(
  open,
  (val) => {
    if (!val) {
      stopHandle?.();
    } else {
      stopHandle = onClickOutside(
        popperRef,
        () => {
          if (controlled.value) return;
          const needClose = ensureArray(trigger.value).every(item => item !== 'hover' && item !== 'focus');
          if (needClose) {
            onClose();
          }
        },
        { detectIframe: true },
      );
    }
  },
  { flush: 'post' },
);

onBeforeUnmount(() => {
  stopHandle?.();
});

defineExpose({
  /**
   * @description validate current focus event is trigger inside el-popper-content
   */
  isFocusInsideContent: (event?: FocusEvent) => popperRef.value?.isFocusInside(event),
  updatePopper: (shouldUpdateZIndex?: boolean) => popperRef.value?.updatePopper(shouldUpdateZIndex),
});
</script>
