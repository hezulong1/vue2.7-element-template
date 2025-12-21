import type { Instance, Modifier, Options, State, VirtualElement } from '@popperjs/core';
import type { MaybeRef } from '@vueuse/core';

import { computed, onBeforeUnmount, ref, shallowReadonly, shallowRef, watch } from 'vue';
import { toValue, unrefElement } from '@vueuse/core';
import { createPopper } from '@popperjs/core';

export type PartialOptions = Partial<Options>;

// HACK: 可以直接兼容 @vueuse/core 中的 MaybeElement
export type ElementType = HTMLElement | null | undefined;
export type ReferenceElement = ElementType | VirtualElement;

type InternalState = Pick<State, 'styles' | 'attributes'>;

export function usePopper(
  referenceElRef: MaybeRef<ReferenceElement>,
  popperElRef: MaybeRef<ElementType>,
  opts: MaybeRef<PartialOptions> = {},
) {
  const referenceEl = computed(() => unrefElement(referenceElRef as any) as ReferenceElement);
  const popperEl = computed(() => unrefElement(popperElRef));

  const stateUpdater = {
    name: 'updateState',
    enabled: true,
    phase: 'write',
    fn: ({ state }) => {
      const derivedState = { styles: {}, attributes: {} } as InternalState;

      for (const element of Object.keys(state.elements)) {
        derivedState.styles[element] = state.styles[element] || {};
        derivedState.attributes[element] = state.attributes[element];
      }

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      Object.assign(states.value, derivedState);
    },
    requires: ['computeStyles'],
  } as Modifier<'updateState', any>;

  const options = computed<Options>(() => {
    const { onFirstUpdate, placement, strategy, modifiers } = toValue(opts);

    return {
      onFirstUpdate,
      placement: placement || 'bottom',
      strategy: strategy || 'absolute',
      modifiers: [
        ...(modifiers || []),
        stateUpdater,
        { name: 'applyStyles', enabled: false },
      ],
    };
  });

  const instanceRef = shallowRef<Instance | null>(null);
  const states = ref<InternalState>({
    styles: {
      popper: {
        position: options.value.strategy,
        left: '0',
        top: '0',
      },
      arrow: {
        position: 'absolute',
      },
    },
    attributes: {},
  });

  const destroy = () => {
    if (!instanceRef.value) return;

    instanceRef.value.destroy();
    instanceRef.value = null;
  };

  watch(
    options,
    (newOptions) => {
      instanceRef.value?.setOptions(newOptions);
    },
    { deep: true },
  );

  watch(
    [referenceEl, popperEl],
    ([re, pe]) => {
      destroy();
      if (!re || !pe) return;
      instanceRef.value = createPopper(re, pe, options.value);
    },
  );

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    state: computed(() => ({ ...(instanceRef.value?.state || {}) })),
    styles: computed(() => states.value.styles),
    attributes: computed(() => states.value.attributes),
    update: () => instanceRef.value?.update(),
    forceUpdate: () => instanceRef.value?.forceUpdate(),
    // Preventing end users from modifying the instance.
    instanceRef: shallowReadonly(instanceRef),
  };
}
