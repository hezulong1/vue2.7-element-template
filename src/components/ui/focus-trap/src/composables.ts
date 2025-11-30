import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { isClient, toValue, type MaybeRefOrGetter, useEventListener } from '@vueuse/core';
import { createUseId } from '@/composables/use-id';
import { isElement, isHTMLElement } from '@/utils/dom';
import { isUndefined } from '@/utils/types';
import { resolveTo, focusFirstDescendant, focusLastDescendant } from './utils';

const { useId } = createUseId();
let stack: string[] = [];

interface InternalState {
  activated: boolean;
  ignoreInternalFocusChange: boolean;
}

export interface UseFocusTrapProps {
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  active?: MaybeRefOrGetter<boolean | undefined>;
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  returnFocusOnDeactivated?: MaybeRefOrGetter<boolean | undefined>;
  initialFocusTo?: MaybeRefOrGetter<string | undefined>;
  finalFocusTo?: MaybeRefOrGetter<string | undefined>;
  onEscape?: (e: KeyboardEvent) => void;
}

export function useFocusTrap(opts: UseFocusTrapProps = {}) {
  const activeRef = computed(() => toValue(opts.active));
  const autoFocusRef = computed(() => toValue(opts.autoFocus));
  const disabledRef = computed(() => toValue(opts.disabled));
  const returnFocusOnDeactivatedRef = computed(() => toValue(opts.returnFocusOnDeactivated));
  const initialFocusToRef = computed(() => toValue(opts.initialFocusTo));
  const finalFocusToRef = computed(() => toValue(opts.finalFocusTo));

  const id = useId(undefined, 'el-focus-trap');
  const startRef = ref<HTMLElement | null>();
  const endRef = ref<HTMLElement | null>();

  const state: InternalState = {
    activated: false,
    ignoreInternalFocusChange: false,
  };

  const lastFocusedElement: Element | null = isClient ? document.activeElement : null;

  function isCurrentActive(): boolean {
    const currentActiveId = stack[stack.length - 1];
    return currentActiveId === id.value;
  }

  function handleDocumentKeydown(e: KeyboardEvent): void {
    if (e.code === 'Escape') {
      if (isCurrentActive()) {
        opts.onEscape?.(e);
      }
    }
  }

  onMounted(() => {
    watch(
      activeRef,
      (value) => {
        if (value) {
          activate();
          document.addEventListener('keydown', handleDocumentKeydown, false);
        } else {
          document.removeEventListener('keydown', handleDocumentKeydown, false);
          if (state.activated) {
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
    if (state.activated) deactivate();
  });

  function getPreciseEventTarget(event: Event): EventTarget | null {
    if (event.composedPath) {
      return event.composedPath()[0] || null;
    } else {
      return event.target || null;
    }
  }

  function handleDocumentFocus(e: FocusEvent): void {
    if (state.ignoreInternalFocusChange) return;
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
    const focusableStartEl = startRef.value;
    if (focusableStartEl == null) return null;

    let mainEl: ChildNode | null = focusableStartEl;

    while (true) {
      mainEl = mainEl.nextSibling;
      if (!mainEl || (isElement(mainEl) && mainEl.tagName === 'DIV')) break;
    }

    return mainEl;
  }

  function activate(): void {
    if (disabledRef.value) return;

    stack.push(id.value);
    if (autoFocusRef.value) {
      if (isUndefined(initialFocusToRef.value)) {
        resetFocusTo('first');
      } else {
        resolveTo(initialFocusToRef.value)?.focus({ preventScroll: true });
      }
    }

    state.activated = true;
    document.addEventListener('focus', handleDocumentFocus, true);
  }

  function deactivate(): void {
    if (disabledRef.value) return;

    document.removeEventListener('focus', handleDocumentFocus, true);
    stack = stack.filter(idInStack => idInStack !== id.value);

    if (isCurrentActive()) return;
    const { value: finalFocusTo } = finalFocusToRef;
    if (typeof finalFocusTo !== 'undefined') {
      resolveTo(finalFocusTo)?.focus({ preventScroll: true });
    } else if (returnFocusOnDeactivatedRef.value && isHTMLElement(lastFocusedElement)) {
      state.ignoreInternalFocusChange = true;
      lastFocusedElement.focus({ preventScroll: true });
      state.ignoreInternalFocusChange = false;
    }
  }

  function resetFocusTo(target: 'last' | 'first'): void {
    if (!isCurrentActive()) return;
    if (!activeRef.value) return;

    const startEl = startRef.value;
    const endEl = endRef.value;

    if (startEl && endEl) {
      const mainEl = getMainEl();
      if (!mainEl || mainEl === endEl) {
        state.ignoreInternalFocusChange = true;
        startEl.focus({ preventScroll: true });
        state.ignoreInternalFocusChange = false;
        return;
      }
      state.ignoreInternalFocusChange = true;

      const focused = target === 'first' ? focusFirstDescendant(mainEl) : focusLastDescendant(mainEl);

      state.ignoreInternalFocusChange = false;
      if (!focused) {
        state.ignoreInternalFocusChange = true;
        startEl.focus({ preventScroll: true });
        state.ignoreInternalFocusChange = false;
      }
    }
  }

  useEventListener(startRef, 'focus', (e) => {
    if (state.ignoreInternalFocusChange) return;

    const mainEl = getMainEl();
    if (!mainEl) return;

    if (isElement(e.relatedTarget) && mainEl.contains(e.relatedTarget)) {
      // if it comes from inner, focus last
      resetFocusTo('last');
    } else {
      // otherwise focus first
      resetFocusTo('first');
    }
  });

  useEventListener(endRef, 'focus', (e) => {
    if (state.ignoreInternalFocusChange) return;
    if (!e.relatedTarget && e.relatedTarget === startRef.value) {
      // if it comes from first, focus last
      resetFocusTo('last');
    } else {
      // otherwise focus first
      resetFocusTo('first');
    }
  });

  return {
    startRef,
    endRef,
  };
}
