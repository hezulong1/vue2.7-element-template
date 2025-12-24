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
      :content="content"
      :raw-content="rawContent"
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

import { tooltipProps } from './props';
import { createTooltipRoot } from './TooltipRoot';

defineOptions({
  name: 'ElTooltip',
});

const props = defineProps(tooltipProps);
// Vue2 中 TS 类型必须写在当前文件中，若改此处记得同步修改 TooltipRoot.tsx 中的 Emit 声明
const emit = defineEmits<{
  (type: 'update:visible', value: boolean): void;
  (type: 'before-show', e?: Event): void;
  (type: 'before-hide', e?: Event): void;
  (type: 'show', e?: Event): void;
  (type: 'hide', e?: Event): void;
  (type: 'open', e?: Event): void;
  (type: 'close', e?: Event): void;
}>();

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
  updatePopper: (shouldUpdateZIndex = false) => contentRef.value?.updatePopper(shouldUpdateZIndex),
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
