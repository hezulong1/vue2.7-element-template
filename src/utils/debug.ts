import { noop } from '@vueuse/core';

let _warn: (msg: string) => void = noop;

if (import.meta.env.DEV) {
  if (typeof console !== 'undefined') {
    _warn = (msg: string) => console.warn(`[Pro warn]:`, msg);
  }
}

export const warn = _warn;
