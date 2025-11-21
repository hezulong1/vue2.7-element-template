<template>
  <div
    ref="contentRef"
    v-bind="contentAttrs"
    :style="contentStyle"
    :class="contentClass"
    tabindex="-1"
    @mouseenter="(e) => $emit('mouseenter', e)"
    @mouseleave="(e) => $emit('mouseleave', e)"
  >
    <ElFocusTrap :active="trapped">
      <slot />
    </ElFocusTrap>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties, WatchStopHandle } from 'vue';

import { computed, inject, onBeforeUnmount, onMounted, provide, ref, unref, watch } from 'vue';
import { noop } from '@vueuse/core';
import { isElement } from '@/utils/dom';
import { isNumber, isUndefinedOrNull } from '@/utils/types';
import { usePopper } from '@/composables/use-popper';
import { useZIndex } from '@/composables/use-z-index';
import { formItemContextKey } from '../../form';
import { FocusTrap as ElFocusTrap } from '../../focus-trap';
import { popperContentProps } from './props';
import { usePopperRoot, providePopperContent } from './composables';

defineOptions({
  name: 'ElPopperContent',
});

defineEmits(['mouseenter', 'mouseleave']);

const props = defineProps(popperContentProps);

// ElementPlus: usePopperContent
// ----------------------------------------

const popperRoot = usePopperRoot();
if (!popperRoot) {
  throw new ReferenceError('[popper-content] requires a PopperRoot provider.');
}

const { contentRef, role } = popperRoot;

const trapped = ref(false);
const arrowRef = ref<HTMLElement | null>(null);
const referenceRef = computed(() => props.referenceEl || popperRoot.triggerRef.value);

const popper = usePopper(referenceRef, contentRef, computed(() => {
  const arrowEl = arrowRef.value;
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
    { name: 'arrow', enabled: typeof arrowEl !== 'undefined', options: { element: arrowEl, padding: props.arrowOffset ?? 0 } } as any,
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

watch(
  popper.instanceRef,
  (instance) => {
    popperRoot.popperInstanceRef.value = instance;
  },
  {
    flush: 'sync',
  },
);

onMounted(() => {
  watch(
    () => referenceRef.value?.getBoundingClientRect?.(),
    () => {
      popper.update();
    },
  );
});

// ElementPlus: usePopperContentDOM
// ----------------------------------------

const { nextZIndex } = useZIndex();
const contentZIndex = ref(isNumber(props.zIndex) ? props.zIndex : nextZIndex());

const contentAttrs = computed(() => popper.attributes.value.popper);
const contentClass = computed(() => {
  const classNames = ['el-popper'];

  if (props.pure) classNames.push('el-popper--pure');
  if (props.effect) classNames.push(`el-popper--${props.effect}`);
  if (props.popperClass) classNames.push(props.popperClass);

  return classNames;
});
const contentStyle = computed(() => [
  { zIndex: contentZIndex.value },
  popper.styles.value.popper,
  (props.popperStyle || {}),
] as CSSProperties[]);
const ariaModal = computed<string | undefined>(() => role.value === 'dialog' ? 'false' : undefined);

const formItemContext = inject(formItemContextKey, undefined);

providePopperContent({
  arrowStyle: computed(() => (popper.styles.value.arrow || {}) as CSSProperties),
  arrowRef,
});

if (formItemContext) {
  // disallow auto-id from inside popper content
  provide(formItemContextKey, {
    ...formItemContext,
    addInputId: noop,
    removeInputId: noop,
  });
}

let triggerTargetAriaStopWatch: WatchStopHandle | undefined;

const updatePopper = (shouldUpdateZIndex = true) => {
  popper.update();

  if (shouldUpdateZIndex) {
    contentZIndex.value = isNumber(props.zIndex) ? props.zIndex : nextZIndex();
  }
};

const togglePopperAlive = () => {
  updatePopper(false);
  if (props.visible && props.focusOnShow) {
    trapped.value = true;
  } else if (props.visible === false) {
    trapped.value = false;
  }
};

onMounted(() => {
  watch(
    () => props.triggerTargetEl,
    (triggerTargetEl, prevTriggerTargetEl) => {
      triggerTargetAriaStopWatch?.();
      triggerTargetAriaStopWatch = undefined;

      const el = unref(triggerTargetEl || contentRef.value);
      const prevEl = unref(prevTriggerTargetEl || contentRef.value);

      if (isElement(el)) {
        triggerTargetAriaStopWatch = watch(
          [role, () => props.ariaLabel, ariaModal, () => props.id],
          (watches) => {
            ['role', 'aria-label', 'aria-modal', 'id'].forEach((key, idx) => {
              isUndefinedOrNull(watches[idx])
                ? el.removeAttribute(key)
                : el.setAttribute(key, watches[idx]!);
            });
          },
          { immediate: true },
        );
      }
      if (prevEl !== el && isElement(prevEl)) {
        ['role', 'aria-label', 'aria-modal', 'id'].forEach((key) => {
          prevEl.removeAttribute(key);
        });
      }
    },
    { immediate: true },
  );

  watch(() => props.visible, togglePopperAlive, { immediate: true });
});

onBeforeUnmount(() => {
  triggerTargetAriaStopWatch?.();
  triggerTargetAriaStopWatch = undefined;
});

defineExpose({
  popperContentRef: contentRef,
  popperInstanceRef: popper.instanceRef,
  updatePopper,
  contentStyle,
});
</script>
