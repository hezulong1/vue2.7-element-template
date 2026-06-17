import type { CSSProperties, ComponentPublicInstance } from 'vue';

import { getStyleProperty } from '@/utils/dom';
import { createContext } from '@/composables/create-context';

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

export const [provideScrollbar, useScrollbar] = createContext<ScrollbarContext>('scrollbar');

export const BAR_MAP = {
  vertical: {
    offset: 'offsetHeight',
    scroll: 'scrollTop',
    scrollSize: 'scrollHeight',
    size: 'height',
    key: 'vertical',
    axis: 'Y',
    client: 'clientY',
    direction: 'top',
  },
  horizontal: {
    offset: 'offsetWidth',
    scroll: 'scrollLeft',
    scrollSize: 'scrollWidth',
    size: 'width',
    key: 'horizontal',
    axis: 'X',
    client: 'clientX',
    direction: 'left',
  },
} as const;

interface RenderThumbStyleOptions {
  move: number | undefined;
  size: string | undefined;
  barKeys: typeof BAR_MAP[keyof typeof BAR_MAP];
}

const transform = getStyleProperty('transform');

export function renderThumbStyle({ move, size, barKeys }: RenderThumbStyleOptions) {
  const style: CSSProperties = {};

  style[barKeys.size] = size;
  style[transform] = `translate${ barKeys.axis }(${ move }%)`;

  return style;
}
