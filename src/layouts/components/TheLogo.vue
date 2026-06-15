<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { useLayout, isMobile } from '@/stores/layout';
import { addUnit } from '@/utils/dom';

const layout = useLayout();

const renderText = computed(() => isMobile.value ? false : !layout.sidebarCollapsed.value);
const style = computed<CSSProperties>(() => {
  const width = addUnit(layout.sidebarWidth.value);
  return { width, height: '100%' };
});
</script>

<template>
  <el-flex class="el-pro-logo" center :style="style">
    <a href="/">
      <img src="/element-logo-small.svg">
      <transition name="fade">
        <span v-show="renderText">Admin</span>
      </transition>
    </a>
  </el-flex>
</template>

<style lang="scss">
.el-pro-logo {
  position: relative;
  font-size: 22px;
  font-weight: bold;
  user-select: none;
  cursor: pointer;
  transition: .2s;

  > a {
    color: inherit;
    text-decoration: none;
  }

  img {
    position: absolute;
    top: 50%;
    transform: translate(-32px, calc(-50% + 3px));
  }
}
</style>
