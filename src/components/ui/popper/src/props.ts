import type { ExtractPropTypes, PropType, StyleValue } from 'vue';
import type { Options, Placement, PositioningStrategy, VirtualElement } from '@popperjs/core';
import type { PopperEffect } from './typings';

import { placements } from '@popperjs/core';

export type PartialOptions = Partial<Options>;

export const popperCoreConfigProps = {
  boundariesPadding: {
    type: Number,
    default: 0,
  },
  fallbackPlacements: {
    type: Array as PropType<Placement[]>,
    default: undefined,
  },
  gpuAcceleration: {
    type: Boolean,
    default: true,
  },
  /**
   * @description offset of the Tooltip
   * @default 12
   */
  offset: {
    type: Number,
    default: 12,
  },
  /**
   * @description position of Tooltip
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
} as const;

export type PopperCoreConfigProps = ExtractPropTypes<typeof popperCoreConfigProps>;

// PopperContent
// ----------------------------------------

export const popperContentProps = {
  ...popperCoreConfigProps,
  arrowOffset: {
    type: Number,
    default: 5,
  },
  id: String,
  effect: {
    type: String as PropType<PopperEffect>,
    validator: (v: PopperEffect) => ['light', 'dark'].includes(v),
    default: 'dark',
  },
  visible: Boolean,
  enterable: {
    type: Boolean,
    default: true,
  },
  pure: Boolean,
  focusOnShow: Boolean,
  trapping: Boolean,
  popperClass: {
    type: [String, Array, Object] as PropType<any>,
  },
  popperStyle: {
    type: [String, Array, Object] as PropType<StyleValue>,
  },
  referenceEl: {
    type: Object as PropType<HTMLElement>,
  },
  triggerTargetEl: {
    type: Object as PropType<HTMLElement>,
  },
  stopPopperMouseEvent: {
    type: Boolean,
    default: true,
  },
  virtualTriggering: Boolean,
  zIndex: Number,
  ariaLabel: String,
} as const;

export type PopperContentProps = ExtractPropTypes<typeof popperContentProps>;

// export const popperContentEmits = {
//   mouseenter: (evt: MouseEvent) => evt instanceof MouseEvent,
//   mouseleave: (evt: MouseEvent) => evt instanceof MouseEvent,
//   focus: () => true,
//   blur: () => true,
//   close: () => true,
// };
// export type PopperContentEmits = typeof popperContentEmits;

// PopperTrigger
// ----------------------------------------

type EventHandler<T extends Event = Event, R = void> = (e: T) => R;

export const popperTriggerProps = {
  /** @description Indicates the reference element to which the popper is attached */
  virtualRef: Object as PropType<VirtualElement>,
  /** @description Indicates whether virtual triggering is enabled */
  virtualTriggering: Boolean,
  onMouseenter: Function as PropType<EventHandler>,
  onMouseleave: Function as PropType<EventHandler>,
  onClick: Function as PropType<EventHandler>,
  onKeydown: Function as PropType<EventHandler>,
  onFocus: Function as PropType<EventHandler>,
  onBlur: Function as PropType<EventHandler>,
  onContextmenu: Function as PropType<EventHandler>,
  id: String,
  open: Boolean,
} as const;

export type PopperTriggerProps = typeof popperTriggerProps;
