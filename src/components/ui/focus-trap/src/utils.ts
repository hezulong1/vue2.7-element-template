import type { InjectionKey, Ref } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';

import { ref, provide, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue';
import { toValue } from '@vueuse/core';
import { useEscapeKeydown } from '@/composables/use-escape-keydown';
import * as domUtils from '@/utils/dom';
import { getEventCode, EVENT_CODE } from '@/utils/event';
import { focusElement } from '@/utils/aria';

export interface FocusTrapContext {
  focusTrapRef: Ref<HTMLElement | undefined>;
  onKeydown: (e: KeyboardEvent) => void;
}
export const FOCUS_TRAP_CONTEXT_KEY: InjectionKey<FocusTrapContext> = Symbol('focusTrapContext');

export const FOCUS_AFTER_TRAPPED = 'focus-trap.focus-after-trapped';
export const FOCUS_AFTER_RELEASED = 'focus-trap.focus-after-released';
export const FOCUSOUT_PREVENTED = 'focus-trap.focusout-prevented';

const FOCUS_AFTER_TRAPPED_OPTS: EventInit = {
  cancelable: true,
  bubbles: false,
};

const lastUserFocusTimestamp = ref<number>(0);
const lastAutomatedFocusTimestamp = ref<number>(0);
const isFocusCausedByUserEvent = () => lastUserFocusTimestamp.value > lastAutomatedFocusTimestamp.value;

interface FocusLayer {
  paused: boolean;
  pause: () => void;
  resume: () => void;
}

type FocusStack = FocusLayer[];
const focusableStack = createFocusableStack();

export interface UseFocusTrapProps {
  loop?: MaybeRefOrGetter<boolean | undefined>;
  trapped?: MaybeRefOrGetter<boolean | undefined>;
  focusTrapEl?: MaybeRefOrGetter<HTMLElement | undefined>;
  /**
   * @default 'first'
   */
  focusStartEl?: MaybeRefOrGetter<'container' | 'first' | HTMLElement | undefined>;

  onFocusAfterTrapped?: (e: Event) => void;
  onFocusAfterReleased?: (e: Event) => void;
  onFocusin?: (e: FocusEvent) => void;
  onFocusout?: (e: FocusEvent) => void;
  onFocusoutPrevented?: (e: CustomEvent) => void;
  onReleaseRequested?: (e: Event) => void;
}

export function useFocusTrap(opts: UseFocusTrapProps = {}) {
  const loopRef = computed(() => toValue(opts.loop) ?? false);
  const trappedRef = computed(() => toValue(opts.trapped) ?? false);
  const focusTrapElRef = computed(() => toValue(opts.focusTrapEl));
  const focusStartElRef = computed(() => toValue(opts.focusStartEl) ?? 'first');

  let lastFocusBeforeTrapped: HTMLElement | null = null;
  let lastFocusAfterTrapped: HTMLElement | null = null;

  const { focusReason } = useFocusReason();
  const forwardRef = ref<HTMLElement | undefined>();

  const focusLayer = new class implements FocusLayer {
    private _paused = false;
    public get paused() {
      return this._paused;
    }
    public pause() {
      this._paused = true;
    }
    public resume() {
      this._paused = false;
    }
  }();

  useEscapeKeydown((event) => {
    if (trappedRef.value && !focusLayer.paused) {
      opts.onReleaseRequested?.(event);
    }
  });

  const doFocusoutPrevented = (defaultPrevent?: VoidFunction) => {
    const event = new CustomEvent(FOCUSOUT_PREVENTED, {
      cancelable: true,
      bubbles: false,
      detail: { focusReason: focusReason.value },
    });

    opts.onFocusoutPrevented?.(event);

    if (!event.defaultPrevented) defaultPrevent?.();
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (!loopRef.value && !trappedRef.value) return;
    if (focusLayer.paused) return;

    const { currentTarget, shiftKey } = e;

    const code = getEventCode(e);
    const isTabbing = code === EVENT_CODE.tab && !e.altKey && !e.ctrlKey && !e.metaKey;
    const currentFocusingEl = <HTMLElement>document.activeElement;

    if (!isTabbing || !currentFocusingEl) return;
    if (!domUtils.isHTMLElement(currentTarget)) return;

    const container = currentTarget;
    const [first, last] = getEdges(container);

    if (first && last) {
      if (/* 定位到最后一个元素 */ !shiftKey && currentFocusingEl === last) {
        doFocusoutPrevented(() => {
          e.preventDefault();
          if (loopRef.value) tryFocus(first, true);
        });
      } else if (/* 定位到第一个元素 */ shiftKey && [first, container].includes(currentFocusingEl)) {
        doFocusoutPrevented(() => {
          e.preventDefault();
          if (loopRef.value) tryFocus(last, true);
        });
      }
    } else {
      if (currentFocusingEl === container) {
        doFocusoutPrevented(() => {
          e.preventDefault();
        });
      }
    }
  };

  provide(FOCUS_TRAP_CONTEXT_KEY, {
    focusTrapRef: forwardRef,
    onKeydown,
  });

  watch(focusTrapElRef, (focusTrapEl) => {
    if (focusTrapEl) {
      forwardRef.value = focusTrapEl;
    }
  }, { immediate: true });

  watch([forwardRef], ([forwardRef], [oldForwardRef]) => {
    if (forwardRef) {
      forwardRef.addEventListener('keydown', onKeydown);
      forwardRef.addEventListener('focusin', onFocusIn);
      forwardRef.addEventListener('focusout', onFocusOut);
    }
    if (oldForwardRef) {
      oldForwardRef.removeEventListener('keydown', onKeydown);
      oldForwardRef.removeEventListener('focusin', onFocusIn);
      oldForwardRef.removeEventListener('focusout', onFocusOut);
    }
  });

  function onFocusIn(e: FocusEvent) {
    const trapContainer = forwardRef.value;
    if (!trapContainer) return;

    const target = e.target as HTMLElement | null;
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const isFocusedInTrap = trapContainer.contains(target);

    if (!trappedRef.value) {
      const isPrevFocusedInTrap = relatedTarget && trapContainer.contains(relatedTarget);
      if (!isPrevFocusedInTrap) {
        lastFocusBeforeTrapped = relatedTarget;
      }
    }

    if (isFocusedInTrap) opts.onFocusin?.(e);
    if (focusLayer.paused) return;

    if (trappedRef.value) {
      if (isFocusedInTrap) {
        lastFocusAfterTrapped = target;
      } else {
        tryFocus(lastFocusAfterTrapped, true);
      }
    }
  }

  function onFocusOut(e: FocusEvent) {
    const trapContainer = forwardRef.value;
    if (focusLayer.paused || !trapContainer) return;

    if (trappedRef.value) {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget != null && !trapContainer.contains(relatedTarget)) {
        // Give embedded focus layer time to pause this layer before reclaiming focus
        // And only reclaim focus if it should currently be trapping
        setTimeout(() => {
          if (!focusLayer.paused && trappedRef.value) {
            doFocusoutPrevented(() => {
              tryFocus(lastFocusAfterTrapped, true);
            });
          }
        }, 0);
      }
    } else {
      const target = e.target as HTMLElement | null;
      const isFocusedInTrap = target && trapContainer.contains(target);
      if (!isFocusedInTrap) opts.onFocusout?.(e);
    }
  }

  const trapOnFocus = (e: Event) => opts.onFocusAfterTrapped?.(e);
  const releaseOnFocus = (e: Event) => opts.onFocusAfterReleased?.(e);

  function startTrap() {
    // Wait for forwardRef to resolve
    nextTick(() => {
      const trapContainer = forwardRef.value;
      if (!trapContainer) return;

      focusableStack.push(focusLayer);

      const prevFocusedElement = trapContainer.contains(document.activeElement) ? lastFocusBeforeTrapped : <HTMLElement | null>document.activeElement;
      lastFocusBeforeTrapped = prevFocusedElement;

      if (!trapContainer.contains(prevFocusedElement)) {
        const focusEvent = new CustomEvent(FOCUS_AFTER_TRAPPED, FOCUS_AFTER_TRAPPED_OPTS);

        trapContainer.addEventListener(FOCUS_AFTER_TRAPPED, trapOnFocus);
        trapContainer.dispatchEvent(focusEvent);

        if (!focusEvent.defaultPrevented) {
          nextTick(() => {
            let { value: focusStartEl } = focusStartElRef;

            if (typeof focusStartEl !== 'string') {
              tryFocus(focusStartEl);
              if (document.activeElement !== focusStartEl) {
                focusStartEl = 'first';
              }
            }

            if (focusStartEl === 'first') {
              focusFirstDescendant(
                obtainAllFocusableElements(trapContainer),
                true,
              );
            }

            if (document.activeElement === prevFocusedElement || focusStartEl === 'container') {
              tryFocus(trapContainer);
            }
          });
        }
      }
    });
  }

  function stopTrap() {
    const trapContainer = forwardRef.value;
    if (!trapContainer) return;

    trapContainer.removeEventListener(FOCUS_AFTER_TRAPPED, trapOnFocus);

    const releasedEvent = new CustomEvent(FOCUS_AFTER_RELEASED, {
      ...FOCUS_AFTER_TRAPPED_OPTS,
      detail: {
        focusReason: focusReason.value,
      },
    });

    trapContainer.addEventListener(FOCUS_AFTER_RELEASED, releaseOnFocus);
    trapContainer.dispatchEvent(releasedEvent);
    if (!releasedEvent.defaultPrevented) {
      if (focusReason.value === 'keyboard' || !isFocusCausedByUserEvent() || trapContainer.contains(document.activeElement)) {
        tryFocus(lastFocusBeforeTrapped ?? document.body);
      }
    }

    trapContainer.removeEventListener(FOCUS_AFTER_RELEASED, releaseOnFocus);
    focusableStack.remove(focusLayer);
    lastFocusBeforeTrapped = null;
    lastFocusAfterTrapped = null;
  }

  onMounted(() => {
    if (trappedRef.value) startTrap();
    watch(trappedRef, trapped => trapped ? startTrap() : stopTrap());
  });

  onBeforeUnmount(() => {
    if (trappedRef.value) stopTrap();

    if (forwardRef.value) {
      forwardRef.value.removeEventListener('keydown', onKeydown);
      forwardRef.value.removeEventListener('focusin', onFocusIn);
      forwardRef.value.removeEventListener('focusout', onFocusOut);
      forwardRef.value = undefined;
    }

    lastFocusBeforeTrapped = null;
    lastFocusAfterTrapped = null;
  });

  return { onKeydown };
}

