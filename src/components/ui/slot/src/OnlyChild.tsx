import { defineComponent } from 'vue';
import { cloneVNode, filterEmptyVNode } from '@/utils/vue/vnode';
import { useForwardRefSetter } from './composables';
import { createDirective } from './utils';

export default defineComponent({
  name: 'ElOnlyChild',
  inheritAttrs: false,
  setup(props, context) {
    const setForwardRef = useForwardRefSetter();
    const directives = setForwardRef ? [createDirective(setForwardRef)] : undefined;

    return () => {
      const { slots, attrs, listeners } = context;
      if (!slots.default) return null;

      const vnodes = filterEmptyVNode(slots.default());
      const firstLegitNode = vnodes[0];

      if (!firstLegitNode) {
        console.warn('[only-child]', 'no valid child node found.');
        return null;
      }

      if (vnodes.length > 1) {
        console.warn('[only-child]', 'requires exact only one valid child.');
      }

      const on = Object.keys(listeners).length > 0 ? listeners : undefined;
      const isSvgOrText = firstLegitNode.tag === 'svg' || (firstLegitNode.tag == null && firstLegitNode.text);

      // 确保是 HTML 元素，不然指令会失效
      const vnode = isSvgOrText ? <span class="el-only-child">{firstLegitNode}</span> : firstLegitNode;
      const cloned = cloneVNode(vnode, { attrs, on, directives });

      return cloned;
    };
  },
});
