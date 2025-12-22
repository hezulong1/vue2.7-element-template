import { defineComponent } from 'vue';
import { isNotEmptyObject } from '@/utils/types';
import { warn } from '@/utils/debug';
import { cloneVNode, getFirstLegitVNode, type ExtraProps } from '@/utils/vdom';
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

      const firstLegitNode = getFirstLegitVNode(slots.default());

      if (!firstLegitNode) {
        warn('<el-only-child> no valid child node found.');
        return null;
      }

      const extraProps: ExtraProps = {};
      if (directives) extraProps.directives = directives;
      if (isNotEmptyObject(listeners)) extraProps.on = { ...listeners };
      if (isNotEmptyObject(attrs)) extraProps.attrs = { ...attrs };

      const isSvgOrText = firstLegitNode.tag === 'svg' || (firstLegitNode.tag == null && firstLegitNode.text);
      // 指令无法作用在文本节点
      const vnode = isSvgOrText ? <span class="el-only-child">{firstLegitNode}</span> : firstLegitNode;
      const cloned = cloneVNode(vnode, extraProps);

      return cloned;
    };
  },
});
