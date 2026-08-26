import { nextTick, ref } from 'vue';

interface UseCompositionOptions {
  afterComposition: (event: CompositionEvent) => void;
  emit?:
    ((type: 'compositionstart', event: CompositionEvent) => void) &
    ((type: 'compositionupdate', event: CompositionEvent) => void) &
    ((type: 'compositionend', event: CompositionEvent) => void);
}

export function useComposition({ afterComposition, emit }: UseCompositionOptions) {
  const isComposing = ref(false);

  const handleCompositionStart = (event: CompositionEvent) => {
    emit?.('compositionstart', event);
    isComposing.value = true;
  };

  const handleCompositionUpdate = (event: CompositionEvent) => {
    emit?.('compositionupdate', event);
    isComposing.value = true;
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    emit?.('compositionend', event);
    if (isComposing.value) {
      isComposing.value = false;
      nextTick(() => afterComposition(event));
    }
  };

  const handleComposition = (event: CompositionEvent) => {
    event.type === 'compositionend'
      ? handleCompositionEnd(event)
      : handleCompositionUpdate(event);
  };

  return {
    isComposing,
    handleComposition,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
  };
}
