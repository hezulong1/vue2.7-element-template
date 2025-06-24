<template>
  <el-flex :class="{ 'el-pro-layout': true, 'el-pro-layout--has-sidebar': hasSidebar, 'el-pro-layout--sidebar-collapsed': sidebarCollapsed }">
    <div v-if="hasSidebar" :style="sidebarPlaceholderStyle" />
    <aside v-if="hasSidebar" :style="sidebarStyle">
      <el-flex class="el-pro-sidebar-content" vertical />
    </aside>

    <el-flex class="el-pro-layout-grid" vertical>
      <div :style="[titlebarStyle, { backgroundColor: 'transparent' }]" />
      <el-flex tag="header" class="el-pro-titlebar" :style="titlebarStyle">titlebar</el-flex>
      <el-flex tag="main" class="el-pro-layout-grid-content" vertical>
        <transition name="page" mode="out-in">
          <router-view />
        </transition>
      </el-flex>
    </el-flex>
  </el-flex>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref } from 'vue';

const hasSidebar = ref(true);
const sidebarCollapsed = ref(false);
const sidebarWidth = computed(() => sidebarCollapsed.value ? 64 : 256);
const titlebarHeight = ref(56);

const sidebarStyle = computed(() => {
  const width = sidebarWidth.value + 'px';
  const top = titlebarHeight.value + 'px';
  return {
    position: 'fixed',
    top,
    left: '0px',
    width,
    height: `calc(100% - ${top})`,
    maxWidth: width,
    minWidth: width,
    flex: `0 0 ${width}`,
    transition: '0.2s, background',
  } as CSSProperties;
});

const sidebarPlaceholderStyle = computed(() => {
  const width = sidebarWidth.value + 'px';
  return {
    width,
    maxWidth: width,
    minWidth: width,
    flex: `0 0 ${width}`,
    overflow: 'hidden',
    transition: '0.2s',
  } as CSSProperties;
});

const titlebarStyle = computed(() => {
  const height = titlebarHeight.value + 'px';
  return {
    height,
    lineHeight: height,
  } as CSSProperties;
});
</script>

<style lang="scss">
@import '@/styles/vars.scss';

.el-pro-layout {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}

.el-pro-layout-grid {
  position: relative;
  width: 100%;
}

.el-pro-layout-grid-content {
  width: 100%;
  padding: 24px;
}

.el-pro-sidebar-content {
  padding-right: 8px;
  padding-left: 8px;
  border-right: 1px solid rgba(5,5,5,.06);
  height: 100%;
}

.el-pro-titlebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 48px;
  color: rgba(0,0,0,.85);
  border-bottom: 1px solid rgba(5,5,5,.06);
  background-color: rgba(255,255,255,.6);
  backdrop-filter: blur(10px);
  transition: background-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.3s;
}
.page-enter-from,
.page-leave-to {
  filter: blur(1rem);
  opacity: 0;
}

.slide-leave-active,
.slide-enter-active {
  transition: all 0.3s;
}
.slide-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>
