<template>
  <div
    ref="el$"
    :class="[
      'el-tree',
      {
        'is-dragging': !!dragState.draggingNode,
        'is-drop-not-allow': !dragState.allowDrop,
        'is-drop-inner': dragState.dropType === 'inner',
        'el-tree--highlight-current': highlightCurrent,
      },
    ]"
    role="tree"
  >
    <ElTreeNode
      v-for="child in root.childNodes"
      :key="getNodeKey(child)"
      :node="child"
      :props="props"
      :accordion="accordion"
      :render-after-expand="renderAfterExpand"
      :show-checkbox="showCheckbox"
      :render-content="renderContent"
      @node-expand="handleNodeExpand"
    />
    <div v-if="isEmpty" class="el-tree__empty-block">
      <slot name="empty">
        <span class="el-tree__empty-text">
          <!-- {{ emptyText ?? t('el.tree.emptyText') }} -->
          {{ emptyText ?? '空数据' }}
        </span>
      </slot>
    </div>
    <div
      v-show="dragState.showDropIndicator"
      ref="dropIndicator$"
      class="el-tree__drop-indicator"
    />
  </div>
</template>

<script lang="ts">
import type Node from './model/node';
import type { ComponentInstance } from 'vue';
import type { FilterValue, TreeData, TreeKey, TreeNodeData } from './typings';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  provide,
  ref,
  watch,
} from 'vue';
import { looseEqual } from '@/utils/array';
import { formItemContextKey } from '../../form';
import TreeStore from './model/treeStore';
import { getNodeKey as getNodeKeyUtil, handleCurrentChange } from './model/util';
import ElTreeNode from './TreeNode.vue';
import { useNodeExpandEventBroadcast } from './model/useNodeExpandEventBroadcast';
import { useDragNodeHandler } from './model/useDragNode';
import { useKeydown } from './model/useKeydown';
import { ROOT_TREE_INJECTION_KEY } from './utils';
import { treeEmits, treeProps } from './props';

