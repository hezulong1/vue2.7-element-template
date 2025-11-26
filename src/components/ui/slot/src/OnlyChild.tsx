import type { ExtraProps } from '@/utils/vdom';

import { defineComponent } from 'vue';
import { cloneVNode, filterEmptyVNode } from '@/utils/vdom';
import { warn } from '@/utils/debug';
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

      // TODO: 为了提示语使用 filterEmptyVNode，值不值？
      const vnodes = filterEmptyVNode(slots.default());
      const firstLegitNode = vnodes[0];

      if (!firstLegitNode) {
        warn('<el-only-child> no valid child node found.');
        return null;
      }

      if (vnodes.length > 1) {
        warn('<el-only-child> requires exact only one valid child.');
      }

      const extraProps: ExtraProps = {};
      if (directives) extraProps.directives = directives;
      if (Object.keys(listeners).length > 0) extraProps.on = { ...listeners };
      if (Object.keys(attrs).length > 0) extraProps.attrs = { ...attrs };

      const isSvgOrText = firstLegitNode.tag === 'svg' || (firstLegitNode.tag == null && firstLegitNode.text);
      // 指令无法作用在文本节点
      const vnode = isSvgOrText ? <span class="el-only-child">{firstLegitNode}</span> : firstLegitNode;
      const cloned = cloneVNode(vnode, extraProps);

      return cloned;
    };
  },
});
