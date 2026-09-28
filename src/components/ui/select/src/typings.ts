import type { ComponentPublicInstance, ComputedRef, Ref } from 'vue';
import type { OptionProps, OptionValue } from './props';
import type { SelectContext } from './utils';
import type { TooltipContentInstance } from '../../tooltip';

export interface OptionBasic {
  index: number;
  value: OptionValue;
  currentLabel: string | number | boolean;
  isDisabled?: boolean;
}

export interface OptionStates {
  index: number;
  groupDisabled: boolean;
  visible: boolean;
  hover: boolean;
}

export interface OptionExposed {
  id: string;
  currentLabel: ComputedRef<string | number>;
  itemSelected: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  visible: Ref<boolean>;
  hover: Ref<boolean>;
  states: OptionStates;
  select: SelectContext;
  hoverItem: () => void;
  handleMousedown: (event: MouseEvent) => void;
  updateOption: (query: string) => void;
  selectOptionClick: () => void;
}

export type OptionPublicInstance = Omit<ComponentPublicInstance<OptionProps, OptionExposed>, '$parent' | '$el'> & {
  $el: HTMLElement;
  $parent: OptionPublicInstance | null;
};

export interface SelectStates {
  inputValue: string;
  optionValues: OptionValue[];
  selected: OptionBasic[];
  hoveringIndex: number;
  inputHovering: boolean;
  collapseItemWidth: number;
  selectionWidth: number;
  previousQuery: string | null;
  selectedLabel: string;
  menuVisibleOnFocus: boolean;
  isBeforeHide: boolean;
}

export interface SelectDropdownInstance extends TooltipContentInstance {
  update: VoidFunction;
  handleScroll: VoidFunction;
}
