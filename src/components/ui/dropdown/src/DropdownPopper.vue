<template>
  <div>
    <ElTooltipTrigger
      :disabled="disabled"
      :trigger-keys="triggerKeys"
      :virtual-ref="virtualRef"
      :virtual-triggering="virtualTriggering"
      focus-on-target
      role="button"
    >
      <slot name="trigger" />
    </ElTooltipTrigger>
    <ElTooltipContent
      ref="contentRef"
      :fallback-placements="['bottom', 'top']"
      :placement="placement"
      :popper-options="popperOptions"

      :show-arrow="showArrow"
      :persistent="persistent"

      :disabled="disabled"
      :virtual-triggering="virtualTriggering"
      :transition="transition"

      :teleported="teleported"
      :append-to="appendTo"

      :class="popperClass"
      :style="popperStyle"

      pure
      effect="light"
    >
      <slot name="content" />
    </ElTooltipContent>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue';
import {
  TooltipContent as ElTooltipContent,
  TooltipTrigger as ElTooltipTrigger,
  tooltipEmit,
  createTooltipRoot,
  type TooltipContentInstance,
} from '../../tooltip';
import { dropdownPopperProps } from './props';

defineOptions({ name: 'ElDropdownPopper' });

const props = defineProps(dropdownPopperProps);
const emit = defineEmits(tooltipEmit);

const showAfter = computed(() => props.trigger === 'hover' ? props.showTimeout : 0);
const hideAfter = computed(() => props.trigger === 'hover' ? props.hideTimeout : 0);

const {
  onOpen,
  onClose,
  hide,
} = createTooltipRoot(reactive({
  disabled: toRef(props, 'disabled'),
  role: toRef(props, 'role'),
  trigger: toRef(props, 'trigger'),
  showAfter,
  hideAfter,
  autoClose: 0,
}), emit);

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
   * @description expose onOpen function to manage el-tooltip open state
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
