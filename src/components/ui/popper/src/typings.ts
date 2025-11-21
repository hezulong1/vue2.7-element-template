import type { CSSProperties, ComputedRef, Ref } from 'vue';
import type { Instance } from '@popperjs/core';

export interface Measurable {
  getBoundingClientRect: () => DOMRect;
}

export type PopperEffect = 'light' | 'dark';

export interface PopperRootContext {
  triggerRef: Ref<Measurable | null>;
  contentRef: Ref<HTMLElement | null>;
  referenceRef: Ref<Measurable | null>;
  popperInstanceRef: Ref<Instance | undefined>;
  role: ComputedRef<string>;
}

export interface PopperContentContext {
  arrowRef: Ref<HTMLElement | null>;
  arrowStyle: ComputedRef<CSSProperties>;
}

export interface PopperContentInstance {
  popperContentRef: Ref<HTMLElement | null>;
  popperInstanceRef: ComputedRef<Instance | undefined>;
  contentStyle: ComputedRef<CSSProperties[]>;
  updatePopper: (shouldUpdateZIndex?: boolean) => void;
}

export interface PopperTriggerInstance {
  triggerRef: Ref<Measurable | null>;
}