// Stack
// ----------------------------------------

function removeFromStack<T>(list: T[], item: T) {
  const copy = [...list];
  const idx = list.indexOf(item);
  if (idx !== -1) copy.splice(idx, 1);
  return copy;
}

function createFocusableStack() {
  let stack = [] as FocusStack;

  const push = (layer: FocusLayer) => {
    const currentLayer = stack[0];

    if (currentLayer && layer !== currentLayer) currentLayer.pause();

    stack = removeFromStack(stack, layer);
    stack.unshift(layer);
  };

  const remove = (layer: FocusLayer) => {
    stack = removeFromStack(stack, layer);
    stack[0]?.resume?.();
  };

  return {
    push,
    remove,
  };
}

// Helper
// ----------------------------------------

function focusFirstDescendant(elements: HTMLElement[], shouldSelect = false) {
  const prevFocusedElement = document.activeElement;
  for (const element of elements) {
    tryFocus(element, shouldSelect);
    if (document.activeElement !== prevFocusedElement) return;
  }
}

// TODO 重复
function obtainAllFocusableElements(element: HTMLElement): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (
      node: Element & {
        disabled: boolean;
        hidden: boolean;
        type: string;
        tabIndex: number;
      },
    ) => {
      const isHiddenInput = node.tagName === 'INPUT' && node.type === 'hidden';
      if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
      return node.tabIndex >= 0 || node === document.activeElement
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });
  while (walker.nextNode()) nodes.push(walker.currentNode as HTMLElement);

  return nodes;
}

