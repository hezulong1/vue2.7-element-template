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
