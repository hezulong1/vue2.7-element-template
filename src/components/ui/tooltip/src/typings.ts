import type { Ref, ComputedRef, ComponentPublicInstance } from 'vue';
import type { Arrayable } from '@vueuse/core';
import type { Instance } from '@popperjs/core';
import type { PopperInstance, ReferenceElement } from '../../popper';

export type TooltipEffect = 'light' | 'dark';
export type TooltipRoleType = 'dialog' | 'grid' | 'group' | 'listbox' | 'menu' | 'navigation' | 'tooltip' | 'tree';
export type TooltipTriggerType = 'hover' | 'focus' | 'click' | 'contextmenu';

export interface TooltipRootContext {
  triggerEl: Ref<ReferenceElement | null | undefined>;
  contentEl: Ref<HTMLElement | null | undefined>;
  popperInstanceRef: Ref<Instance | null | undefined>;
  role: ComputedRef<string>;

  controlled: ComputedRef<boolean>;
  id: Readonly<Ref<string>>;
  open: Readonly<Ref<boolean>>;
  trigger: Ref<Arrayable<TooltipTriggerType>>;
  onOpen: (e?: Event) => void;
  onClose: (e?: Event) => void;
  onToggle: (e: Event) => void;
  onShow: VoidFunction;
  onHide: VoidFunction;
  onBeforeShow: VoidFunction;
  onBeforeHide: VoidFunction;
}

export interface TooltipSimpleInstance extends ComponentPublicInstance {
  isFocusInsideContent: (event?: FocusEvent) => boolean;
  updatePopper: (shouldUpdateZIndex?: boolean) => void;
}

export interface TooltipContentInstance extends TooltipSimpleInstance {
  popperRef: PopperInstance;
}

export interface TooltipInstance extends TooltipSimpleInstance {
  contentRef: TooltipContentInstance;
  onOpen: (event?: Event | undefined, timeout?: number) => void;
  onClose: (event?: Event | undefined, timeout?: number) => void;
  hide: (event?: Event | undefined) => void;
}
