import type { ForwardRefSetter } from './typings';
import { createContext } from '@/composables/create-context';

export const [provideForwardRefSetter, useForwardRefSetter] = createContext<ForwardRefSetter>('forwardRefSetter');
