import type { Arrayable } from '@vueuse/core';

export function isTriggerType<T>(trigger: Arrayable<T>, type: T) {
  return Array.isArray(trigger) ? trigger.includes(type) : trigger === type;
}
