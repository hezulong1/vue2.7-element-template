import type { ExtractPropTypes, PropType } from 'vue';
import type { TagEffect, TagType } from '../../tag';

import { componentSizePropType } from '@/utils/vue/size';
import { tooltipContentProps } from '../../tooltip';
import { defaultOptionProps, type OptionPropsAlias } from './utils';

export { defaultOptionProps };
export type SelectOptionAlias = OptionPropsAlias;

export type OptionValue = string | number | boolean | Record<string, any>;

export const optionProps = {
  id: String,
  /**
   * @description value of option
   */
  value: {
    type: [String, Number, Boolean, Object] as PropType<OptionValue>,
    required: true,
  },
  /**
   * @description label of option, same as `value` if omitted
   */
  label: [String, Number] as PropType<string | number>,
  created: Boolean,
  /**
   * @description whether option is disabled
   */
  disabled: Boolean,
} as const;

export type OptionProps = ExtractPropTypes<typeof optionProps>;

const commonProps = {
  visible: Boolean,
  /**
   * @description whether Select is disabled
   */
  disabled: {
    type: Boolean,
    default: undefined,
  },
  triggerKeys: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  /**
   * @description position of dropdown
   */
  placement: {
    ...tooltipContentProps.placement,
    default: 'bottom-start',
  },
  /**
   * @description [popper.js](https://popper.js.org/docs/v2/) parameters
   */
  popperOptions: tooltipContentProps.popperOptions,
  /**
   * @description determines whether the arrow is displayed
   */
  showArrow: {
    type: Boolean,
    default: true,
  },
  /**
   * @description when select dropdown is inactive and `persistent` is `false`, select dropdown will be destroyed
   */
  persistent: {
    type: Boolean,
    default: true,
  },
  /**
   * @description whether select dropdown is teleported, if `true` it will be teleported to where `append-to` sets
   */
  teleported: tooltipContentProps.teleported,
  /**
   * @description which element the selection dropdown appends to
   */
  appendTo: tooltipContentProps.appendTo,
  /**
   * @description custom class name for Select's dropdown
   */
  popperClass: tooltipContentProps.popperClass,
  /**
   * @description custom style for Select's dropdown
   */
  popperStyle: tooltipContentProps.popperStyle,
  /**
   * @description list of possible positions for dropdown
   */
  fallbackPlacements: {
    type: tooltipContentProps.fallbackPlacements.type,
    default: () => ['bottom-start', 'top-start', 'right', 'left'],
  },
  /**
   * @description offset of the dropdown
   */
  offset: tooltipContentProps.offset,
  transition: {
    type: String,
    default: 'el-zoom-in-top',
  },
  /**
   * @description whether multiple-select is activated
   */
  multiple: Boolean,
  /**
   * @description whether the width of the dropdown is the same as the input
   */
  fitInputWidth: Boolean,
  /**
   * @description whether Select is loading data from server
   */
  loading: Boolean,

  ariaLabel: String,
} as const;

export const selectDropdownProps = {
  ...commonProps,

  referenceEl: tooltipContentProps.referenceEl,
  contentId: String,
};

export type SelectDropdownProps = ExtractPropTypes<typeof selectDropdownProps>;

export const selectProps = {
  ...commonProps,

  /**
   * @description the name attribute of select input
   */
  name: String,
  /**
   * @description native input id
   */
  id: String,
  /**
   * @description binding value
   */
  value: {
    type: [Array, String, Number, Boolean, Object] as PropType<OptionValue | OptionValue[] | undefined>,
    default: undefined,
  },
  /**
   * @description the autocomplete attribute of select input
   */
  autocomplete: {
    type: String,
    default: 'off',
  },
  /**
   * @description for non-filterable Select, this prop decides if the option menu pops up when the input is focused
   */
  automaticDropdown: Boolean,
  /**
   * @description size of Input
   */
  size: componentSizePropType,
  /**
   * @description tooltip theme, built-in theme: `dark` / `light`
   */
  effect: {
    type: tooltipContentProps.effect.type,
    default: 'light',
  },
  /**
   * @description whether select can be cleared
   */
  clearable: Boolean,
  /**
   * @description whether Select is filterable
   */
  filterable: Boolean,
  /**
   * @description whether creating new items is allowed. To use this, `filterable` must be true
   */
  allowCreate: Boolean,

  /**
   * @description whether options are loaded from server
   */
  remote: Boolean,
  /**
   * @description debounce delay during remote search, in milliseconds
   */
  debounce: {
    type: Number,
    default: 300,
  },
  /**
   * @description displayed text while loading data from server, default is 'Loading'
   */
  loadingText: String,
  /**
   * @description displayed text when no data matches the filtering query, you can also use slot `empty`, default is 'No matching data'
   */
  noMatchText: String,
  /**
   * @description displayed text when there is no options, you can also use slot `empty`, default is 'No data'
   */
  noDataText: String,
  /**
   * @description function that gets called when the input value changes. Its parameter is the current input value. To use this, `filterable` must be true
   */
  remoteMethod: Function as PropType<(query: string) => void>,
  /**
   * @description custom filter method, the first parameter is the current input value. To use this, `filterable` must be true
   */
  filterMethod: Function as PropType<(query: string) => void>,
  /**
   * @description maximum number of options user can select when `multiple` is `true`. No limit when set to 0
   */
  multipleLimit: {
    type: Number,
    default: 0,
  },
  /**
   * @description placeholder, default is 'Select'
   */
  placeholder: String,
  /**
   * @description select first matching option on enter key. Use with `filterable` or `remote`
   */
  defaultFirstOption: Boolean,
  /**
   * @description when `multiple` and `filter` is true, whether to reserve current keyword after selecting an option
   */
  reserveKeyword: {
    type: Boolean,
    default: true,
  },
  /**
   * @description unique identity key name for value, required when value is an object
   */
  valueKey: {
    type: String,
    default: 'value',
  },
  /**
   * @description whether to collapse tags to a text when multiple selecting
   */
  collapseTags: Boolean,
  /**
   * @description whether show all selected tags when mouse hover text of collapse-tags. To use this, `collapse-tags` must be true
   */
  collapseTagsTooltip: Boolean,
  /**
   * @description the max tags number to be shown. To use this, `collapse-tags` must be true
   */
  maxCollapseTags: {
    type: Number,
    default: 1,
  },
  /**
   * @description tag type
   */
  tagType: {
    type: String as PropType<TagType>,
    default: 'info',
  },
  /**
   * @description tag effect
   */
  tagEffect: {
    type: String as PropType<TagEffect>,
    default: 'light',
  },
  /**
   * @description whether to trigger form validation
   */
  validateEvent: {
    type: Boolean,
    default: true,
  },
  /**
   * @description in remote search method show suffix icon
   */
  remoteShowSuffix: Boolean,
  /**
   * @description tabindex for input
   */
  tabindex: {
    type: [String, Number] as PropType<string | number>,
    default: 0,
  },
  props: {
    type: Object as PropType<SelectOptionAlias>,
    default: () => ({ ...defaultOptionProps }),
  },

  valueOnClear: {
    type: null as unknown as PropType<[null, undefined, '']>,
    validator: (v: any) => [null, undefined, ''].includes(v),
    default: undefined,
  },
} as const;

export type SelectProps = ExtractPropTypes<typeof selectProps>;
