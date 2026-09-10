import { onBeforeUnmount, onMounted } from 'vue';
import { isClient } from '@vueuse/core';
import { EVENT_CODE, getEventCode } from '@/utils/event';

let registeredEscapeHandlers: ((e: KeyboardEvent) => void)[] = [];

const cachedHandler = (event: KeyboardEvent) => {
  const code = getEventCode(event);
  if (code === EVENT_CODE.esc) {
    registeredEscapeHandlers.forEach(registeredHandler =>
      registeredHandler(event),
    );
  }
};

export function useEscapeKeydown(handler: (e: KeyboardEvent) => void) {
  onMounted(() => {
    if (registeredEscapeHandlers.length === 0) {
      document.addEventListener('keydown', cachedHandler);
    }
    if (isClient) registeredEscapeHandlers.push(handler);
  });

  onBeforeUnmount(() => {
    registeredEscapeHandlers = registeredEscapeHandlers.filter(
      registeredHandler => registeredHandler !== handler,
    );
    if (registeredEscapeHandlers.length === 0) {
      if (isClient) document.removeEventListener('keydown', cachedHandler);
    }
  });
}
