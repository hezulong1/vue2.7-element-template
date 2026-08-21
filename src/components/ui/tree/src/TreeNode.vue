<template>
  <div
    v-show="node.visible"
    ref="node$"
    :class="[
      'el-tree-node',
      {
        'is-expanded': expanded,
        'is-current': node.isCurrent,
        'is-hidden': !node.visible,
        'is-focusable': !node.disabled,
        'is-checked': !node.disabled && node.checked,
      },
      getNodeClass(node),
    ]"
    role="treeitem"
    tabindex="-1"
    :aria-expanded="expanded"
    :aria-disabled="node.disabled"
    :aria-checked="node.checked"
    :draggable="tree.props.draggable"
    :data-key="getNodeKey(node)"
    @click.stop="handleClick"
    @contextmenu="handleContextMenu"
    @dragstart.stop="handleDragStart"
    @dragover.stop="handleDragOver"
    @dragend.stop="handleDragEnd"
    @drop.stop="handleDrop"
  >
    <div
      class="el-tree-node__content"
      :style="{ paddingLeft: (node.level - 1) * tree.props.indent + 'px' }"
    >
      <ElIcon
        v-if="tree.props.icon || CaretRight"
        :class="[
          'el-tree-node__expand-icon',
          {
            'is-leaf': node.isLeaf,
            expanded: !node.isLeaf && expanded,
          },
        ]"
        @click.stop="handleExpandIconClick"
      >
        <component :is="tree.props.icon || CaretRight" />
      </ElIcon>
      <ElCheckbox
        v-if="showCheckbox"
        :checked="node.checked"
        :indeterminate="node.indeterminate"
        :disabled="!!node.disabled"
        @click.native.stop
        @change="handleCheckChange"
      />
      <ElIcon
        v-if="node.loading"
        class="el-tree-node__loading-icon"
        loading
      >
        <Loading />
      </ElIcon>
      <ElTreeNodeContent :node="node" :render-content="renderContent" />
    </div>
    <ElCollapseTransition>
      <div
        v-if="!renderAfterExpand || childNodeRendered"
        v-show="expanded"
        class="el-tree-node__children"
        role="group"
        :aria-expanded="expanded"
        @click.stop
      >
        <el-tree-node
          v-for="child in node.childNodes"
          :key="getNodeKey(child)"
          :render-content="renderContent"
          :render-after-expand="renderAfterExpand"
          :show-checkbox="showCheckbox"
          :node="child"
          :accordion="accordion"
          :props="props"
          @node-expand="handleChildNodeExpand"
        />
      </div>
    </ElCollapseTransition>
  </div>
</template>

<script lang="ts">
import type { ComponentInstance, PropType } from 'vue';
import type { RootTreeType, TreeNodeData, TreeOptionProps } from './typings';
import {
  defineComponent,
  getCurrentInstance,
  inject,
  nextTick,
  provide,
  ref,
  watch,
} from 'vue';
import { CaretRight, Loading } from 'element-icons';
import ElCollapseTransition from '@/components/base/CollapseTransition.vue';
import { isFunction } from '@/utils/types';
import { warn } from '@/utils/debug';
import { normalizeClass } from '@/utils/vue/vdom';
import { Checkbox as ElCheckbox } from '../../checkbox';
import { Icon as ElIcon } from '../../icon';
import ElTreeNodeContent from './TreeNodeContent';
import { getNodeKey as getNodeKeyUtil, handleCurrentChange } from './model/util';
import { useNodeExpandEventBroadcast } from './model/useNodeExpandEventBroadcast';
import { dragEventsKey } from './model/useDragNode';
import Node from './model/node';
import { NODE_INSTANCE_INJECTION_KEY, ROOT_TREE_INJECTION_KEY } from './utils';

type CheckboxValueType = string | number | boolean;

