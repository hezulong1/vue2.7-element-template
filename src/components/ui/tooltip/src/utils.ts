import type { Arrayable } from '@vueuse/core';
import type { TooltipRootContext } from './typings';
import type { InjectionKey } from 'vue';

export const TOOLTIP_ROOT_CONTEXT_KEY: InjectionKey<TooltipRootContext> = Symbol('tooltipRootContext');

export function isTriggerType<T>(trigger: Arrayable<T>, type: T) {
  return Array.isArray(trigger) ? trigger.includes(type) : trigger === type;
}
