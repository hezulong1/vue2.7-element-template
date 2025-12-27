import type { CSSProperties } from 'vue';
import { getStyleProperty } from '@/utils/dom';

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
  style[transform] = `translate${barKeys.axis}(${move}%)`;

  return style;
}
