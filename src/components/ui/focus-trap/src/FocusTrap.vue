<template>
  <div class="el-focus-trap">
    <div
      ref="focusableStartRef"
      :tabindex="active ? '0' : '-1'"
      style="position: absolute; height: 0; width: 0;"
      @focus="handleStartFocus"
    />
    <slot />
    <div
      ref="focusableEndRef"
      :tabindex="active ? '0' : '-1'"
      style="position: absolute; height: 0; width: 0;"
      @focus="handleEndFocus"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { isUndefined } from '@/utils/types';
import { isElement, isHTMLElement } from '@/utils/dom';
import { useId } from '@/composables/use-id';

import { focusFirstDescendant, focusLastDescendant, resolveTo } from './utils';

let stack: string[] = [];

export default defineComponent({
  name: 'ElFocusTrap',
  props: {
    disabled: Boolean,
    active: Boolean,
    initialFocusTo: String,
    finalFocusTo: String,
    autoFocus: {
      type: Boolean,
      default: true,
    },
    returnFocusOnDeactivated: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['escape'],
  setup(props, { emit }) {
    const id = useId();
    const focusableStartRef = ref<HTMLElement>();
    const focusableEndRef = ref<HTMLElement>();

    let activated = false;
    let ignoreInternalFocusChange = false;
    const lastFocusedElement: Element | null = typeof document === 'undefined' ? null : document.activeElement;

    function isCurrentActive(): boolean {
      const currentActiveId = stack[stack.length - 1];
      return currentActiveId === id.value;
    }

    function handleDocumentKeydown(e: KeyboardEvent): void {
      if (e.code === 'Escape') {
        if (isCurrentActive()) {
          emit('escape', e);
        }
      }
    }

    onMounted(() => {
      watch(
        () => props.active,
        (value) => {
          if (value) {
            activate();
            document.addEventListener('keydown', handleDocumentKeydown, false);
          } else {
            document.removeEventListener('keydown', handleDocumentKeydown, false);
            if (activated) {
              deactivate();
            }
          }
        },
        {
          immediate: true,
        },
      );
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleDocumentKeydown, false);
      if (activated) deactivate();
    });

    function getPreciseEventTarget(event: Event): EventTarget | null {
      if (event.composedPath) {
        return event.composedPath()[0] || null;
      } else {
        return event.target || null;
      }
    }

    function handleDocumentFocus(e: FocusEvent): void {
      if (ignoreInternalFocusChange) return;
      if (isCurrentActive()) {
        const mainEl = getMainEl();
        if (mainEl == null) return;
        if (mainEl.contains(getPreciseEventTarget(e) as Node | null)) return;
        // I don't handle shift + tab status since it's too tricky to handle
        // Not impossible but I need to sleep
        resetFocusTo('first');
      }
    }

    function getMainEl(): ChildNode | null {
      const focusableStartEl = focusableStartRef.value;
      if (isUndefined(focusableStartEl)) return null;

      let mainEl: ChildNode | null = focusableStartEl;

      while (true) {
        mainEl = mainEl.nextSibling;
        if (!mainEl || (isElement(mainEl) && mainEl.tagName === 'DIV')) break;
      }

      return mainEl;
    }

    function activate(): void {
      if (props.disabled) return;

      stack.push(id.value);
      if (props.autoFocus) {
        const { initialFocusTo } = props;
        if (isUndefined(initialFocusTo)) {
          resetFocusTo('first');
        } else {
          resolveTo(initialFocusTo)?.focus({ preventScroll: true });
        }
      }

      activated = true;
      document.addEventListener('focus', handleDocumentFocus, true);
    }

    function deactivate(): void {
      if (props.disabled) return;

      document.removeEventListener('focus', handleDocumentFocus, true);
      stack = stack.filter(idInStack => idInStack !== id.value);

      if (isCurrentActive()) return;
      const { finalFocusTo } = props;
      if (typeof finalFocusTo !== 'undefined') {
        resolveTo(finalFocusTo)?.focus({ preventScroll: true });
      } else if (props.returnFocusOnDeactivated && isHTMLElement(lastFocusedElement)) {
        ignoreInternalFocusChange = true;
        lastFocusedElement.focus({ preventScroll: true });
        ignoreInternalFocusChange = false;
      }
    }

    function resetFocusTo(target: 'last' | 'first'): void {
      if (!isCurrentActive()) return;
      if (props.active) {
        const focusableStartEl = focusableStartRef.value;
        const focusableEndEl = focusableEndRef.value;
        if (focusableStartEl && focusableEndEl) {
          const mainEl = getMainEl();
          if (!mainEl || mainEl === focusableEndEl) {
            ignoreInternalFocusChange = true;
            focusableStartEl.focus({ preventScroll: true });
            ignoreInternalFocusChange = false;
            return;
          }
          ignoreInternalFocusChange = true;

          const focused = target === 'first' ? focusFirstDescendant(mainEl) : focusLastDescendant(mainEl);

          ignoreInternalFocusChange = false;
          if (!focused) {
            ignoreInternalFocusChange = true;
            focusableStartEl.focus({ preventScroll: true });
            ignoreInternalFocusChange = false;
          }
        }
      }
    }

    function handleStartFocus(e: FocusEvent): void {
      if (ignoreInternalFocusChange) return;

      const mainEl = getMainEl();
      if (!mainEl) return;

      if (isElement(e.relatedTarget) && mainEl.contains(e.relatedTarget)) {
        // if it comes from inner, focus last
        resetFocusTo('last');
      } else {
        // otherwise focus first
        resetFocusTo('first');
      }
    }

    function handleEndFocus(e: FocusEvent): void {
      if (ignoreInternalFocusChange) return;
      if (!e.relatedTarget && e.relatedTarget === focusableStartRef.value) {
        // if it comes from first, focus last
        resetFocusTo('last');
      } else {
        // otherwise focus first
        resetFocusTo('first');
      }
    }

    return {
      focusableStartRef,
      focusableEndRef,
      focusableStyle: 'position: absolute; height: 0; width: 0;',
      handleStartFocus,
      handleEndFocus,
    };
  },
});
</script>
