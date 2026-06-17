import type { Arrayable } from '@vueuse/core';
import type { TooltipRootContext } from './typings';
import { createContext } from '@/composables/create-context';

export const [provideTooltipRoot, useTooltipRoot] = createContext<TooltipRootContext>('tooltipRoot');

export function isTriggerType<T>(trigger: Arrayable<T>, type: T) {
  return Array.isArray(trigger) ? trigger.includes(type) : trigger === type;
}