export default defineComponent({
  name: 'ElTreeNode',
  components: {
    ElCollapseTransition,
    ElCheckbox,
    ElTreeNodeContent,
    ElIcon,
    Loading,
  },
  props: {
    node: {
      type: Node,
      default: () => ({}),
    },
    props: {
      type: Object as PropType<TreeOptionProps>,
      default: () => ({}),
    },
    accordion: Boolean,
    renderContent: Function,
    renderAfterExpand: Boolean,
    showCheckbox: Boolean,
  },
  emits: ['node-expand'],
  setup(props, ctx) {
    const { broadcastExpanded } = useNodeExpandEventBroadcast(props);
    const tree = inject<RootTreeType>(ROOT_TREE_INJECTION_KEY)!;
    const expanded = ref(false);
    const childNodeRendered = ref(false);
    const oldChecked = ref<boolean>();
    const oldIndeterminate = ref<boolean>();
    const node$ = ref<HTMLElement>();
    const dragEvents = inject(dragEventsKey)!;
    const instance = getCurrentInstance()!.proxy;

    provide(NODE_INSTANCE_INJECTION_KEY, instance);
    if (!tree) {
      warn('[ElTree] Can not find node\'s tree.');
    }

    if (props.node.expanded) {
      expanded.value = true;
      childNodeRendered.value = true;
    }

    const childrenKey = tree.props.props['children'] || 'children';
    watch(
      () => {
        const children = props.node.data?.[childrenKey];
        return children && [...children];
      },
      () => {
        props.node.updateChildren();
      },
    );

    watch(
      () => props.node.indeterminate,
      (val) => {
        handleSelectChange(props.node.checked, val);
      },
    );

    watch(
      () => props.node.checked,
      (val) => {
        handleSelectChange(val, props.node.indeterminate);
      },
    );

    watch(
      () => props.node.childNodes.length,
      () => props.node.reInitChecked(),
    );

    watch(
      () => props.node.expanded,
      (val) => {
        nextTick(() => (expanded.value = val));
        if (val) {
          childNodeRendered.value = true;
        }
      },
    );

    const getNodeKey = (node: Node): any => tree.props.nodeKey
      ? getNodeKeyUtil(tree.props.nodeKey, node.data)
      : node.id;

    const getNodeClass = (node: Node) => {
      const nodeClassFunc = props.props.class;
      if (!nodeClassFunc) return '';
      return normalizeClass(isFunction(nodeClassFunc) ? nodeClassFunc(node.data, node) : nodeClassFunc);
    };

    function handleSelectChange(checked: boolean, indeterminate: boolean) {
      if (
        oldChecked.value !== checked ||
        oldIndeterminate.value !== indeterminate
      ) {
        tree.ctx.emit('check-change', props.node.data, checked, indeterminate);
      }
      oldChecked.value = checked;
      oldIndeterminate.value = indeterminate;
    }

    const handleClick = (e: MouseEvent) => {
      handleCurrentChange(tree.store, tree.ctx.emit, () => {
        const nodeKeyProp = tree?.props?.nodeKey;
        if (nodeKeyProp) {
          const curNodeKey = getNodeKey(props.node);
          tree.store.value.setCurrentNodeKey(curNodeKey);
        } else {
          tree.store.value.setCurrentNode(props.node);
        }
      });
      tree.currentNode.value = props.node;

      if (tree.props.expandOnClickNode) {
        handleExpandIconClick();
      }

      if (
        (tree.props.checkOnClickNode ||
          (props.node.isLeaf &&
            tree.props.checkOnClickLeaf &&
            props.showCheckbox)) &&
        !props.node.disabled
      ) {
        handleCheckChange(!props.node.checked);
      }
      tree.ctx.emit('node-click', props.node.data, props.node, instance, e);
    };

    function handleContextMenu(event: Event) {
      // if (isNotEmptyArray(tree.instance._events['node-contextmenu'])) {
      //   event.stopPropagation();
      //   event.preventDefault();
      // }

      if (tree.instance.$listeners['node-contextmenu']) {
        event.stopPropagation();
        event.preventDefault();
      }

      tree.ctx.emit(
        'node-contextmenu',
        event,
        props.node.data,
        props.node,
        instance,
      );
    }

    function handleExpandIconClick() {
      if (props.node.isLeaf) return;
      if (expanded.value) {
        tree.ctx.emit('node-collapse', props.node.data, props.node, instance);
        props.node.collapse();
      } else {
        props.node.expand(() => {
          ctx.emit('node-expand', props.node.data, props.node, instance);
        });
      }
    }

    function handleCheckChange(value: CheckboxValueType) {
      const checkStrictly = tree?.props.checkStrictly;
      const childNodes = props.node.childNodes;
      if (!checkStrictly && childNodes.length) {
        value = childNodes.some(node => !node.isEffectivelyChecked);
      }
      props.node.setChecked(value as boolean, !checkStrictly);
      nextTick(() => {
        const store = tree.store.value;
        tree.ctx.emit('check', props.node.data, {
          checkedNodes: store.getCheckedNodes(),
          checkedKeys: store.getCheckedKeys(),
          halfCheckedNodes: store.getHalfCheckedNodes(),
          halfCheckedKeys: store.getHalfCheckedKeys(),
        });
      });
    }

    const handleChildNodeExpand = (
      nodeData: TreeNodeData,
      node: Node,
      instance: ComponentInstance,
    ) => {
      broadcastExpanded(node);
      tree.ctx.emit('node-expand', nodeData, node, instance);
    };

    const handleDragStart = (event: DragEvent) => {
      if (!tree.props.draggable) return;
      dragEvents.treeNodeDragStart({ event, treeNode: props });
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (!tree.props.draggable) return;
      dragEvents.treeNodeDragOver({
        event,
        treeNode: { $el: node$.value, node: props.node },
      });
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleDragEnd = (event: DragEvent) => {
      if (!tree.props.draggable) return;
      dragEvents.treeNodeDragEnd(event);
    };

    return {
      node$,
      tree,
      expanded,
      childNodeRendered,
      oldChecked,
      oldIndeterminate,
      getNodeKey,
      getNodeClass,
      handleSelectChange,
      handleClick,
      handleContextMenu,
      handleExpandIconClick,
      handleCheckChange,
      handleChildNodeExpand,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
      CaretRight,
    };
  },
});
</script>
