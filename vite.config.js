import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue2';
import VueJsx from '@vitejs/plugin-vue2-jsx';
import VueLegacy from '@vitejs/plugin-legacy';
import VueDefineOptions from 'unplugin-vue-define-options/vite';
import autoprefixer from 'autoprefixer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const postcssPlugins = [_postcss_plugin_local()];
  if (!isDev) {
    postcssPlugins.push(autoprefixer({}));
  }
  return {
    base: isDev ? '/' : './',
    plugins: [
      Vue(),
      VueJsx(),
      VueDefineOptions(),
      VueLegacy({
        targets: '>0.3%, Chrome>=58, IE>=10',
      }),
    ],
    resolve: {
      alias: [
        { find: '@/', replacement: `${path.join(__dirname, 'src')}/` },
      ],
    },
    build: {
      emptyOutDir: true,
      cssTarget: 'chrome58',
      minify: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            } else if (id.includes('element-ui')) {
              return 'element-ui';
            }
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          charset: false,
          api: 'modern-compiler',
        },
      },
      postcss: {
        plugins: postcssPlugins,
      },
    },
  };
});

function _postcss_plugin_local() {
  return {
    postcssPlugin: '_postcss_plugin_local',
    AtRule: {
      charset(atRule) {
        atRule.name === 'charset' && atRule.remove();
      },
    },
  };
}
