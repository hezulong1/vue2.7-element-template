<template>
  <span
    ref="arrowRef"
    class="el-popper__arrow"
    :style="arrowStyle"
    data-popper-arrow
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { usePopperContent } from './composables';

defineOptions({
  name: 'ElPopperArrow',
  inheritAttrs: false,
});

const { arrowRef, arrowStyle } = usePopperContent()!;

onBeforeUnmount(() => {
  arrowRef.value = null;
});
</script>
