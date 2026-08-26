<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { RouterLink } from 'vue-router';
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
    <RouterLink to="/" active-class="" exact-active-class="">
      <img src="/element-logo-small.svg">
      <transition name="fade">
        <span v-show="renderText">Admin</span>
      </transition>
    </RouterLink>
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

  img {
    position: absolute;
    top: 50%;
    transform: translate(-32px, calc(-50% + 3px));
  }

  .el-pro-layout--sidebar-collapsed & img {
    left: 50%;
    transform: translate(calc(-50% + 3px), calc(-50% + 3px));
  }
}
</style>
