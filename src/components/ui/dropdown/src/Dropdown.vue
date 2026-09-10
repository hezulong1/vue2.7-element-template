<template>
  <ElDropdownPopper
    ref="popperRef"
    :class="dropdownKls"
    :disabled="disabled"
    :trigger-keys="triggerKeys"
    :virtual-ref="virtualRef ?? triggeringElementRef"
    :virtual-triggering="virtualTriggering || splitButton"

    :placement="placement"
    :popper-options="popperOptions"
    :show-arrow="showArrow"
    :persistent="persistent"

    :teleported="teleported"
    :append-to="appendTo"

    :popper-class="['el-dropdown__popper', popperClass]"
    :popper-style="popperStyle"

    :trigger="trigger"
    :show-timeout="showTimeout"
    :hide-timeout="hideTimeout"

    :transition="transition"

    @before-show="handleBeforeShowTooltip"
    @show="handleShowTooltip"
    @before-hide="handleBeforeHideTooltip"
  >
    <template v-if="!splitButton" #trigger>
      <ElOnlyChild
        :id="triggerId"
        ref="triggeringElementRef"
        :tabindex="tabindex"
      >
        <slot name="default" />
      </ElOnlyChild>
    </template>

    <template #content>
      <ElScrollbar view-class="el-dropdown__list" :max-height="maxHeight">
        <slot name="dropdown" />
      </ElScrollbar>
    </template>

    <template v-if="splitButton" #default>
      <ElButton
        ref="referenceElementRef"
        :size="dropdownSize"
        :type="type"
        :disabled="disabled"
        :tabindex="tabindex"
        class="el-dropdown__split-button"
        @click="handlerMainButtonClick"
      >
        <slot name="default" />
      </ElButton>
      <ElButton
        :id="triggerId"
        ref="triggeringElementRef"
        role="button"
        :size="dropdownSize"
        :type="type"
        class="el-dropdown__caret-button"
        :disabled="disabled"
        :tabindex="tabindex"
        aria-label="Toggle Dropdown"
        :icon="ArrowDown"
      />
    </template>
  </ElDropdownPopper>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, provide, ref, toRef } from 'vue';
import { ArrowDown } from 'element-icons';
import { useId } from '@/composables/use-id';
import { isTriggerType, type TooltipInstance } from '../../tooltip';
import { Scrollbar as ElScrollbar } from '../../scrollbar';
import { Button as ElButton } from '../../button';
import { OnlyChild as ElOnlyChild } from '../../slot';
import { useFormSize } from '../../form';
import ElDropdownPopper from './DropdownPopper.vue';
import { DROPDOWN_CONTEXT_KEY, DROPDOWN_INSTANCE_CONTEXT_KEY } from './utils';
import { dropdownProps } from './props';

defineOptions({ name: 'ElDropdown' });

const props = defineProps(dropdownProps);
const emit = defineEmits<{
  (type: 'visible-change', visible: boolean): void;
  (type: 'command', ...args: any[]): void;
  (type: 'click', e: MouseEvent): void;
}>();

const _instance = getCurrentInstance()?.proxy;
const dropdownSize = useFormSize();

const triggeringElementRef = ref<HTMLElement>();
const referenceElementRef = ref<HTMLElement>();
const contentRef = ref<HTMLElement>();
const popperRef = ref<TooltipInstance>();

const currentTabId = ref<string | null>(null);
const isUsingKeyboard = ref(false);

const dropdownKls = computed(() => {
  const cls = ['el-dropdown'];
  if (props.disabled) cls.push('is-disabled');
  if (props.splitButton) {
    if (dropdownSize.value) cls.push(`el-dropdown--${ dropdownSize.value }`);
  }
  return cls;
});

const defaultTriggerId = useId().value;
const triggerId = computed(() => props.id || defaultTriggerId);

function handleClick() {
  popperRef.value?.onClose(undefined, 0);
}

function handleClose() {
  popperRef.value?.onClose();
}

// function handleOpen() {
//   popperRef.value?.onOpen();
// }

function commandHandler(...args: any[]) {
  emit('command', ...args);
}

function onItemEnter() {
  // NOOP for now
}

function onItemLeave() {
  const contentEl = contentRef.value;

  if (isTriggerType(props.trigger, 'hover')) {
    contentEl?.focus({
      preventScroll: true,
    });
  }

  currentTabId.value = null;
}

function handleCurrentTabIdChange(id: string) {
  currentTabId.value = id;
}

function handleBeforeShowTooltip() {
  emit('visible-change', true);
}

function handleShowTooltip(event?: Event) {
  isUsingKeyboard.value = event?.type === 'keydown';
  contentRef.value?.focus();
}

function handleBeforeHideTooltip() {
  emit('visible-change', false);
}

function handlerMainButtonClick(event: MouseEvent) {
  emit('click', event);
}

provide(DROPDOWN_CONTEXT_KEY, {
  contentRef,
  role: computed(() => props.role),
  triggerId,
  isUsingKeyboard,
  onItemEnter,
  onItemLeave,
  handleClose,

  // For-Menu
  currentTabId,
  loop: computed(() => props.loop),
  setCurrentTabId: handleCurrentTabIdChange,
});

provide(DROPDOWN_INSTANCE_CONTEXT_KEY, {
  instance: _instance as any,
  // dropdownSize,
  handleClick,
  commandHandler,
  trigger: toRef(props, 'trigger'),
  hideOnClick: toRef(props, 'hideOnClick'),
});
</script>
