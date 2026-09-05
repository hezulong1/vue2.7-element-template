<template>
  <span
    :class="containerKls"
    :style="{ backgroundColor: color }"
    @click="handleClick"
  >
    <span class="el-tag__content">
      <slot />
    </span>
    <button
      v-if="closable"
      class="el-tag__close"
      aria-label="Close this tag"
      type="button"
      @click.stop="handleClose"
    >
      <span class="el-icon">
        <Close />
      </span>
    </button>
  </span>
</template>

<script lang="ts" setup>
import type { TagEffect, TagType } from './utils';
import { computed, type PropType } from 'vue';
import { Close } from 'element-icons';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { useFormSize } from '../../form';

defineOptions({ name: 'ElTag' });

const props = defineProps({
  /**
   * @description type of Tag
   */
  type: {
    type: String as PropType<TagType>,
    default: 'primary',
  },
  /**
   * @description whether Tag can be removed
   */
  closable: Boolean,
  /**
   * @description whether Tag has a highlighted border
   */
  hit: Boolean,
  /**
   * @description background color of the Tag
   */
  color: String,
  /**
   * @description size of Tag
   */
  size: useSizeProp,
  /**
   * @description theme of Tag
   */
  effect: {
    type: String as PropType<TagEffect>,
    validator: (val: TagEffect) => ['dark', 'light', 'plain'].indexOf(val) !== -1,
    default: 'light',
  },
  /**
   * @description whether Tag is rounded
   */
  round: Boolean,
});

const emit = defineEmits<{
  (e: 'close', event: MouseEvent): void;
  (e: 'click', event: MouseEvent): void;
}>();

const tagSize = useFormSize();
// const { t } = useLocale(); // t('el.tag.close')

const containerKls = computed(() => {
  const cls = [
    'el-tag',
    `el-tag--${ props.type || 'primary' }`,
    `el-tag--${ props.effect }`,
  ];

  if (tagSize.value) cls.push(`el-tag--${ tagSize.value }`);
  if (props.closable) cls.push('is-closable');
  if (props.round) cls.push('is-round');
  if (props.hit && props.effect !== 'dark') cls.push('is-hit');

  return cls;
});

function handleClose(event: MouseEvent) {
  emit('close', event);
}

function handleClick(event: MouseEvent) {
  emit('click', event);
}
</script>
