<template>
  <ElTeleport :disabled="!teleported" :to="appendTo || selector">
    <ElTooltipContentImpl
      ref="contentRef"

      :fallback-placements="fallbackPlacements"
      :gpu-acceleration="gpuAcceleration"
      :offset="offset"
      :placement="placement"
      :popper-options="popperOptions"
      :strategy="strategy"

      :show-arrow="showArrow"
      :arrow-offset="arrowOffset"
      :effect="effect"
      :persistent="persistent"
      :focus-on-show="focusOnShow"
      :z-index="zIndex"
      :transition="transition"
      :aria-label="ariaLabel"

      :disabled="disabled"
      :enterable="enterable"
      :pure="pure"
      :virtual-triggering="virtualTriggering"
      :reference-el="referenceEl"

      :class="popperClass"
      :style="popperStyle"
    >
      <slot />
    </ElTooltipContentImpl>
  </ElTeleport>
</template>

<script lang="ts" setup>
import type { TooltipContentInstance } from './typings';

import { computed, ref } from 'vue';
import { usePopperContainer } from '@/composables/use-popper-container';
import { Teleport as ElTeleport } from '../../teleport';
import ElTooltipContentImpl from './ContentImpl.vue';
import { tooltipContentProps } from './props';

defineOptions({
  name: 'ElTooltipContent',
  inheritAttrs: false,
});

defineProps(tooltipContentProps);

const { selector } = usePopperContainer();
const contentRef = ref<TooltipContentInstance>();

defineExpose({
  popperRef: computed(() => contentRef.value?.popperRef),
  isFocusInsideContent: (event?: FocusEvent) => contentRef.value?.isFocusInsideContent(event),
  updatePopper: (shouldUpdateZIndex?: boolean) => contentRef.value?.updatePopper(shouldUpdateZIndex),
});
</script>
