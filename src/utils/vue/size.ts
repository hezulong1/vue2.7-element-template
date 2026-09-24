import type { PropOptions, PropType } from 'vue';

const componentSizes = ['', 'small'] as const;
export type ComponentSize = typeof componentSizes[number];

export const componentSizePropType: PropOptions<ComponentSize> = {
  type: String as PropType<ComponentSize>,
  default: '',
  validator: (value: ComponentSize) => componentSizes.includes(value),
};
