import type { ObjectDirective, VNodeDirective } from 'vue';
import type { ForwardRefSetter } from './typings';

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
