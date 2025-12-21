import type { ExtractPropTypes, PropType } from 'vue';
import type { Placement, PositioningStrategy } from '@popperjs/core';
import type { Prettify } from '@/utils/typingUtils';
import type { ReferenceElement, PartialOptions } from './composables';

import { placements } from '@popperjs/core';

export const basePopperProps = {
  fallbackPlacements: {
    type: Array as PropType<Placement[]>,
    default: undefined,
  },
  gpuAcceleration: {
    type: Boolean,
    default: true,
  },
  /**
   * @description offset of the Popper
   * @default 12
   */
  offset: {
    type: Number,
    default: 12,
  },
  /**
   * @description position of Popper
   * @default 'bottom'
   */
  placement: {
    type: String as PropType<Placement>,
    validator: (v: Placement) => placements.includes(v),
    default: 'bottom',
  },
  /**
   * @description [popper.js](https://popper.js.org/docs/v2/) parameters
   */
  popperOptions: {
    type: Object as PropType<PartialOptions>,
    default: () => ({}),
  },
  /**
   * @default 'absolute'
   */
  strategy: {
    type: String as PropType<PositioningStrategy>,
    validator: (v: PositioningStrategy) => ['fixed', 'absolute'].includes(v),
    default: 'absolute',
  },

  showArrow: Boolean,
  arrowOffset: {
    type: Number,
    default: 5,
  },
  effect: String,
  persistent: Boolean,
  disabled: Boolean,
  visible: Boolean,
  focusOnShow: Boolean,
  zIndex: Number,
  transition: String,

  referenceEl: [Element, Object] as PropType<ReferenceElement>,
  ariaLabel: String,
} as const;

export const popperProps = {
  ...basePopperProps,

  id: String,
  role: String,
} as const;

export type PopperProps = Prettify<ExtractPropTypes<typeof popperProps>>;
