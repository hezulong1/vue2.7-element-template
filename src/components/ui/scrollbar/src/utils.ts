import type { CSSProperties, ComponentPublicInstance, InjectionKey } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';

import { computed, onActivated, provide, reactive, shallowRef } from 'vue';
import { isClient, toValue } from '@vueuse/core';
import { getStyleProperty, getScrollbarWidth as _getScrollbarWidth } from '@/utils/dom';
import { supportsCustomizeScrollbar } from '@/utils/canIUse';
import { isNumber } from '@/utils/types';

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

export interface UseScrollableOptions {
  minSize?: MaybeRefOrGetter<number | undefined>;
}

export interface UseScrollableEmits {
  (e: 'scroll', event: ScrollbarScrollEvent): void;
  (e: 'end-reached', event: ScrollbarDirection): void;
}

export const scrollbarContextKey: InjectionKey<ScrollbarContext> = Symbol('scrollbarContext');

// Composables
// ----------------------------------------

export function useScrollable(opts: UseScrollableOptions, emit?: UseScrollableEmits) {
  const minSize = computed(() => toValue(opts.minSize) ?? 20);

  let wrapScrollTop = 0;
  let wrapScrollLeft = 0;
  let direction = '' as ScrollbarDirection;

  const wrapRef = shallowRef<HTMLElement>();
  const state = reactive({
    sizeWidth: '0',
    sizeHeight: '0',
    moveX: 0,
    moveY: 0,
    ratioX: 1,
    ratioY: 1,
  });

  function getScrollbarWidth() {
    if (supportsCustomizeScrollbar) return 0;
    return _getScrollbarWidth();
  }

  function handleScroll() {
    if (!wrapRef.value) return;

    const clientHeight = wrapRef.value.clientHeight;
    const clientWidth = wrapRef.value.clientWidth;

    state.moveY = ((wrapRef.value.scrollTop * 100) / clientHeight) * state.ratioY;
    state.moveX = ((wrapRef.value.scrollLeft * 100) / clientWidth) * state.ratioX;

    const prevTop = wrapScrollTop;
    const prevLeft = wrapScrollLeft;
    wrapScrollTop = wrapRef.value.scrollTop;
    wrapScrollLeft = wrapRef.value.scrollLeft;

    const arrivedStates = {
      bottom: wrapScrollTop + wrapRef.value.clientHeight >= wrapRef.value.scrollHeight,
      top: wrapScrollTop <= 0 && prevTop !== 0,
      right: wrapScrollLeft + wrapRef.value.clientWidth >= wrapRef.value.scrollWidth && prevLeft !== wrapScrollLeft,
      left: wrapScrollLeft <= 0 && prevLeft !== 0,
    };

    if (prevTop !== wrapScrollTop) {
      direction = wrapScrollTop > prevTop ? 'bottom' : 'top';
    }
    if (prevLeft !== wrapScrollLeft) {
      direction = wrapScrollLeft > prevLeft ? 'right' : 'left';
    }

    emit?.('scroll', {
      scrollTop: wrapScrollTop,
      scrollLeft: wrapScrollLeft,
    });

    if (arrivedStates[direction]) emit?.('end-reached', direction);
  }

  function scrollTo(x?: number | ScrollOptions, y?: number) {
    if (!isClient) return;
    if (!wrapRef.value) return;
    if (!wrapRef.value.scrollTo) return;

    if (isNumber(x)) {
      isNumber(y) && wrapRef.value.scrollTo(x, y);
    } else {
      wrapRef.value.scrollTo(x);
    }
  }

  function setScrollTop(value: number) {
    if (!isClient) return;
    if (!wrapRef.value) return;
    wrapRef.value.scrollTop = value;
  }

  function setScrollLeft(value: number) {
    if (!isClient) return;
    if (!wrapRef.value) return;
    wrapRef.value.scrollLeft = value;
  }

  function update() {
    if (!wrapRef.value) return;
    const {
      clientHeight,
      clientWidth,
      scrollHeight,
      scrollWidth,
    } = wrapRef.value;

    const minHeightPercentage = (minSize.value * 100 / clientHeight);
    const minWidthPercentage = (minSize.value * 100 / clientWidth);

    const originHeightPercentage = (clientHeight * 100 / scrollHeight);
    const originWidthPercentage = (clientWidth * 100 / scrollWidth);

    const heightPercentage = Math.max(minHeightPercentage, originHeightPercentage);
    const widthPercentage = Math.max(minWidthPercentage, originWidthPercentage);

    state.ratioY = (originHeightPercentage / (100 - originHeightPercentage)) / (heightPercentage / (100 - heightPercentage));
    state.ratioX = (originWidthPercentage / (100 - originWidthPercentage)) / (widthPercentage / (100 - widthPercentage));

    if (Number.isNaN(state.ratioY)) state.ratioY = 1;
    if (Number.isNaN(state.ratioX)) state.ratioX = 1;

    state.sizeHeight = (heightPercentage < 100) ? (heightPercentage + '%') : '';
    state.sizeWidth = (widthPercentage < 100) ? (widthPercentage + '%') : '';
  }

  provide(scrollbarContextKey, reactive({
    wrapElement: wrapRef,
  }));

  onActivated(() => {
    if (wrapRef.value) {
      wrapRef.value.scrollTop = wrapScrollTop;
      wrapRef.value.scrollLeft = wrapScrollLeft;
    }
  });

  return {
    state,
    wrapRef,
    update,
    scrollTo,
    handleScroll,
    setScrollTop,
    setScrollLeft,
    getScrollbarWidth,
  };
}

// Utils
// ----------------------------------------

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
