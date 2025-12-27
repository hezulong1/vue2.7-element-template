import type { ComponentPublicInstance } from 'vue';

export interface ScrollbarContext {
  wrapElement?: HTMLElement;
}

export interface ScrollbarScrollEvent {
  scrollTop: number;
  scrollLeft: number;
}

export type ScrollbarDirection = 'top' | 'bottom' | 'left' | 'right';

export interface ScrollbarInstance extends ComponentPublicInstance {
  /** @description scrollbar wrap ref */
  wrapRef: HTMLElement | undefined;
  /** @description update scrollbar state manually */
  update: VoidFunction;
  /** @description scrolls to a particular set of coordinates */
  scrollTo: (x?: number | ScrollOptions, y?: number) => void;
  /** @description set distance to scroll top */
  setScrollTop: (value: number) => void;
  /** @description set distance to scroll left */
  setScrollLeft: (value: number) => void;
  /** @description handle scroll event */
  handleScroll: VoidFunction;
}
