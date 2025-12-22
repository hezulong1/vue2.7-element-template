import { computedEager } from '@vueuse/core';

const enum Bracket {
  LEFT = '\u00AB',
  RIGHT = '\u00BB',
}

let i = 0;

export function useId(prefix = 'el') {
  return computedEager(() => Bracket.LEFT + `${prefix}-${++i}` + Bracket.RIGHT);
}
