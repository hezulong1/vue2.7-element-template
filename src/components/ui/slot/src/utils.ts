import type { ObjectDirective, VNodeDirective } from 'vue';
import { createContext } from '@/composables/create-context';

export type ForwardRefSetter = (el: Element | null) => void;

export const [provideForwardRefSetter, useForwardRefSetter] = createContext<ForwardRefSetter>('forwardRefSetter');

export function createDirective(setForwardRef: ForwardRefSetter, name = 'forward-ref') {
  const def: ObjectDirective<Element> = {
    inserted(el) {
      setForwardRef(el);
    },
    componentUpdated(el) {
      setForwardRef(el);
    },
    unbind() {
      setForwardRef(null);
    },
  };

  return { name, def } as VNodeDirective;
}
