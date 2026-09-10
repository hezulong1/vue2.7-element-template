import type { ComputedRef, InjectionKey, Ref } from 'vue';

import { EVENT_CODE, getEventCode } from '@/utils/event';

export const COLLECTION_ITEM_SIGN = 'data-el-collection-item';
export const reorderArray = <T>(arr: T[], start: number) => arr.map((_, i) => arr[(i + start) % arr.length]);

export type ID = string | number;
export type Orientation = 'horizontal' | 'vertical' | 'both';
export type Direction = 'ltr' | 'rtl';
export type FocusIntent = 'first' | 'last' | 'prev' | 'next';

export interface RovingFocusItem {
  id: ID;
  focusable: boolean;
  ref: HTMLElement | undefined;
  active: boolean;
}

export interface RovingFocusGroupContext {
  elRef: Ref<HTMLElement | undefined>;
  currentTabbedId: ComputedRef<ID | null>;
  // dir: ComputedRef<Direction>;
  // loop: ComputedRef<boolean>;
  // orientation: ComputedRef<Orientation>;
  // tabIndex: ComputedRef<number>;
  onBlur: (e: FocusEvent) => void;
  onFocus: (e: FocusEvent) => void;
  onMousedown: (e: MouseEvent) => void;
  onItemFocus: (id: ID) => void;
  onItemShiftTab: () => void;
  onKeydown: (e: KeyboardEvent) => void;
  // getItems: () => RovingFocusItem[];
  itemMap: Map<Element, RovingFocusItem>;
}

export const ROVING_FOCUS_GROUP_CONTEXT_KEY: InjectionKey<RovingFocusGroupContext> = Symbol('rovingFocusGroupContext');

export interface RovingFocusItemContext {
  elRef: Ref<HTMLElement | undefined>;
  tabIndex: Ref<number>;
  handleMousedown: (e: MouseEvent) => void;
  handleFocus: (e: FocusEvent) => void;
  handleKeydown: (e: KeyboardEvent) => void;
}

export const ROVING_FOCUS_ITEM_CONTEXT_KEY: InjectionKey<RovingFocusItemContext> = Symbol('rovingFocusItemContext');

const MAP_KEY_TO_FOCUS_INTENT: Record<string, FocusIntent> = {
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  ArrowRight: 'next',
  ArrowDown: 'next',
  PageUp: 'first',
  Home: 'first',
  PageDown: 'last',
  End: 'last',
};

const getDirectionAwareKey = (key: string, dir?: Direction) => {
  if (dir !== 'rtl') return key;

  switch (key) {
    case EVENT_CODE.right:
      return EVENT_CODE.left;
    case EVENT_CODE.left:
      return EVENT_CODE.right;
    default:
      return key;
  }
};

export function getFocusIntent(event: KeyboardEvent, orientation?: Orientation, dir?: Direction) {
  const code = getEventCode(event);
  const key = getDirectionAwareKey(code, dir);

  if (
    (orientation === 'vertical' && [EVENT_CODE.left, EVENT_CODE.right].includes(key)) ||
    (orientation === 'horizontal' && [EVENT_CODE.up, EVENT_CODE.down].includes(key))
  ) return;

  return MAP_KEY_TO_FOCUS_INTENT[key];
}

export function focusFirst(els: HTMLElement[]) {
  const prevActive = document.activeElement;

  for (const el of els) {
    if (el === prevActive) return;
    el.focus();
    if (prevActive !== document.activeElement) return;
  }
}
