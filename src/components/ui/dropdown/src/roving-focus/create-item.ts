import type { MaybeRefOrGetter } from '@vueuse/core';
import type { ID } from './utils';

import { computed, inject, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { toValue } from '@vueuse/core';
import { useId } from '@/composables/use-id';
import { EVENT_CODE, getEventCode } from '@/utils/event';
import { ROVING_FOCUS_GROUP_CONTEXT_KEY, ROVING_FOCUS_ITEM_CONTEXT_KEY } from './utils';

export interface CreateRovingFocusItemOptions {
  id?: MaybeRefOrGetter<ID | undefined>;
  active?: MaybeRefOrGetter<boolean | undefined>;
  focusable?: MaybeRefOrGetter<boolean | undefined>;
  onMousedown?: (e: MouseEvent) => void;
  onKeydown?: (e: KeyboardEvent) => void;
  onFocus?: (e: FocusEvent) => void;
}

export function createRovingFocusItem(opts: CreateRovingFocusItemOptions) {
  const id = computed(() => toValue(opts.id) ?? useId().value);
  const active = computed(() => toValue(opts.active) ?? false);
  const focusable = computed(() => toValue(opts.focusable) ?? true);

  const groupContext = inject(ROVING_FOCUS_GROUP_CONTEXT_KEY, undefined)!;
  const isCurrentTab = computed(() => groupContext.currentTabbedId.value === id.value);

  const elRef = ref<HTMLElement | undefined>();

  onMounted(() => {
    const itemEl = elRef.value;
    itemEl && groupContext.itemMap.set(itemEl, {
      ref: itemEl,
      id: id.value,
      active: active.value,
      focusable: focusable.value,
    });
  });

  onBeforeUnmount(() => {
    const itemEl = elRef.value;
    itemEl && groupContext.itemMap.delete(itemEl);
  });

  function handleMousedown(e: MouseEvent) {
    opts.onMousedown?.(e);

    if (focusable.value) {
      groupContext.onItemFocus(id.value);
    } else {
      e.preventDefault();
    }
  }

  function handleFocus(e: FocusEvent) {
    opts.onFocus?.(e);
    groupContext.onItemFocus(id.value);
  }

  function handleKeydown(e: KeyboardEvent) {
    opts.onKeydown?.(e);

    const { shiftKey, target, currentTarget } = e;
    const code = getEventCode(e);

    if (code === EVENT_CODE.tab && shiftKey) {
      groupContext.onItemShiftTab();
      return;
    }

    if (target !== currentTarget) return;
    groupContext.onKeydown(e);
  }

  const exposed = {
    elRef,
    tabIndex: computed(() => isCurrentTab.value ? 0 : -1),
    handleMousedown,
    handleFocus,
    handleKeydown,
  };

  provide(ROVING_FOCUS_ITEM_CONTEXT_KEY, exposed);

  return { ...exposed, id };
}
