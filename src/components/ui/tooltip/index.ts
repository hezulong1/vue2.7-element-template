export { default as Tooltip } from './src/Tooltip.vue';
export { default as TooltipTrigger } from './src/Trigger.vue';
export { default as TooltipContent } from './src/Content.vue';

export * from './src/TooltipRoot';
export * from './src/utils';
export { useTooltipRoot } from './src/composables';
export { tooltipProps } from './src/props';

export type {
  TooltipEffect,
  TooltipRoleType,
  TooltipTriggerType,
  TooltipContentInstance,
  TooltipInstance,
} from './src/typings';
