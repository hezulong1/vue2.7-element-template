<template>
  <ElFocusTrap
    v-if="shouldRender"
    v-bind="contentAttrs"
    ref="focusTrapRef"
    :class="['el-popper', effect ? `is-${effect}` : undefined, transitionName]"
    :style="[{ zIndex: contentZIndex }, popperStyle.popper]"
    :active="trapped"
    :aria-hidden="`${ariaHidden}`"
    tabindex="-1"
  >
    <transition :name="transitionName" :appear="!persistent" v-on="transitionHooks">
      <div
        v-show="visible"
        :id="id"
        class="el-popper__inner"
        :role="role"
        :aria-modal="role === 'dialog' ? 'true' : undefined"
        :aria-label="ariaLabel"
      >
        <slot />
        <div
          v-if="showArrow"
          ref="arrowElRef"
          class="el-popper__arrow"
          :style="popperStyle.arrow"
          data-popper-arrow
          inert
        />
      </div>
    </transition>
  </ElFocusTrap>
</template>

<script lang="ts" setup>
import type { CSSProperties, ComponentPublicInstance } from 'vue';

import { computed, ref, watch, inject, onMounted, provide } from 'vue';
import { noop } from '@vueuse/core';

import { isNumber, isDefined } from '@/utils/types';
import { focusElement } from '@/utils/aria';
import { useZIndex } from '@/composables/use-z-index';

import { formItemContextKey } from '../../form';
import { FocusTrap as ElFocusTrap } from '../../focus-trap';

import { popperProps } from './props';
import { usePopper } from './composables';

defineOptions({
  name: 'ElPopper',
});

const props = defineProps(popperProps);
const emit = defineEmits<{
  (type: 'before-enter', el: Element): void;
  (type: 'after-enter', el: Element): void;
  (type: 'before-leave', el: Element): void;
  (type: 'after-leave', el: Element): void;
}>();

const formItemContext = inject(formItemContextKey, undefined);
if (formItemContext) {
  // disallow auto-id from inside popper content
  provide(formItemContextKey, {
    ...formItemContext,
    addInputId: noop,
    removeInputId: noop,
  });
}

const trapped = ref(false);
const ariaHidden = ref(true);
const shouldRender = computed(() => (props.persistent ? true : props.visible) || !ariaHidden.value);

const focusTrapRef = ref<ComponentPublicInstance>();
const referenceElRef = computed(() => props.referenceEl);
const popperElRef = computed(() => focusTrapRef.value?.$el as HTMLElement | null);
const arrowElRef = ref<HTMLElement | null>(null);

const popper = usePopper(referenceElRef, popperElRef, computed(() => {
  const arrowEl = arrowElRef.value;
  const popperOptions = props.popperOptions || {};
  const userModifiers = popperOptions.modifiers || [];

  const modifiers = [
    { name: 'offset', options: { offset: [0, props.offset ?? 12] } },
    { name: 'preventOverflow', options: { padding: { top: 0, bottom: 0, left: 0, right: 0 } } },
    { name: 'flip', options: { padding: 5, fallbackPlacements: props.fallbackPlacements } },
    { name: 'computeStyles', options: { gpuAcceleration: props.gpuAcceleration } },
    // Seems like the `phase` and `fn` is required by Modifier type
    // But on its documentation they didn't specify that.
    // Refer to https://popper.js.org/docs/v2/modifiers/arrow/
    { name: 'arrow', enabled: isDefined(arrowEl), options: { element: arrowEl, padding: props.arrowOffset ?? 0 } } as any,
    { name: 'eventListeners', enabled: !!props.visible },
    ...userModifiers,
  ];

  return {
    placement: props.placement,
    strategy: props.strategy,
    onFirstUpdate: () => popper.update(),
    ...popperOptions,
    modifiers,
  };
}));

const popperStyle = computed(() => popper.styles.value as Record<string, CSSProperties | undefined>);

const { nextZIndex } = useZIndex();
const contentZIndex = ref(isNumber(props.zIndex) ? props.zIndex : nextZIndex());

// Vue2 忽略值为 `false` 的属性
const contentAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(popper.attributes.value.popper || {})
      .filter(([key, value]) => isDefined(value))
      .map(([key, value]) => [key, value.toString()]),
  ),
);

const transitionName = computed(() => props.transition || `el-fade-in-linear`);
const transitionHooks = {
  'before-enter': (el: Element) => {
    updatePopper();
    emit('before-enter', el);
  },
  'after-enter': (el: Element) => {
    emit('after-enter', el);
  },
  'before-leave': (el: Element) => {
    emit('before-leave', el);
  },
  'after-leave': (el: Element) => {
    emit('after-leave', el);
    isFocusInside() && focusElement(document.body, { preventScroll: true });
    ariaHidden.value = true;
  },
};

onMounted(() => {
  watch(
    () => props.visible,
    (visible) => {
      updatePopper(false);

      if (visible) {
        ariaHidden.value = false;
        if (props.focusOnShow) {
          trapped.value = true;
        }
      } else {
        trapped.value = false;
      }
    },
    { immediate: true },
  );
});

function updatePopper(shouldUpdateZIndex = true) {
  popper.update();

  if (shouldUpdateZIndex) {
    contentZIndex.value = isNumber(props.zIndex) ? props.zIndex : nextZIndex();
  }
}

function isFocusInside(event?: FocusEvent) {
  const activeElement = (event?.relatedTarget as Node) || document.activeElement;
  return Boolean(popperElRef.value?.contains(activeElement));
}

defineExpose({
  instance: popper.instanceRef,
  updatePopper,
  isFocusInside,
});
</script>
