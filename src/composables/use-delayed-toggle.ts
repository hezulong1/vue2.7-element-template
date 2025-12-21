import { computed } from 'vue';
import { toValue, tryOnScopeDispose, type MaybeRefOrGetter } from '@vueuse/core';

export const useDelayedToggleProps = {
  /**
   * @description delay of appearance, in millisecond, not valid in controlled mode
   */
  showAfter: {
    type: Number,
    default: 0,
  },
  /**
   * @description delay of disappear, in millisecond, not valid in controlled mode
   */
  hideAfter: {
    type: Number,
    default: 200,
  },
  /**
   * @description disappear automatically, in millisecond, not valid in controlled mode
   */
  autoClose: {
    type: Number,
    default: 0,
  },
} as const;

export interface UseDelayedToggleOptions {
  open: (event?: Event) => void;
  close: (event?: Event) => void;
  showAfter?: MaybeRefOrGetter<number | undefined>;
  hideAfter?: MaybeRefOrGetter<number | undefined>;
  autoClose?: MaybeRefOrGetter<number | undefined>;
}

export function useDelayedToggle(opts: UseDelayedToggleOptions) {
  const showAfterRef = computed(() => toValue(opts.showAfter) ?? 0);
  const hideAfterRef = computed(() => toValue(opts.hideAfter) ?? 0);
  const autoCloseRef = computed(() => toValue(opts.autoClose) ?? 0);

  const autoCloseTimeout = createTimeoutTimer();
  const openOrCloseTimeout = createTimeoutTimer();

  const onOpen = (event?: Event, timeout = showAfterRef.value) => {
    openOrCloseTimeout.cancelAndSet(() => {
      opts.open(event);

      const { value: autoClose } = autoCloseRef;
      if (autoClose > 0) {
        autoCloseTimeout.cancelAndSet(() => {
          opts.close(event);
        }, autoClose);
      }
    }, timeout);
  };

  const onClose = (event?: Event, timeout = hideAfterRef.value) => {
    autoCloseTimeout.cancel();
    openOrCloseTimeout.cancelAndSet(() => {
      opts.close(event);
    }, timeout);
  };

  tryOnScopeDispose(() => {
    autoCloseTimeout.cancel();
    openOrCloseTimeout.cancel();
  });

  return { onOpen, onClose };
}

function createTimeoutTimer() {
  let token: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (token !== null) {
      clearTimeout(token);
      token = null;
    }
  };

  const cancelAndSet = (runner: () => void, timeout: number) => {
    cancel();
    token = setTimeout(() => {
      token = null;
      runner();
    }, timeout);
  };

  return { cancel, cancelAndSet };
}
