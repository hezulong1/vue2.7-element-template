export { default as Tooltip } from './src/Tooltip.vue';
export { default as TooltipTrigger } from './src/Trigger.vue';
export { default as TooltipContent } from './src/Content.vue';

export * from './src/TooltipRoot';
export {
  useTooltipRoot,
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
