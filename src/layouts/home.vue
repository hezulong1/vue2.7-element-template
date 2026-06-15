<template>
  <el-flex full :class="{ 'el-pro-layout': true, 'el-pro-layout--sidebar-rendered': sidebarRendered, 'el-pro-layout--sidebar-collapsed': sidebarCollapsed }">
    <div v-if="sidebarRendered" :style="sidebarPlaceholderStyle" />
    <aside v-if="sidebarRendered" class="el-pro-layout__sidebar" :style="sidebarStyle">
      <el-scrollbar view-class="el-pro-layout__sidebar-content">
        TheMenu
      </el-scrollbar>
    </aside>

    <el-flex class="el-pro-layout__grid" vertical full="width">
      <div :style="[titlebarStyle, { backgroundColor: 'transparent' }]" />
      <el-flex tag="header" class="el-pro-layout__titlebar" :style="titlebarStyle">TheLogo</el-flex>
      <el-flex tag="main" class="el-pro-layout__grid-content" vertical full="width">
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

const sidebarRendered = ref(true);
const sidebarCollapsed = ref(false);
const sidebarWidth = computed(() => sidebarCollapsed.value ? 64 : 256);
const titlebarHeight = ref(56);

const sidebarStyle = computed(() => {
  const width = sidebarWidth.value + 'px';
  const top = titlebarHeight.value + 'px';
  return {
    width,
    maxWidth: width,
    minWidth: width,
    flex: `0 0 ${ width }`,
    top,
    height: `calc(100% - ${ top })`,
    transition: '0.2s, background 0s',
  } as CSSProperties;
});

const sidebarPlaceholderStyle = computed(() => {
  const width = sidebarWidth.value + 'px';
  return {
    width,
    maxWidth: width,
    minWidth: width,
    flex: `0 0 ${ width }`,
    overflow: 'hidden',
    transition: '0.2s',
  } as CSSProperties;
});

const titlebarStyle = computed(() => {
  const height = titlebarHeight.value + 'px';
  return {
    height,
    maxHeight: height,
    minHeight: height,
    flex: `0 0 ${ height }`,
    lineHeight: height,
  } as CSSProperties;
});
</script>

<style lang="scss">
@import '@/styles/vars.scss';

.el-pro-layout {
  position: relative;
  background-color: #f5f5f5;

  // Grid

  &__grid {
    position: relative;
    overflow: auto;
  }

  &__grid-content {
    padding: 24px;
  }

  // Titlebar

  &__titlebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    padding: 0 48px;
    color: rgba(0,0,0,.85);
    border-bottom: 1px solid rgba(5,5,5,.06);
    background-color: rgba(255,255,255,.6);
    backdrop-filter: blur(10px);
    transition: background-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  }

  // Sidebar

  &__sidebar {
    position: fixed;
    left: 0;
    z-index: 99;
    border-right: 1px solid rgba(5,5,5,.06);
  }

  &__sidebar-content {
    // 右侧 1px 的 border
    padding-right: 7px;
    padding-left: 8px;
  }
}

// Animation

.page {
  &-enter-active,
  &-leave-active {
    transition: all 0.3s;
  }

  &-enter-from,
  &-leave-to {
    filter: blur(1rem);
    opacity: 0;
  }
}

.slide {
  &-leave-active,
  &-enter-active {
    transition: all 0.3s;
  }

  &-enter-from {
    transform: translateX(-30px);
    opacity: 0;
  }

  &-leave-to {
    transform: translateX(30px);
    opacity: 0;
  }
}
</style>
