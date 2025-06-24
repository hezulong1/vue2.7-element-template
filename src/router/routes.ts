import type { RouteConfig } from 'vue-router';

import LayoutHome from '@/layouts/home.vue';

export const staticRoutes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    redirect: { path: '/dashboard', replace: true },
  },
  {
    path: '/dashboard',
    component: LayoutHome,
    children: [
      {
        name: 'Dashboard',
        path: '',
        component: () => import('@/views/dashboard/index.vue'),
      },
    ],
  },
];
