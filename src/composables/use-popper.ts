import type { Ref } from 'vue';
import type { Instance, Modifier, Options, State, VirtualElement } from '@popperjs/core';
import type { MaybeRef } from '@vueuse/core';

import { computed, onBeforeUnmount, ref, shallowRef, unref, watch } from 'vue';
import { toValue } from '@vueuse/core';
import { createPopper } from '@popperjs/core';

type ElementType = HTMLElement | null | undefined;
type ReferenceElement = ElementType | VirtualElement;
type InternalState = Pick<State, 'styles' | 'attributes'>;

export type PartialOptions = Partial<Options>;

export function usePopper(referenceElRef: Ref<ReferenceElement>, popperElRef: Ref<ElementType>, opts: MaybeRef<PartialOptions> = {}) {
  const stateUpdater = {
    name: 'updateState',
    enabled: true,
    phase: 'write',
    fn: ({ state }) => {
      const derivedState = deriveState(state);

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

  const instanceRef = shallowRef<Instance | undefined>();
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
    instanceRef.value = undefined;
  };

  watch(
    options,
    (newOptions) => {
      instanceRef.value?.setOptions(newOptions);
    },
    {
      deep: true,
    },
  );

  watch(
    [referenceElRef, popperElRef],
    ([referenceElement, popperElement]) => {
      destroy();
      if (!referenceElement || !popperElement) return;

      instanceRef.value = createPopper(
        referenceElement,
        popperElement,
        options.value,
      );
    },
  );

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    state: computed(() => ({ ...(unref(instanceRef)?.state || {}) })),
    styles: computed(() => unref(states).styles),
    attributes: computed(() => unref(states).attributes),
    update: () => unref(instanceRef)?.update(),
    forceUpdate: () => unref(instanceRef)?.forceUpdate(),
    // Preventing end users from modifying the instance.
    instanceRef: computed(() => unref(instanceRef)),
  };
}

function deriveState(state: State) {
  const result = { styles: {}, attributes: {} } as InternalState;

  for (const element of Object.keys(state.elements)) {
    result.styles[element] = state.styles[element] || {};
    result.attributes[element] = state.attributes[element];
  }

  return result;
}

export type UsePopperReturn = ReturnType<typeof usePopper>;
