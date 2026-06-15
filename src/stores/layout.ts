import { computed, readonly, ref, type ComputedRef } from 'vue';
import { breakpointsElement, createGlobalState, useBreakpoints, useStorage } from '@vueuse/core';

export const TITLEBAR_DESKTOP_HEIGHT = 56;
export const SIDEBAR_DESKTOP_WIDTH = 256;
export const SIDEBAR_MOBILE_WIDTH = 54;

export const breakpoints = useBreakpoints(breakpointsElement);
// TODO: (Why) TS 返回值解析失败
export const isMobile = breakpoints.smaller(() => 'sm') as ComputedRef<boolean>;

export const useLayout = createGlobalState(() => {
  const hasSidebar = ref(true);
  const hasTitlebar = ref(true);
  const hasLogo = ref(true);

  const titlebarHeight = computed<number>(() => TITLEBAR_DESKTOP_HEIGHT);

  const sidebarCollapsed = useStorage('v2et-sidebar-collapsed', false);
  const sidebarWidth = computed<number>(() => sidebarCollapsed.value || isMobile.value ? SIDEBAR_MOBILE_WIDTH : SIDEBAR_DESKTOP_WIDTH);

  function toggleSidebar(value?: boolean) {
    if (typeof value !== 'undefined') {
      sidebarCollapsed.value = value;
    } else {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    }
  }

  return {
    hasSidebar: readonly(hasSidebar),
    hasTitlebar: readonly(hasTitlebar),
    hasLogo: readonly(hasLogo),
    titlebarHeight,
    sidebarCollapsed: readonly(sidebarCollapsed),
    sidebarWidth,
    toggleSidebar,
  };
});
