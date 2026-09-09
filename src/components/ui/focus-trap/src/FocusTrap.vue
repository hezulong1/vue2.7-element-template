<template>
  <component :is="tag" ref="selfRef" class="el-focus-trap">
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance, PropType } from 'vue';
import { computed, ref, toRef } from 'vue';
import { unrefElement } from '@vueuse/core';
import { useFocusTrap } from './utils';

defineOptions({ name: 'ElFocusTrap' });

const props = defineProps({
  tag: {
    type: String as PropType<keyof HTMLElementTagNameMap>,
    default: 'div',
  },
  loop: Boolean,
  trapped: Boolean,
  focusTrapEl: {
    type: [Element, String, Object] as PropType<'self' | Element | ComponentPublicInstance>,
    default: 'self',
  },
  focusStartEl: {
    type: [Element, String, Object] as PropType<'first' | 'container' | Element | ComponentPublicInstance>,
    default: 'first',
  },
});

const emit = defineEmits<{
  (type: 'focus-after-trapped', e: Event): void;
  (type: 'focus-after-released', e: Event): void;
  (type: 'focusin', e: FocusEvent): void;
  (type: 'focusout', e: FocusEvent): void;
  (type: 'focusout-prevented', e: CustomEvent): void;
  (type: 'release-requested', e: Event): void;
}>();

const _unrefElement = (el: Element | ComponentPublicInstance | null | undefined) => unrefElement(el as any);

const selfRef = ref<HTMLElement>();

useFocusTrap({
  loop: toRef(props, 'loop'),
  trapped: toRef(props, 'trapped'),
  focusTrapEl: computed(() => {
    const el = props.focusTrapEl;
    if (!el) return;
    if (el === 'self') return selfRef.value;
    return _unrefElement(el);
  }),
  focusStartEl: computed(() => {
    const el = props.focusStartEl;
    if (!el) return;
    if (typeof el === 'string') return el;
    return _unrefElement(el);
  }),
  onFocusAfterTrapped(e) {
    emit('focus-after-trapped', e);
  },
  onFocusAfterReleased(e) {
    emit('focus-after-released', e);
  },
  onFocusin(e) {
    emit('focusin', e);
  },
  onFocusout(e) {
    emit('focusout', e);
  },
  onFocusoutPrevented(e) {
    emit('focusout-prevented', e);
  },
  onReleaseRequested(e) {
    emit('release-requested', e);
  },
});
</script>
