import type { CSSProperties } from 'vue';
import { ref, shallowRef } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { MINIMUM_INPUT_WIDTH } from './utils';

export function useCalcInputWidth() {
  const calculatorRef = ref<HTMLElement>();
  const inputStyle = shallowRef<CSSProperties>({ minWidth: `${ MINIMUM_INPUT_WIDTH }px` });

  const resetCalculatorWidth = () => {
    if (!calculatorRef.value) return;
    inputStyle.value = {
      minWidth: `${ Math.max(calculatorRef.value.scrollWidth, MINIMUM_INPUT_WIDTH) }px`,
    };
  };

  useResizeObserver(calculatorRef, resetCalculatorWidth);

  return {
    calculatorRef,
    inputStyle,
  };
}
