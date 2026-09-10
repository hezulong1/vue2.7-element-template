import type { MaybeRefOrGetter } from '@vueuse/core';
import type { Direction, ID, Orientation, RovingFocusItem } from './utils';

import { computed, nextTick, provide, ref, watch } from 'vue';
import { toValue, useEventListener } from '@vueuse/core';
import { COLLECTION_ITEM_SIGN, ROVING_FOCUS_GROUP_CONTEXT_KEY, focusFirst, getFocusIntent, reorderArray } from './utils';

export interface CreateRovingFocusGroupOptions {
  dir?: MaybeRefOrGetter<Direction | undefined>;
  loop?: MaybeRefOrGetter<boolean | undefined>;
  orientation?: MaybeRefOrGetter<Orientation | undefined>;
  currentTabId?: MaybeRefOrGetter<ID | undefined | null>;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onMousedown?: (e: MouseEvent) => void;
  onCurrentTabIdChange?: (id: ID) => void;
  onEntryFocus?: (...args: any[]) => void;
}

const ENTRY_FOCUS_EVT = 'roving-focus-group.entry-focus';

export function createRovingFocusGroup(opts: CreateRovingFocusGroupOptions = {}) {
  const dir = computed(() => toValue(opts.dir) ?? 'ltr');
  const loop = computed(() => toValue(opts.loop) ?? true);
  const orientation = computed(() => toValue(opts.orientation) ?? 'both');
  const currentTabbedId = ref(toValue(opts.currentTabId) ?? null);

  const itemMap = new Map<Element, RovingFocusItem>();
  const elRef = ref<HTMLElement>();

  const getItems = () => {
    const el = elRef.value;
    if (!el) return [];

    const orderedNodes = Array.from(el.querySelectorAll(`[${ COLLECTION_ITEM_SIGN }]`));
    const items = [...itemMap.values()];

    return items.sort((a, b) => orderedNodes.indexOf(a.ref!) - orderedNodes.indexOf(b.ref!));
  };

  const isBackingOut = ref(false);
  const isClickFocus = ref(false);

  function onItemFocus(tabbedId: ID) {
    opts?.onCurrentTabIdChange?.(tabbedId);
  }

  function onItemShiftTab() {
    isBackingOut.value = true;
  }

  function onMousedown(e: MouseEvent) {
    opts.onMousedown?.(e);
    isClickFocus.value = true;
  }

  function onFocus(e: FocusEvent) {
    opts.onFocus?.(e);
    const { target, currentTarget } = e;

    if (target === currentTarget && !isClickFocus.value && !isBackingOut.value) {
      const entryFocusEvt = new Event(ENTRY_FOCUS_EVT, { bubbles: false, cancelable: true });
      currentTarget?.dispatchEvent(entryFocusEvt);

      if (!entryFocusEvt.defaultPrevented) {
        const items = getItems().filter(item => item.focusable);
        const activeItem = items.find(item => item.active);
        const currentItem = items.find(item => item.id === currentTabbedId.value);
        const candidates = [activeItem!, currentItem!, ...items].filter(Boolean);
        const candidateNodes = candidates.map(item => item.ref!);
        focusFirst(candidateNodes);
      }
    }

    isClickFocus.value = false;
  }

  function onBlur(e: FocusEvent) {
    opts.onBlur?.(e);
    isBackingOut.value = false;
  }

  function handleEntryFocus(...args: any[]) {
    opts?.onEntryFocus?.(...args);
  }

  function onKeydown(e: KeyboardEvent) {
    const focusIntent = getFocusIntent(e, orientation.value, dir.value);
    if (!focusIntent) return;

    e.preventDefault();

    let elements = getItems()
      .filter(item => item.focusable)
      .map(item => item.ref!);

    switch (focusIntent) {
      case 'last': {
        elements.reverse();
        break;
      }
      case 'prev':
      case 'next': {
        if (focusIntent === 'prev') {
          elements.reverse();
        }
        const currentIdx = elements.indexOf(e.currentTarget as HTMLElement);
        elements = loop.value
          ? reorderArray(elements, currentIdx + 1)
          : elements.slice(currentIdx + 1);
        break;
      }
      default: {
        break;
      }
    }

    nextTick(() => {
      focusFirst(elements);
    });
  }

  const exposed = {
    elRef,
    currentTabbedId: computed(() => currentTabbedId.value),
    // loop,
    // dir,
    // orientation,
    // tabIndex: computed(() => isBackingOut.value ? -1 : 0),
    onItemFocus,
    onItemShiftTab,
    onBlur,
    onFocus,
    onMousedown,
    onKeydown,
    // getItems,
    itemMap,
  };

  provide(ROVING_FOCUS_GROUP_CONTEXT_KEY, exposed);

  watch(
    () => toValue(opts.currentTabId),
    (val) => {
      currentTabbedId.value = val ?? null;
    },
  );

  useEventListener(elRef, ENTRY_FOCUS_EVT, handleEntryFocus);

  return exposed;
}
