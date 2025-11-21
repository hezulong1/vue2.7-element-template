import type { MaybeRefOrGetter } from '@vueuse/core';
import type { Instance } from '@popperjs/core';
import type { PopperRootContext } from './typings';

import { computed, ref } from 'vue';
import { toValue } from '@vueuse/core';
import { providePopperRoot } from './composables';

export interface CreatePopperRootOptions {
  role?: MaybeRefOrGetter<string | undefined>;
}

export function createPopperRoot(opts: CreatePopperRootOptions = {}) {
  const role = computed(() => toValue(opts.role) ?? 'tooltip');
  const triggerRef = ref<HTMLElement>();
  const popperInstanceRef = ref<Instance>();
  const contentRef = ref<HTMLElement>();
  const referenceRef = ref<HTMLElement>();

  const popperProvides = {
    /**
     * @description trigger element
     */
    triggerRef,
    /**
     * @description popperjs instance
     */
    popperInstanceRef,
    /**
     * @description popper content element
     */
    contentRef,
    /**
     * @description popper reference element
     */
    referenceRef,
    /**
     * @description role determines how aria attributes are distributed
     */
    role,
  } as PopperRootContext;

  providePopperRoot(popperProvides);

  return popperProvides;
}
