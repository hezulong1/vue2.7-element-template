import type { CSSProperties, ComputedRef, Ref } from 'vue';
import type { Instance, VirtualElement } from '@popperjs/core';

export type PopperEffect = 'light' | 'dark';

export interface PopperRootContext {
  triggerRef: Ref<VirtualElement | null>;
  contentRef: Ref<HTMLElement | null>;
  referenceRef: Ref<VirtualElement | null>;
  popperInstanceRef: Ref<Instance | undefined>;
  role: ComputedRef<string>;
}

export interface PopperContentContext {
  arrowRef: Ref<HTMLElement | null>;
  arrowStyle: ComputedRef<CSSProperties>;
}

export interface PopperContentInstance {
  popperContentRef: HTMLElement | null;
  popperInstanceRef: Instance | undefined;
  contentStyle: CSSProperties[];
  updatePopper: (shouldUpdateZIndex?: boolean) => void;
}

export interface PopperTriggerInstance {
  triggerRef: VirtualElement | null;
}
