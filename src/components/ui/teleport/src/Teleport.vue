<script lang="tsx">
// Github: https://github.com/lixl39505/teleport-vue2
// Blog: https://juejin.cn/post/7363579190971482162

// 1. 修复无法兼容 Vue.mixin 的问题
// 2. 新增校验插槽中是否只有一个根节点([Vue warn]: Multiple root nodes returned from render function. Render function should return a single root node.)

import type { PropType } from 'vue';
import { defineComponent, getCurrentInstance, onMounted, onUnmounted, onUpdated } from 'vue';
import { OnlyChild as ElOnlyChild } from '../../slot';

interface InternalStatus {
  teleported: boolean;
  lastTo: string | HTMLElement;
  originalEl: Node | null | undefined; // 合并 rootEl 和 dumbEl 类型
  rootEl: Node | undefined; // 兼容 $vnode.elm
  dumbEl: Node | null; // 兼容 element.insertBefore
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
  setup(props) {
    const status: InternalStatus = {
      teleported: false,
      lastTo: '',
      originalEl: null,
      rootEl: void 0,
      dumbEl: document.createComment(' el-teleport '),
    };

    const vm = getCurrentInstance()?.proxy;

    const restore = () => {
      if (!vm) return;
      if (!status.teleported) return;

      vm.$vnode.elm = status.rootEl;
      status.teleported = false;
      status.lastTo = '';
      if (!status.originalEl) return;
      status.rootEl && status.originalEl.insertBefore(status.rootEl, status.dumbEl);
      status.dumbEl?.parentNode?.removeChild(status.dumbEl);
    };

    const teleport = () => {
      if (!vm) return;
      if (!status.rootEl || !status.originalEl || !status.dumbEl) return;
      if (!status.teleported) status.originalEl.insertBefore(status.dumbEl, status.rootEl);

      vm.$vnode.elm = status.dumbEl;
      status.teleported = true;

      let targetEl;
      if (props.to !== status.lastTo) targetEl = typeof props.to === 'string' ? document.querySelector(props.to) : props.to;
      if (!targetEl) return;
      targetEl.appendChild(status.rootEl);
      status.lastTo = props.to;
    };

    const onEnter = () => {
      // @ts-expect-error 调用私有属性
      status.rootEl = vm._vnode.elm;
      status.originalEl = status.teleported ? status.dumbEl?.parentNode : status.rootEl?.parentNode;
      props.disabled ? restore() : teleport();
    };

    onMounted(() => {
      onEnter();
    });

    onUpdated(() => {
      onEnter(); // 除了 to、disabled 外，rootEl 以及 originalEl 也可能发生变化
    });

    onUnmounted(() => {
      status.dumbEl?.parentNode?.removeChild(status.dumbEl);
      status.rootEl?.parentNode?.removeChild(status.rootEl);
      status.rootEl = void 0;
      status.dumbEl = null;
    });

    return {};
  },
  render(h) {
    return <ElOnlyChild>{ this.$slots.default }</ElOnlyChild>;
  },
});
</script>
