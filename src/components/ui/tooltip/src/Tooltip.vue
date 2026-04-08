<template>
  <ElRenderApp :to="appendTo || selector" auto-update>
    <ElTooltipTrigger
      :disabled="disabled"
      :trigger="trigger"
      :trigger-keys="triggerKeys"
      :virtual-ref="virtualRef"
      :virtual-triggering="virtualTriggering"
      :focus-on-target="focusOnTarget"
    >
      <slot v-if="$slots.default" />
    </ElTooltipTrigger>

    <ElTooltipContentImpl
      slot="app"
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
      <slot name="content">
        <span v-if="rawContent" v-html="content" />
        <span v-else>{{ content }}</span>
      </slot>
    </ElTooltipContentImpl>
  </ElRenderApp>
</template>

<script setup lang="ts">
import type { TooltipContentInstance } from './typings';

import { ref } from 'vue';
import { usePopperContainer } from '@/composables/use-popper-container';
import { RenderApp as ElRenderApp } from '../../teleport';
import ElTooltipTrigger from './Trigger.vue';
import ElTooltipContentImpl from './ContentImpl.vue';

import { tooltipProps, tooltipEmit } from './props';
import { createTooltipRoot } from './TooltipRoot';

defineOptions({
  name: 'ElTooltip',
});

const props = defineProps(tooltipProps);
const emit = defineEmits(tooltipEmit);

const {
  onOpen,
  onClose,
  hide,
} = createTooltipRoot(props, emit);
const { selector } = usePopperContainer();

const contentRef = ref<TooltipContentInstance>();

defineExpose({
  /**
   * @description el-tooltip-content component instance
   */
  contentRef,
  /**
   * @description validate current focus event is trigger inside el-tooltip-content
   */
  isFocusInsideContent: (event?: FocusEvent) => contentRef.value?.isFocusInsideContent(event),
  /**
   * @description update el-popper component instance
   */
  updatePopper: (shouldUpdateZIndex?: boolean) => contentRef.value?.updatePopper(shouldUpdateZIndex),
  /**
   * @description expose onOpen function to mange el-tooltip open state
   */
  onOpen,
  /**
   * @description expose onClose function to manage el-tooltip close state
   */
  onClose,
  /**
   * @description expose hide function
   */
  hide,
});
</script>
