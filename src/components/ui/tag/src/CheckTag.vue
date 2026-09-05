<template>
  <span :class="containerKls" @click="handleChange">
    <slot />
  </span>
</template>

<script lang="ts" setup>
import type { TagType } from './utils';
import { computed, type PropType } from 'vue';

defineOptions({ name: 'ElCheckTag' });

const props = defineProps({
  /**
   * @description type of CheckTag
   */
  type: {
    type: String as PropType<TagType>,
    default: 'primary',
  },
  /**
   * @description whether the check-tag is checked, can use the `.sync` modifier for two-way binding
   */
  checked: Boolean,
  /**
   * @description whether the check-tag is disabled
   */
  disabled: Boolean,
});
const emit = defineEmits<{
  (type: 'update:checked', checked: boolean): void;
  (type: 'change', checked: boolean): void;
}>();

const containerKls = computed(() => {
  const cls = ['el-check-tag', 'el-tag', `el-check-tag--${ props.type || 'primary' }`];

  if (props.checked) cls.push('is-checked');
  if (props.disabled) cls.push('is-disabled');

  return cls;
});

function handleChange() {
  if (props.disabled) return;

  const checked = !props.checked;
  emit('change', checked);
  emit('update:checked', checked);
}
</script>
