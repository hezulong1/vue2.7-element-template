import type { ScrollbarContext } from './typings';
import { createContext } from '@/composables/create-context';

export const [provideScrollbar, useScrollbar] = createContext<ScrollbarContext>('scrollbar');
