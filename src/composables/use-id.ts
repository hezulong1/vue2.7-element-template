import type { MaybeRef } from '@vueuse/core';
import { computedEager, toValue } from '@vueuse/core';

const enum Bracket {
  LEFT = '\u00AB',
  RIGHT = '\u00BB',
}

export interface CreateUseIdOptions {
  max?: number;
}

export function createUseId(opts: CreateUseIdOptions = {}) {
  const maximum = opts.max || Number.MAX_SAFE_INTEGER;

  let count = 0;

  const reset = () => {
    count = 0;
  };

  const useId = (deterministicId?: MaybeRef<string | number | null | undefined>, prefix = 'el') => {
    prefix = prefix.replace(Bracket.LEFT, '').replace(Bracket.RIGHT, '');

    if (count >= maximum) {
      console.warn('[use-id]', `The maximum number of ids has been reached: ${count}.`);
    }

    const fallbackId = Bracket.LEFT + `${prefix}-${++count}` + Bracket.RIGHT;
    // TODO: 也许还需要考虑下 SSR
    return computedEager(() => toValue(deterministicId)?.toString() ?? fallbackId);
  };

  return {
    useId,
    reset,
  };
}

export const { useId } = createUseId();
