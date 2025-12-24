import type { TooltipRootContext } from './typings';
import { createContext } from '@/composables/create-context';

export const [provideTooltipRoot, useTooltipRoot] = createContext<TooltipRootContext>('tooltipRoot');
