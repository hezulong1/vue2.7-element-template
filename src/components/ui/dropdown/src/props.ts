import type { PropType } from 'vue';
import type { ButtonType } from '../../button';
import type { Arrayable } from '@vueuse/core';

import { EVENT_CODE } from '@/utils/event';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { tooltipTriggerProps, tooltipContentProps, type TooltipRoleType, type TooltipTriggerType } from '../../tooltip';

export type DropdownTrigger = Arrayable<Exclude<TooltipTriggerType, 'focus'>>;

export const dropdownPopperProps = {
  /**
   * @description Indicates the reference element to which the popper is attached
   */
  virtualRef: tooltipTriggerProps.virtualRef,
  /**
   * @description Indicates whether virtual triggering is enabled
   */
  virtualTriggering: Boolean,
  /**
   * @description how to trigger
   */
  trigger: {
    type: [String, Array] as PropType<DropdownTrigger>,
    validator: (val: any) => ['hover', 'click', 'contextmenu'].includes(val),
    default: 'hover',
  },
  /**
   * @description When you click the mouse to focus on the trigger element, you can define a set of keyboard codes to control the display of tooltip through the keyboard, not valid in controlled mode
   */
  triggerKeys: {
    type: Array as PropType<string[]>,
    default: () => [EVENT_CODE.enter, EVENT_CODE.numpadEnter, EVENT_CODE.space, EVENT_CODE.down],
  },

  placement: tooltipContentProps.placement,
  popperOptions: tooltipContentProps.popperOptions,
  showArrow: {
    type: Boolean,
    default: true,
  },
  /**
   * @description delay time before show a dropdown (only works when trigger is `hover`)
   */
  showTimeout: {
    type: Number,
    default: 150,
  },
  /**
   * @description delay time before hide a dropdown (only works when trigger is `hover`)
   */
  hideTimeout: {
    type: Number,
    default: 150,
  },
  /**
   * @description whether the dropdown popup is teleported to the body
   */
  teleported: tooltipContentProps.teleported,
  /**
   * @description which element the dropdown CONTENT appends to
   */
  appendTo: tooltipContentProps.appendTo,
  /**
   * @description when dropdown inactive and `persistent` is `false` , dropdown menu will be destroyed
   */
  persistent: {
    type: Boolean,
    default: true,
  },
  /**
   * @description custom class name for Dropdown's dropdown
   */
  popperClass: tooltipContentProps.popperClass,
  /**
   * @description custom style for Dropdown's dropdown
   */
  popperStyle: tooltipContentProps.popperStyle,
  /**
   * @description whether to disable
   */
  disabled: Boolean,
  role: {
    type: String as PropType<TooltipRoleType>,
    default: 'menu',
  },

  transition: {
    type: String,
    default: 'el-zoom-in-top',
  },
} as const;

export const dropdownProps = {
  ...dropdownPopperProps,

  /**
   * @description menu button type, refer to `Button` Component, only works when `split-button` is true
   */
  type: {
    type: String as PropType<ButtonType>,
    default: 'default',
  },

  id: String,
  size: useSizeProp,
  /**
   * @description whether a button group is displayed
   */
  splitButton: Boolean,
  /**
   * @description whether to hide menu after clicking menu-item
   */
  hideOnClick: {
    type: Boolean,
    default: true,
  },
  loop: {
    type: Boolean,
    default: true,
  },
  /**
   * @description whether the tooltip content has an arrow
   */
  showArrow: {
    type: Boolean,
    default: true,
  },

  /**
   * @description [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) of Dropdown
   */
  tabindex: {
    type: [Number, String] as PropType<number | string>,
    default: 0,
  },
  /**
   * @description the max height of menu
   */
  maxHeight: {
    type: [Number, String] as PropType<number | string>,
    default: '',
  },
} as const;