export default defineComponent({
  name: 'ElTree',
  components: { ElTreeNode },
  props: treeProps,
  emits: treeEmits,
  setup(props, ctx) {
    // const { t } = useLocale();
    // const ns = useNamespace('tree');

    const store = ref<TreeStore>(
      new TreeStore({
        key: props.nodeKey,
        data: props.data,
        lazy: props.lazy,
        props: props.props,
        load: props.load,
        currentNodeKey: props.currentNodeKey,
        checkStrictly: props.checkStrictly,
        checkDescendants: props.checkDescendants,
        defaultCheckedKeys: props.defaultCheckedKeys,
        defaultExpandedKeys: props.defaultExpandedKeys,
        autoExpandParent: props.autoExpandParent,
        defaultExpandAll: props.defaultExpandAll,
        filterNodeMethod: props.filterNodeMethod,
      }),
    );

    store.value.initialize();

    const root = ref<Node>(store.value.root);
    const currentNode = ref<Node | null>(null);
    const el$ = ref<HTMLElement | null>(null);
    const dropIndicator$ = ref<HTMLElement | null>(null);

    const { broadcastExpanded } = useNodeExpandEventBroadcast(props);
    const { dragState } = useDragNodeHandler({
      props,
      ctx,
      el$,
      dropIndicator$,
      store,
    });

    useKeydown({ el$ }, store);

    const instance = getCurrentInstance()!.proxy;

    const isSelectTree = computed(() => {
      let parent = instance?.$parent;
      while (parent) {
        if (parent.$options.name === 'ElTreeSelect') {
          return true;
        }
        parent = parent.$parent;
      }
      return false;
    });

    const isEmpty = computed(() => {
      const { childNodes } = root.value;
      return (
        (
          !childNodes ||
          childNodes.length === 0 ||
          childNodes.every(({ visible }) => !visible)
        ) && !isSelectTree.value
      );
    });

    watch(
      () => props.currentNodeKey,
      (newVal) => {
        store.value.setCurrentNodeKey(newVal ?? null);
      },
    );

    watch(
      () => props.defaultCheckedKeys,
      (newVal, oldVal) => {
        if (looseEqual(newVal, oldVal)) return;

        store.value.setDefaultCheckedKey(newVal ?? []);
      },
    );

    watch(
      () => props.defaultExpandedKeys,
      (newVal) => {
        store.value.setDefaultExpandedKeys(newVal ?? []);
      },
    );

    watch(
      () => props.data,
      (newVal) => {
        store.value.setData(newVal);
      },
      { deep: true },
    );

    watch(
      () => props.checkStrictly,
      (newVal) => {
        store.value.checkStrictly = newVal;
      },
    );

    const filter = (value: FilterValue) => {
      if (!props.filterNodeMethod) throw new Error('[Tree] filterNodeMethod is required when filter');
      store.value.filter(value);
    };

    const getNodeKey = (node: Node) => props.nodeKey ? getNodeKeyUtil(props.nodeKey, node.data) : node.id;

    const requireNodeKey = (methodName: string) => {
      if (!props.nodeKey) {
        throw new Error(`[Tree] nodeKey is required in ${ methodName }`);
      }
    };

    const getNodePath = (data: TreeKey | TreeNodeData) => {
      requireNodeKey('getNodePath');

      const node = store.value.getNode(data);
      if (!node) return [];
      const path = [node.data];
      let parent = node.parent;
      while (parent && parent !== root.value) {
        path.push(parent.data);
        parent = parent.parent;
      }
      return path.reverse();
    };

    const getCheckedNodes = (
      leafOnly?: boolean,
      includeHalfChecked?: boolean,
    ): TreeNodeData[] => store.value.getCheckedNodes(leafOnly, includeHalfChecked);

    const getCheckedKeys = (leafOnly?: boolean): TreeKey[] => store.value.getCheckedKeys(leafOnly);

    const getCurrentNode = () => {
      const currentNode = store.value.getCurrentNode();
      return currentNode ? currentNode.data : null;
    };

    const getCurrentKey = (): TreeKey | null => {
      requireNodeKey('getCurrentKey');

      const currentNode = getCurrentNode();
      return currentNode ? currentNode[props.nodeKey!] : null;
    };

    const setCheckedNodes = (nodes: Node[], leafOnly?: boolean) => {
      requireNodeKey('setCheckedNodes');

      store.value.setCheckedNodes(nodes, leafOnly);
    };

    const setCheckedKeys = (keys: TreeKey[], leafOnly?: boolean) => {
      requireNodeKey('setCheckedKeys');

      store.value.setCheckedKeys(keys, leafOnly);
    };

    const setChecked = (
      data: TreeKey | TreeNodeData,
      checked: boolean,
      deep: boolean = false,
    ) => {
      store.value.setChecked(data, checked, deep);
    };

    const getHalfCheckedNodes = (): TreeNodeData[] => store.value.getHalfCheckedNodes();

    const getHalfCheckedKeys = (): TreeKey[] => store.value.getHalfCheckedKeys();

    const setCurrentNode = (node: Node, shouldAutoExpandParent = true) => {
      requireNodeKey('setCurrentNode');

      handleCurrentChange(store, ctx.emit, () => {
        broadcastExpanded(node);
        store.value.setUserCurrentNode(node, shouldAutoExpandParent);
      });
    };

    const setCurrentKey = (
      key: TreeKey | null = null,
      shouldAutoExpandParent = true,
    ) => {
      requireNodeKey('setCurrentKey');

      handleCurrentChange(store, ctx.emit, () => {
        broadcastExpanded();
        store.value.setCurrentNodeKey(key, shouldAutoExpandParent);
      });
    };

    const getNode = (data: TreeKey | TreeNodeData): Node => store.value.getNode(data);

    const remove = (data: TreeNodeData | Node) => {
      store.value.remove(data);
    };

    const append = (
      data: TreeNodeData,
      parentNode: TreeNodeData | TreeKey | Node,
    ) => {
      store.value.append(data, parentNode);
    };

    const insertBefore = (
      data: TreeNodeData,
      refNode: TreeKey | TreeNodeData | Node,
    ) => {
      store.value.insertBefore(data, refNode);
    };

    const insertAfter = (
      data: TreeNodeData,
      refNode: TreeKey | TreeNodeData | Node,
    ) => {
      store.value.insertAfter(data, refNode);
    };

    const handleNodeExpand = (
      nodeData: TreeNodeData,
      node: Node,
      instance: ComponentInstance,
    ) => {
      broadcastExpanded(node);
      ctx.emit('node-expand', nodeData, node, instance);
    };

    const updateKeyChildren = (key: TreeKey, data: TreeData) => {
      requireNodeKey('updateKeyChildren');

      store.value.updateChildren(key, data);
    };

    provide(ROOT_TREE_INJECTION_KEY, {
      ctx,
      props,
      store,
      root,
      currentNode,
      instance,
    });

    provide(formItemContextKey, undefined);

    return {
      // ref
      store,
      root,
      currentNode,
      dragState,
      el$,
      dropIndicator$,

      // computed
      isEmpty,

      // methods
      filter,
      getNodeKey,
      getNodePath,
      getCheckedNodes,
      getCheckedKeys,
      getCurrentNode,
      getCurrentKey,
      setCheckedNodes,
      setCheckedKeys,
      setChecked,
      getHalfCheckedNodes,
      getHalfCheckedKeys,
      setCurrentNode,
      setCurrentKey,
      // t,
      getNode,
      remove,
      append,
      insertBefore,
      insertAfter,
      handleNodeExpand,
      updateKeyChildren,
    };
  },
});
</script>
