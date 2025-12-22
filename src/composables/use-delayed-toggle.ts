import { computed } from 'vue';
import { toValue, tryOnScopeDispose, type MaybeRefOrGetter } from '@vueuse/core';
import { createTimeoutTimer } from '@/utils/async';

export interface UseDelayedToggleOptions {
  onOpen: (event?: Event) => void;
  onClose: (event?: Event) => void;
  openDelay?: MaybeRefOrGetter<number | undefined>;
  closeDelay?: MaybeRefOrGetter<number | undefined>;
  autoCloseDelay?: MaybeRefOrGetter<number | undefined>;
}

export function useDelayedToggle(opts: UseDelayedToggleOptions) {
  const openDelay = computed(() => toValue(opts.openDelay) ?? 0);
  const closeDelay = computed(() => toValue(opts.closeDelay) ?? 0);
  const autoCloseDelay = computed(() => toValue(opts.autoCloseDelay) ?? 0);

  const autoCloseTimeout = createTimeoutTimer();
  const openOrCloseTimeout = createTimeoutTimer();

  const open = (event?: Event, timeout = openDelay.value) => {
    openOrCloseTimeout.cancelAndSet(() => {
      opts.onOpen(event);

      const { value: autoClose } = autoCloseDelay;
      if (autoClose > 0) {
        autoCloseTimeout.cancelAndSet(() => {
          opts.onClose(event);
        }, autoClose);
      }
    }, timeout);
  };

  const close = (event?: Event, timeout = closeDelay.value) => {
    autoCloseTimeout.cancel();
    openOrCloseTimeout.cancelAndSet(() => {
      opts.onClose(event);
    }, timeout);
  };

  tryOnScopeDispose(() => {
    autoCloseTimeout.cancel();
    openOrCloseTimeout.cancel();
  });

  return { open, close };
}
