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
