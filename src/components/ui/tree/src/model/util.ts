import type Node from './node';
import type { TreeEmits } from '../props';
import type { RootTreeType, TreeKey, TreeNodeData } from '../typings';

export const NODE_KEY = '$treeNodeId';
export const getNodeKey = (key: TreeKey | undefined, data: TreeNodeData) => data?.[key || NODE_KEY];

export function markNodeData(node: Node, data: TreeNodeData | null): void {
  if (!data || data[NODE_KEY]) return;
  Object.defineProperty(data, NODE_KEY, {
    value: node.id,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

export function handleCurrentChange(store: RootTreeType['store'], emit: TreeEmits, setCurrent: VoidFunction) {
  const preCurrentNode = store.value.currentNode;
  setCurrent();
  const currentNode = store.value.currentNode;
  if (preCurrentNode === currentNode) return;

  emit('current-change', currentNode ? currentNode.data : null, currentNode);
}
