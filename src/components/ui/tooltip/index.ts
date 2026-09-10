export { default as Tooltip } from './src/Tooltip.vue';
export { default as TooltipTrigger } from './src/TooltipTrigger.vue';
export { default as TooltipContent } from './src/TooltipContent.vue';
export { default as TooltipContentImpl } from './src/TooltipContentImpl.vue';

export * from './src/TooltipRoot';
export {
  TOOLTIP_ROOT_CONTEXT_KEY,
  isTriggerType,
} from './src/utils';

export {
  tooltipTriggerProps,
  tooltipContentProps,
  tooltipProps,
  tooltipEmit,

  type TooltipTriggerProps,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipEmit,
} from './src/props';

export type {
  TooltipEffect,
  TooltipRoleType,
  TooltipTriggerType,
  TooltipContentInstance,
  TooltipInstance,
} from './src/typings';
