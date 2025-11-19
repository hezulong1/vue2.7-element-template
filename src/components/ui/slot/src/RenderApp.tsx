import type { PropType } from 'vue';

import Vue, { defineComponent, getCurrentInstance, onBeforeUnmount, onMounted, onUnmounted, onUpdated } from 'vue';
import * as domUtils from '@/utils/dom';
import ElOnlyChild from './OnlyChild';

export default defineComponent({
  name: 'ElRenderApp',
  abstract: true,
  props: {
    to: {
      type: [String, HTMLElement] as PropType<string | HTMLElement>,
      required: true,
    },
    autoUpdate: Boolean,
    onChange: Function as PropType<VoidFunction>,
  },
  setup(props, { slots, expose }) {
    let teleported = false;

    const vm = getCurrentInstance()?.proxy;
    // 传入 vm 用来确保 provide/inject 正常工作
    const app = createApp(vm!, props.onChange);

    const mount = () => {
      if (!vm) return;

      if (!teleported) {
        let container = typeof props.to === 'string' ? document.querySelector(props.to) : props.to;

        if (!container) {
          container = document.body;
        }

        container.appendChild(app.$el);
        teleported = true;
      }
    };

    const unmount = () => {
      if (!vm) return;
      if (!teleported) return;

      domUtils.remove(app.$el);
      teleported = false;
    };

    const update = () => {
      if (!vm) return;
      app.setNode(slots.app?.());
    };

    onMounted(() => {
      mount();

      if (props.autoUpdate) {
        update();
      }
    });

    onUpdated(() => {
      if (props.autoUpdate) {
        update();
      }
    });

    onBeforeUnmount(() => {
      unmount();
    });

    onUnmounted(() => {
      app.$destroy();
    });

    expose({
      update,
    });

    return () => (
      <ElOnlyChild>
        { slots.default?.() }
      </ElOnlyChild>
    );
  },
});

function createApp(root: Vue, onChange?: VoidFunction) {
  const app = new Vue({
    parent: root,
    data() {
      return {
        node: null,
      };
    },
    mounted() {
      this.update();
    },
    updated() {
      this.update();
    },
    methods: {
      update() {
        this.$nextTick(() => {
          onChange?.();
        });
      },
      setNode(node: any) {
        this.node = node;
      },
    },
    render() {
      return this.node;
    },
  }).$mount();

  return app;
}
