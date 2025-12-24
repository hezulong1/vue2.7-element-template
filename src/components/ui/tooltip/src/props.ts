import type { ExtractPropTypes, PropType, StyleValue } from 'vue';
import type { Arrayable } from '@vueuse/core';
import type { VirtualElement } from '@popperjs/core';
import type { TooltipEffect, TooltipRoleType, TooltipTriggerType } from './typings';

import { EVENT_CODE } from '@/utils/event';
import { basePopperProps, type ReferenceElement } from '../../popper';

// Trigger
// ----------------------------------------

export const tooltipTriggerProps = {
  /**
   * @description Indicates the reference element to which the popper is attached
   */
  virtualRef: Object as PropType<VirtualElement>,
  /**
   * @description Indicates whether virtual triggering is enabled
   */
  virtualTriggering: Boolean,
  disabled: Boolean,
  /**
   * @description When you click the mouse to focus on the trigger element, you can define a set of keyboard codes to control the display of tooltip through the keyboard, not valid in controlled mode
   */
  triggerKeys: {
    type: Array as PropType<string[]>,
    default: () => [EVENT_CODE.enter, EVENT_CODE.numpadEnter, EVENT_CODE.space],
  },
  /**
   * @description when triggering tooltips through hover, whether to focus the trigger element, which improves accessibility
   */
  focusOnTarget: Boolean,
} as const;

export type TooltipTriggerProps = ExtractPropTypes<typeof tooltipTriggerProps>;

// Content
// ----------------------------------------

export const tooltipContentImplProps = {
  ...basePopperProps,
  /**
   * @description whether Tooltip is disabled
   */
  disabled: Boolean,
  /**
   * @description display content, can be overridden by `slot#content`
   */
  content: {
    type: String,
    default: '',
  },
  /**
   * @description whether `content` is treated as HTML string
   */
  rawContent: Boolean,
  enterable: {
    type: Boolean,
    default: true,
  },
  pure: Boolean,
  virtualTriggering: Boolean,
  referenceEl: [Element, Object] as PropType<ReferenceElement>,

  // Overrides
  // ----------------------------------------

  effect: {
    type: String as PropType<TooltipEffect>,
    default: 'dark',
  },
} as const;

export const tooltipContentProps = {
  ...tooltipContentImplProps,
  /**
   * @description whether tooltip content is teleported, if `true` it will be teleported to where `append-to` sets
   */
  teleported: {
    type: Boolean,
    default: true,
  },
  appendTo: [String, HTMLElement] as PropType<string | HTMLElement>,
  popperClass: null as unknown as PropType<any>,
  popperStyle: null as unknown as PropType<StyleValue>,
} as const;

export type TooltipContentProps = ExtractPropTypes<typeof tooltipContentProps>;

// Tooltip
// ----------------------------------------

export const tooltipProps = {
  ...tooltipTriggerProps,
  ...tooltipContentImplProps,
  /**
   * @description How should the tooltip be triggered (to show), not valid in controlled mode
   */
  trigger: {
    type: [String, Array] as PropType<Arrayable<TooltipTriggerType>>,
    default: 'hover',
  },
  role: {
    type: String as PropType<TooltipRoleType>,
    default: 'tooltip',
  },
  visible: {
    type: Boolean,
    default: undefined,
  },
  /**
   * @description delay of appearance, in millisecond, not valid in controlled mode
   */
  showAfter: {
    type: Number,
    default: 0,
  },
  /**
   * @description delay of disappear, in millisecond, not valid in controlled mode
   */
  hideAfter: {
    type: Number,
    default: 200,
  },
  /**
   * @description disappear automatically, in millisecond, not valid in controlled mode
   */
  autoClose: {
    type: Number,
    default: 0,
  },
  appendTo: [String, HTMLElement] as PropType<string | HTMLElement>,
  popperClass: null as unknown as PropType<any>,
  popperStyle: null as unknown as PropType<StyleValue>,

  // Overrides
  // ----------------------------------------

  showArrow: {
    type: Boolean,
    default: true,
  },
} as const;

export type TooltipProps = ExtractPropTypes<typeof tooltipProps>;
