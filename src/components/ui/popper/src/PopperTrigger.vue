<template>
  <ElOnlyChild
    v-if="!virtualTriggering"
    v-bind="$attrs"
    :aria-controls="ariaControls"
    :aria-describedby="ariaDescribedby"
    :aria-expanded="ariaExpanded"
    :aria-haspopup="ariaHaspopup"
  >
    <slot />
  </ElOnlyChild>
</template>

<script lang="ts" setup>
import type { WatchStopHandle } from 'vue';

import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { unrefElement } from '@vueuse/core';
import { isUndefinedOrNull } from '@/utils/types';
import { isFocusable } from '@/utils/aria';
import { isElement } from '@/utils/dom';
import { provideForwardRefSetter, OnlyChild as ElOnlyChild } from '../../slot';
import { popperTriggerProps } from './props';
import { usePopperRoot } from './composables';

defineOptions({
  name: 'ElPopperTrigger',
  inheritAttrs: false,
});

const props = defineProps(popperTriggerProps);

const popperRoot = usePopperRoot();
if (!popperRoot) {
  throw new ReferenceError('[popper-trigger] requires a PopperRoot provider.');
}

const { role, triggerRef } = popperRoot;

provideForwardRefSetter((el) => {
  triggerRef.value = el;
});

const ariaHaspopup = computed(() => role.value !== 'tooltip' ? role.value : undefined);
const ariaControls = computed(() => ariaHaspopup.value ? props.id : undefined);
const ariaDescribedby = computed(() => role.value === 'tooltip' && props.open && props.id ? props.id : undefined);
const ariaExpanded = computed(() => ariaHaspopup.value ? props.open.toString() : undefined);

let virtualTriggerAriaStopWatch: WatchStopHandle | undefined;

const TRIGGER_ELE_EVENTS = [
  'onMouseenter',
  'onMouseleave',
  'onClick',
  'onKeydown',
  'onFocus',
  'onBlur',
  'onContextmenu',
] as const;

onMounted(() => {
  watch(
    () => props.virtualRef,
    (virtualEl) => {
      if (virtualEl) {
        triggerRef.value = unrefElement(virtualEl as any);
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    triggerRef,
    (el, prevEl) => {
      virtualTriggerAriaStopWatch?.();
      virtualTriggerAriaStopWatch = undefined;
      if (isElement(el)) {
        TRIGGER_ELE_EVENTS.forEach((eventName) => {
          const handler = props[eventName];
          if (handler) {
            (el as HTMLElement).addEventListener(
              eventName.slice(2).toLowerCase(),
              handler,
              ['onFocus', 'onBlur'].includes(eventName),
            );
            (prevEl as HTMLElement)?.removeEventListener?.(
              eventName.slice(2).toLowerCase(),
              handler,
              ['onFocus', 'onBlur'].includes(eventName),
            );
          }
        });
        if (isFocusable(el as HTMLElement)) {
          virtualTriggerAriaStopWatch = watch(
            [ariaControls, ariaDescribedby, ariaHaspopup, ariaExpanded],
            (watches) => {
              [
                'aria-controls',
                'aria-describedby',
                'aria-haspopup',
                'aria-expanded',
              ].forEach((key, idx) => {
                isUndefinedOrNull(watches[idx])
                  ? el.removeAttribute(key)
                  : el.setAttribute(key, watches[idx]!);
              });
            },
            { immediate: true },
          );
        }
      }
      if (isElement(prevEl) && isFocusable(prevEl as HTMLElement)) {
        [
          'aria-controls',
          'aria-describedby',
          'aria-haspopup',
          'aria-expanded',
        ].forEach(key => prevEl.removeAttribute(key));
      }
    },
    {
      immediate: true,
    },
  );
});

onBeforeUnmount(() => {
  virtualTriggerAriaStopWatch?.();
  virtualTriggerAriaStopWatch = undefined;
  if (triggerRef.value && isElement(triggerRef.value)) {
    const el = triggerRef.value as HTMLElement;
    TRIGGER_ELE_EVENTS.forEach((eventName) => {
      const handler = props[eventName];
      if (handler) {
        el.removeEventListener(
          eventName.slice(2).toLowerCase(),
          handler,
          ['onFocus', 'onBlur'].includes(eventName),
        );
      }
    });
    triggerRef.value = null;
  }
});

defineExpose({
  triggerRef,
});
</script>
