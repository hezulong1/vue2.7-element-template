<template>
  <ElOnlyChild v-if="!virtualTriggering" v-bind="$attrs" class="el-tooltip__trigger">
    <slot />
  </ElOnlyChild>
</template>

<script setup lang="ts">
import { nextTick, watch, watchEffect } from 'vue';
import { unrefElement } from '@vueuse/core';
import { getEventCode } from '@/utils/event';
import { focusElement, isFocusable } from '@/utils/aria';
import { isElement } from '@/utils/dom';
import { OnlyChild as ElOnlyChild, provideForwardRefSetter } from '../../slot';
import { useTooltipRoot } from './composables';
import { isTriggerType } from './utils';
import { tooltipTriggerProps } from './props';

defineOptions({
  name: 'ElTooltipTrigger',
  inheritAttrs: false,
});

const props = defineProps(tooltipTriggerProps);

const tooltipRoot = useTooltipRoot();
if (!tooltipRoot) {
  throw new ReferenceError('<el-tooltip-trigger> requires a TooltipRoot provider.');
}

const {
  role,
  trigger,
  triggerEl,
  controlled,
  id,
  open,
  onOpen,
  onClose,
  onToggle,
} = tooltipRoot;

provideForwardRefSetter((el) => {
  triggerEl.value = el;
});

const triggerIsNot = (type?: string) => {
  const stop = controlled.value || props.disabled;
  if (stop) return true;
  if (typeof type === 'undefined') return false;
  return !isTriggerType(trigger.value, type);
};

function handleMouseEnter(e: MouseEvent) {
  if (triggerIsNot('hover')) return;
  onOpen(e);
  props.focusOnTarget && e.target && nextTick(() => {
    focusElement(e.target as HTMLElement, { preventScroll: true });
  });
}

function handleMouseLeave(e: MouseEvent) {
  if (triggerIsNot('hover')) return;
  onClose(e);
}

function handleClick(e: PointerEvent) {
  if (triggerIsNot('click')) return;
  e.button === 0 && onToggle(e);
}

function handleFocus(e: FocusEvent) {
  if (triggerIsNot('focus')) return;
  onOpen(e);
}

function handleBlur(e: FocusEvent) {
  if (triggerIsNot('focus')) return;
  onClose(e);
}

function handleContextMenu(e: Event) {
  if (triggerIsNot('contextmenu')) return;
  e.preventDefault();
  onToggle(e);
}

function handleKeyDown(e: KeyboardEvent) {
  if (triggerIsNot()) return;
  const code = getEventCode(e);
  if (props.triggerKeys.includes(code)) {
    e.preventDefault();
    onToggle(e);
  }
}

const cleanups: VoidFunction[] = [];
const cleanup = () => {
  if (cleanups.length === 0) return;
  cleanups.forEach(fn => fn());
  cleanups.length = 0;
};

const register = (el: any, event: string, listener: any, options: any) => {
  el.addEventListener(event, listener, options);
  return () => el.removeEventListener(event, listener, options);
};

watch(
  () => unrefElement(triggerEl as any),
  (el, _, onCleanup) => {
    onCleanup(cleanup);

    if (!el || !isElement(el)) return;

    cleanups.push(
      register(el, 'mouseenter', handleMouseEnter, false),
      register(el, 'mouseleave', handleMouseLeave, false),
      register(el, 'click', handleClick, false),
      register(el, 'focus', handleFocus, true),
      register(el, 'blur', handleBlur, true),
      register(el, 'contextmenu', handleContextMenu, false),
      register(el, 'keydown', handleKeyDown, false),
    );

    if (isFocusable(el as HTMLElement)) {
      cleanups.push(
        watch(
          [role, open, id],
          ([_role, _open, _id]) => {
            if (_role === 'tooltip') {
              el.removeAttribute('aria-haspopup');
              el.removeAttribute('aria-controls');
              el.removeAttribute('aria-expanded');
              if (_open && _id) {
                el.setAttribute('aria-describedby', _id);
              } else {
                el.removeAttribute('aria-describedby');
              }
            } else {
              el.setAttribute('aria-haspopup', _role);
              el.setAttribute('aria-controls', _id);
              el.setAttribute('aria-expanded', _open.toString());
              el.removeAttribute('aria-describedby');
            }
          },
          { immediate: true },
        ),
        () => {
          [
            'aria-controls',
            'aria-describedby',
            'aria-haspopup',
            'aria-expanded',
          ].forEach((key) => {
            el.removeAttribute(key);
          });
        },
      );
    }
  },
  { immediate: true, flush: 'post' },
);

watchEffect(() => {
  if (props.virtualRef) {
    triggerEl.value = unrefElement(props.virtualRef as any);
  }
});
</script>