declare const process: { env: Record<string, any> };

// TODO 重复 (isVisible)
function isHidden(element: HTMLElement, container: HTMLElement) {
  if (process.env.NODE_ENV === 'test') return false;
  if (getComputedStyle(element).visibility === 'hidden') return true;

  while (element) {
    if (container && element === container) return false;
    if (getComputedStyle(element).display === 'none') return true;
    element = element.parentElement as HTMLElement;
  }

  return false;
}

function getVisibleElement(elements: HTMLElement[], container: HTMLElement) {
  for (const element of elements) {
    if (!isHidden(element, container)) return element;
  }
}

function getEdges(container: HTMLElement) {
  const focusable = obtainAllFocusableElements(container);
  const first = getVisibleElement(focusable, container);
  const last = getVisibleElement(focusable.reverse(), container);
  return [first, last];
}

const isSelectable = (element: any): element is HTMLInputElement & { select: () => void } =>
  element instanceof HTMLInputElement && 'select' in element;

function tryFocus(element?: HTMLElement | { focus: () => void } | null, shouldSelect?: boolean) {
  if (!element) return;

  const prevFocusedElement = document.activeElement;

  focusElement(element, { preventScroll: true });
  lastAutomatedFocusTimestamp.value = window.performance.now();

  if (element !== prevFocusedElement && isSelectable(element) && shouldSelect) {
    element.select();
  }
}

// FocusReason
// ----------------------------------------

let focusReasonUserCount = 0;

const focusReason = ref<'pointer' | 'keyboard'>();

const notifyFocusReasonPointer = () => {
  focusReason.value = 'pointer';
  lastUserFocusTimestamp.value = window.performance.now();
};

const notifyFocusReasonKeydown = () => {
  focusReason.value = 'keyboard';
  lastUserFocusTimestamp.value = window.performance.now();
};

function useFocusReason() {
  onMounted(() => {
    if (focusReasonUserCount === 0) {
      document.addEventListener('mousedown', notifyFocusReasonPointer);
      document.addEventListener('touchstart', notifyFocusReasonPointer);
      document.addEventListener('keydown', notifyFocusReasonKeydown);
    }
    focusReasonUserCount++;
  });

  onBeforeUnmount(() => {
    focusReasonUserCount--;
    if (focusReasonUserCount <= 0) {
      document.removeEventListener('mousedown', notifyFocusReasonPointer);
      document.removeEventListener('touchstart', notifyFocusReasonPointer);
      document.removeEventListener('keydown', notifyFocusReasonKeydown);
    }
  });

  return {
    focusReason,
    lastUserFocusTimestamp,
    lastAutomatedFocusTimestamp,
  };
}
