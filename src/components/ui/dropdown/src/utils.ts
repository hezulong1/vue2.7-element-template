import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { TooltipRoleType } from '../../tooltip';
// import type { ComponentSize } from '@/components/base/ConfigProvider';
import type Dropdown from './DropdownImpl.vue';
import type { Arrayable } from '@vueuse/core';

// Dropdown
// ----------------------------------------

export interface DropdownContext {
  contentRef: Ref<HTMLElement | undefined>;
  role: ComputedRef<TooltipRoleType>;
  triggerId: ComputedRef<string>;
  isUsingKeyboard: Ref<boolean>;
  onItemLeave: (e: PointerEvent) => void;
  onItemEnter: (e: PointerEvent) => void;
  handleClose: () => void;

  loop: ComputedRef<boolean>;
  currentTabId: Ref<string | undefined | null>;
  setCurrentTabId: (id: string) => void;
}

export const DROPDOWN_CONTEXT_KEY: InjectionKey<DropdownContext> = Symbol('dropdownContext');

export interface DropdownInstanceContext {
  // dropdownSize?: ComputedRef<ComponentSize>;
  instance?: InstanceType<typeof Dropdown>;
  handleClick?: () => void;
  commandHandler?: (...arg: any[]) => void;
  show?: () => void;
  hide?: () => void;
  trigger?: Ref<Arrayable<string>>;
  hideOnClick?: Ref<boolean>;
  triggerElm?: ComputedRef<HTMLButtonElement | undefined | null>;
}

export const DROPDOWN_INSTANCE_CONTEXT_KEY: InjectionKey<DropdownInstanceContext> = Symbol('dropdownInstanceContext');
