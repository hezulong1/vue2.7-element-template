<template>
  <div class="el-focus-trap">
    <div
      ref="startRef"
      class="el-visually-hidden el-focus-trap__guard"
      :tabindex="tabindex"
      aria-hidden="true"
      data-focus-guard="start"
    />
    <slot />
    <div
      ref="endRef"
      class="el-visually-hidden el-focus-trap__guard"
      :tabindex="tabindex"
      aria-hidden="true"
      data-focus-guard="end"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useFocusTrap } from './composables';

defineOptions({
  name: 'ElFocusTrap',
});

const props = defineProps({
  disabled: Boolean,
  active: Boolean,
  initialFocusTo: String,
  finalFocusTo: String,
  autoFocus: {
    type: Boolean,
    default: true,
  },
  returnFocusOnDeactivated: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['escape']);

const tabindex = computed(() => props.active ? '0' : '-1');
const { startRef, endRef } = useFocusTrap({
  ...toRefs(props),
  onEscape(e) {
    emit('escape', e);
  },
});
</script>
