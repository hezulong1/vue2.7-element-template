// Github: https://github.com/lixl39505/teleport-vue2
// Blog: https://juejin.cn/post/7363579190971482162

// 1. 修复无法兼容 Vue.mixin 的问题
// 2. 多个节点时, 只取第一个有效节点([Vue warn]: Multiple root nodes returned from render function. Render function should return a single root node.)

import type { PropType } from 'vue';
import { defineComponent, getCurrentInstance, onMounted, onUnmounted, onUpdated } from 'vue';
import * as domUtils from '@/utils/dom';
import { getFirstLegitVNode } from '@/utils/vdom';

interface InternalState {
  teleported: boolean;
  lastTo: string | HTMLElement;
  parentEl: Node | null | undefined; // 兼容 $vnode.elm 和 element.insertBefore 类型
  rootEl: Node | undefined; // 兼容 $vnode.elm
  dumbEl: Node;
}

export default defineComponent({
  name: 'ElTeleport',
  abstract: true,
  props: {
    to: {
      type: [String, HTMLElement] as PropType<string | HTMLElement>,
      required: true,
    },
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const state: InternalState = {
      teleported: false,
      lastTo: '',
      parentEl: null,
      rootEl: undefined,
      dumbEl: document.createComment(' el-teleport '),
    };

    const vm = getCurrentInstance()?.proxy;

    const restore = () => {
      if (!vm) return;
      if (!state.teleported) return;

      vm.$vnode.elm = state.rootEl;
      state.teleported = false;
      state.lastTo = '';

      if (!state.parentEl) return;
      state.rootEl && state.parentEl.insertBefore(state.rootEl, state.dumbEl);
      domUtils.remove(state.dumbEl);
    };

    const teleport = () => {
      if (!vm) return;
      if (!state.rootEl || !state.parentEl) return;
      if (!state.teleported) state.parentEl.insertBefore(state.dumbEl, state.rootEl);

      vm.$vnode.elm = state.dumbEl;
      state.teleported = true;

      let targetEl;
      if (props.to !== state.lastTo) targetEl = typeof props.to === 'string' ? document.querySelector(props.to) : props.to;
      if (!targetEl) return;
      targetEl.appendChild(state.rootEl);
      state.lastTo = props.to;
    };

    const onEnter = () => {
      // @ts-expect-error 调用私有属性
      state.rootEl = vm._vnode.elm;
      state.parentEl = state.teleported ? state.dumbEl?.parentNode : state.rootEl?.parentNode;
      props.disabled ? restore() : teleport();
    };

    onMounted(() => {
      onEnter();
    });

    onUpdated(() => {
      onEnter(); // 除了 to、disabled 外，rootEl 以及 originalEl 也可能发生变化
    });

    onUnmounted(() => {
      domUtils.remove(state.dumbEl, state.rootEl);
      state.rootEl = undefined;
      state.parentEl = null;
    });

    return () => getFirstLegitVNode(slots.default?.());
  },
});
