import type { PopperRootContext, PopperContentContext } from './typings';
import { createContext } from '@/composables/create-context';

export const [providePopperRoot, usePopperRoot] = createContext<PopperRootContext>('popperRoot');
export const [providePopperContent, usePopperContent] = createContext<PopperContentContext>('popperContent');
