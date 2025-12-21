import type { ComponentPublicInstance } from 'vue';
import type { Instance } from '@popperjs/core';

export interface PopperInstance extends ComponentPublicInstance {
  instance: Readonly<Instance | null>;
  updatePopper: (shouldUpdateZIndex?: boolean) => void;
  isFocusInside: (event?: FocusEvent) => boolean;
}
