import type { MaybeRef } from '@vueuse/core';
import { computedEager, toValue } from '@vueuse/core';

let count = 0;

const enum Bracket {
  LEFT = '\u00AB',
  RIGHT = '\u00BB',
}

export function useId(deterministicId?: MaybeRef<string | number | null | undefined>, prefix = 'el') {
  prefix = prefix.replace(Bracket.LEFT, '').replace(Bracket.RIGHT, '');
  const fallbackId = Bracket.LEFT + `${prefix}-${++count}` + Bracket.RIGHT;
  // TODO: 也许还需要考虑下 SSR
  return computedEager(() => toValue(deterministicId)?.toString() ?? fallbackId);
}
