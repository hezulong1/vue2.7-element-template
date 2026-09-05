<template>
  <span :class="avatarClass" :style="sizeStyle">
    <img
      v-if="(src || srcSet) && !hasLoadError"
      :src="src"
      :alt="alt"
      :srcset="srcSet"
      :style="fitStyle"
      @error="handleError"
    >
    <span v-else-if="icon" class="el-icon">
      <component :is="icon" />
    </span>
    <slot v-else />
  </span>
</template>

<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue';
import type { AvatarShape, AvatarSize } from './utils';

import { computed, inject, ref, watch } from 'vue';
import { isNumber } from '@/utils/types';
import { addUnit } from '@/utils/dom';
import { iconPropType } from '@/utils/vue/icon';
import { avatarGroupContextKey } from './utils';

defineOptions({ name: 'ElAvatar' });

const props = defineProps({
  /**
   * @description avatar size.
   */
  size: [Number, String] as PropType<AvatarSize>,
  /**
   * @description avatar shape.
   */
  shape: {
    type: String as PropType<AvatarShape>,
    validator: (val: string) => ['circle', 'square'].includes(val),
  },
  /**
   * @description representation type to icon, more info on icon component.
   */
  icon: iconPropType,
  /**
   * @description the source of the image for an image avatar.
   */
  src: {
    type: String,
    default: '',
  },
  /**
   * @description native attribute `alt` of image avatar.
   */
  alt: String,
  /**
   * @description native attribute srcset of image avatar.
   */
  srcSet: String,
  /**
   * @description set how the image fit its container for an image avatar.
   */
  fit: {
    type: String as PropType<CSSProperties['objectFit']>,
    default: 'cover',
  },
});

const emit = defineEmits<{
  (type: 'error', e: Event): void;
}>();

const avatarGroupContext = inject(avatarGroupContextKey, undefined);

const hasLoadError = ref(false);

const size = computed(() => props.size ?? avatarGroupContext?.size);
const shape = computed(() => props.shape ?? avatarGroupContext?.shape ?? 'circle');

const avatarClass = computed(() => {
  const classList = ['el-avatar'];
  if (typeof size.value === 'string') classList.push(`el-avatar--${ size.value }`);
  if (props.icon) classList.push('el-avatar--icon');
  if (shape.value) classList.push(`el-avatar--${ shape.value }`);
  return classList;
});

const sizeStyle = computed(() => {
  if (!isNumber(size.value)) return;
  const sizePx = addUnit(size.value);
  return { width: sizePx, height: sizePx };
});

const fitStyle = computed<CSSProperties>(() => ({
  objectFit: props.fit,
}));

// need reset hasLoadError to false if src changed
watch(
  () => [props.src, props.srcSet],
  () => (hasLoadError.value = false),
);

function handleError(e: Event) {
  hasLoadError.value = true;
  emit('error', e);
}
</script>
