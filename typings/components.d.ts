import type {
  Component,
  DefineComponent,
  DefineAsyncComponent,
  KeepAliveProps,
  TransitionProps,
  TransitionGroupProps,
} from 'vue';

export {};

interface ComponentProps {
  is: string | DefineComponent | Component | DefineAsyncComponent;
  inlineTemplate: boolean;
}

declare module 'vue' {
  // 不清楚为何这么写不支持合并到 vue 模块中，在 router.d.ts 中就可以
  export type ClassValue = false | null | undefined | string | Record<string, any> | Array<ClassValue>;

  /**
   * 补充 vue 中提供的组件特性
   */
  export interface GlobalComponents {
    KeepAlive: DefineComponent<Partial<KeepAliveProps>>;
    Transition: DefineComponent<Partial<TransitionProps>>;
    TransitionGroup: DefineComponent<Partial<TransitionGroupProps>>;
    Component: DefineComponent<Partial<ComponentProps>>;
    Slot: DefineComponent<{
      /** 用于命名插槽 */
      name?: string;
    }>;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'transition': TransitionProps;
      'transition-group': TransitionGroupProps;
      'keep-alive': KeepAliveProps;
      'component': ComponentProps;
    }
  }
}
