import type { ObjectDirective, VNodeDirective } from 'vue';
import type { ForwardRefSetter } from './composables';

export function createDirective<T = Element>(setForwardRef: ForwardRefSetter<T>, name = 'forward-ref') {
  const def: ObjectDirective<T> = {
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
