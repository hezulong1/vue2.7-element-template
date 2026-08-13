import type { ComponentInstance } from 'vue';
import type { RootTreeType } from './typings';
import { defineComponent, h, inject } from 'vue';
import { NODE_INSTANCE_INJECTION_KEY, ROOT_TREE_INJECTION_KEY } from './utils';

export default defineComponent({
  name: 'ElTreeNodeContent',
  props: {
    node: {
      type: Object,
      required: true,
    },
    renderContent: Function,
  },
  setup(props) {
    const nodeInstance = inject<{ proxy: ComponentInstance }>(NODE_INSTANCE_INJECTION_KEY);
    const tree = inject<RootTreeType>(ROOT_TREE_INJECTION_KEY)!;
    return () => {
      const node = props.node;
      const { data, store } = node;
      return props.renderContent
        ? props.renderContent(h, { _self: nodeInstance!.proxy, node, data, store })
        : tree.ctx.slots.default
          ? tree.ctx.slots.default({ node, data })
          : <span class="el-tree-node__label">{ node.label }</span>;
    };
  },
});
