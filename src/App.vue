<template>
  <ConfigProvider locale="zh-CN">
    <div id="app" data-initialized :style="appStyle">
      <router-view />
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';
import ConfigProvider from '@/components/base/ConfigProvider';

const { width, height } = useWindowSize();
const appStyle = computed(
  () => Number.isFinite(width.value) && Number.isFinite(height.value)
    ? { width: width.value + 'px', height: height.value + 'px' }
    : undefined,
);
</script>
