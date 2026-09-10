/// <reference types="vite/client" />
/// <reference types="unplugin-vue-define-options/macros-global" />

interface ImportMetaEnv {
  VITE_DEFAULT_LANGUAGE: string;
  VITE_DEFAULT_THEME: 'auto' | 'light' | 'dark';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  var component: DefineComponent;
  export default component;
}

interface FocusOptions {
  /**
   * 控制是否在获得焦点时强制显示焦点指示器（如外边框）
   * | Chrome | Edge  | Safari | Firefox | Opera | IE |
   * | :----: | :--:  | :----: | :-----: | :---: | -  |
   * | >=145  | >=145 | >=18.4 | >=104   | >=131 |    |
   */
  focusVisible?: boolean;
}
