<script setup lang="ts">
import { Expand, Fold } from 'element-icons';
import { useLayout } from '@/stores/layout';

const { toggleSidebar, sidebarCollapsed } = useLayout();
</script>

<template>
  <button :data-status="sidebarCollapsed.toString()" @click="() => toggleSidebar()">
    <span v-show="sidebarCollapsed" class="el-icon"><Expand /></span>
    <span v-show="!sidebarCollapsed" class="el-icon"><Fold /></span>
  </button>
</template>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/styles/vars';

button {
  appearance: none;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  font-size: 16px;

  &:hover {
    background-color: rgba(0,0,0,.03);
  }

  &:active {
    background-color: rgba(0,0,0,.15);
  }

  &:focus-visible {
    outline: 2px solid map.get(vars.$el-colors, 'primary', 'light-5');
    outline-offset: 1px;
  }

  svg {
    font-size: 1em;
  }
}
</style>
