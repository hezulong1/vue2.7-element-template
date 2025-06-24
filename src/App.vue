<template>
  <ConfigProvider locale="zh-CN">
    <div id="app" data-initialized>
      <router-view />
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
import ConfigProvider from '@/components/base/ConfigProvider';
</script>
