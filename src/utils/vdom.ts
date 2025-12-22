// Inspired by:
// https://github.com/vuejs/vue/blob/main/src/core/vdom/helpers/is-async-placeholder.ts
// https://github.com/vuejs/vue/blob/main/src/core/vdom/helpers/get-first-component-child.ts
// https://github.com/vuejs/vue/blob/main/src/core/vdom/helpers/normalize-children.ts
// https://github.com/vuejs/vue/blob/main/src/core/vdom/vnode.ts
// https://github.com/vuejs/vue/blob/main/src/platforms/web/runtime/components/transition.ts
// https://github.com/vueComponent/ant-design-vue/blob/1.x/components/_util/props-util.js
// https://github.com/vueComponent/ant-design-vue/blob/1.x/components/_util/vnode.js

// Vue 中组件可分为“注释(Comment)”、“文本(Text)”、“原生(Native)”和“自定义(Custom)”，
// 引用方式分为‘同步(resolveComponent)’或‘异步(resolveAsyncComponent)’。
// 所有的方法均未考虑异步引用，若需要，参考 https://github.com/vuejs/vue/blob/main/src/core/vdom/helpers/get-first-component-child.ts 完善细节。

import type { VNode, VNodeData } from 'vue';
import type { Prettify } from '@vue/shared';

import { isObject, hasOwn, normalizeStyle, normalizeClass } from '@vue/shared';
import { isNotEmptyArray, isNotEmptyObject, isNotEmptyString } from './types';
import { warn } from './debug';

export function isVNode(value: unknown): value is VNode {
  return isObject(value) && hasOwn(value, 'componentOptions');
}

/**
 * 判断是否为合法的 VNode，不包括“注释(Comment)”和“文本(Text)”
 */
export function isValidVNode(value: unknown): value is VNode {
  return isVNode(value) && !!value.tag;
}

export function isNotEmptyVNode(vnode: VNode): boolean {
  return !!vnode.tag || (vnode.isComment !== true && isNotEmptyString(vnode.text));
}

export function filterEmptyVNode(vnodes?: VNode[] | null): VNode[] {
  return vnodes ? vnodes.filter(x => isNotEmptyVNode(x)) : [];
}

export function getFirstLegitVNode(nodes?: VNode[] | null): VNode | undefined {
  if (!nodes) return;

  if (import.meta.env.DEV) {
    const vnodes = filterEmptyVNode(nodes);
    if (vnodes.length > 1) {
      warn(`requires exact only one valid child.`);
    }
    return vnodes[0];
  }

  for (const vnode of nodes) {
    if (isNotEmptyVNode(vnode)) {
      return vnode;
    }
  }
}

function _cloneVNode(vnode: VNode): VNode {
  const componentOptions = vnode.componentOptions;
  const data = vnode.data;

  let listeners;
  if (componentOptions && componentOptions.listeners) {
    listeners = { ...componentOptions.listeners };
  }

  let on;
  if (data && data.on) {
    on = { ...data.on };
  }
  // @ts-expect-error
  const cloned = new vnode.constructor(
    vnode.tag,
    data && on ? { ...data, on } : data,
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    componentOptions && listeners ? { ...componentOptions, listeners } : componentOptions,
    // @ts-expect-error
    vnode.asyncFactory,
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  // @ts-expect-error
  cloned.fnContext = vnode.fnContext;
  // @ts-expect-error
  cloned.fnOptions = vnode.fnOptions;
  // @ts-expect-error
  cloned.fnScopeId = vnode.fnScopeId;
  // @ts-expect-error
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned;
}

function _deepCloneVNode(vnode: VNode): VNode {
  const cloned = _cloneVNode(vnode);
  if (isNotEmptyArray(vnode.children)) {
    cloned.children = vnode.children.map(_deepCloneVNode);
  }
  if (isNotEmptyArray(vnode.componentOptions?.children)) {
    cloned.componentOptions!.children = vnode.componentOptions!.children.map(_deepCloneVNode);
  }
  return cloned;
}

export type ExtraProps = Prettify<
Omit<VNodeData, 'refInFor' | 'staticClass' | 'staticStyle' | 'slot' | 'tag' | 'hook' | 'transition' | 'inlineTemplate' | 'show' | 'keepAlive'> & {
  children?: VNode[] | undefined;
}>;

export function cloneVNode(vnode: VNode, extraProps?: ExtraProps | null, deep?: boolean) {
  const node = deep ? _deepCloneVNode(vnode) : _cloneVNode(vnode);
  if (!isNotEmptyObject(extraProps)) return node;

  const data = typeof node.data === 'undefined' ? {} : node.data;

  let mergedClass = data.class;
  if (data.staticClass) {
    mergedClass = mergedClass ? normalizeClass([mergedClass, data.staticClass]) : data.staticClass;
  }
  if (extraProps.class) {
    mergedClass = mergedClass ? normalizeClass([mergedClass, extraProps.class]) : extraProps.class;
  }

  let mergedStyle = data.style;
  if (data.staticStyle) {
    mergedStyle = mergedStyle ? normalizeStyle([mergedStyle, data.staticStyle]) : data.staticStyle;
  }
  if (extraProps.style) {
    mergedStyle = mergedStyle ? normalizeStyle([mergedStyle, extraProps.style]) : extraProps.style;
  }

  let mergedAttrs = data.attrs;
  if (extraProps.attrs) {
    mergedAttrs = mergedAttrs ? { ...mergedAttrs, ...extraProps.attrs } : extraProps.attrs;
  }

  let mergedDomProps = data.domProps;
  if (extraProps.domProps) {
    mergedDomProps = mergedDomProps ? { ...mergedDomProps, ...extraProps.domProps } : extraProps.domProps;
  }

  let mergedScopedSlots = data.scopedSlots;
  if (extraProps.scopedSlots) {
    mergedScopedSlots = mergedScopedSlots
      ? { ...mergedScopedSlots, ...extraProps.scopedSlots }
      : extraProps.scopedSlots;
  }

  let mergedDirectives = data.directives;
  if (extraProps.directives) {
    mergedDirectives = mergedDirectives ? [...mergedDirectives, ...extraProps.directives] : extraProps.directives;
    if (!Array.isArray(mergedDirectives)) {
      mergedDirectives = [mergedDirectives];
    }
  }

  const mergedData = Object.assign({}, data, {
    class: mergedClass,
    style: mergedStyle,
    attrs: mergedAttrs,
    domProps: mergedDomProps,
    scopedSlots: mergedScopedSlots,
    directives: mergedDirectives,
  });

  const children = isNotEmptyArray(extraProps.children) ? extraProps.children : null;

  if (node.componentOptions) {
    let mergedProps = node.componentOptions.propsData;
    if (extraProps.props) {
      mergedProps = mergedProps ? { ...mergedProps, ...extraProps.props } : extraProps.props;
    }
    if (node.componentOptions.propsData !== mergedProps) {
      node.componentOptions.propsData = mergedProps;
    }

    let mergedListeners = node.componentOptions.listeners;
    if (extraProps.on) {
      mergedListeners = mergedListeners ? { ...mergedListeners, ...extraProps.on } : extraProps.on;
    }
    if (node.componentOptions.listeners !== mergedListeners) {
      node.componentOptions.listeners = mergedListeners;
    }

    if (children) {
      node.componentOptions.children = children;
    }
  } else {
    if (children) {
      node.children = children;
    }

    let mergedOn = data.on;
    if (extraProps.on) {
      mergedOn = mergedOn ? { ...mergedOn, ...extraProps.on } : extraProps.on;
    }

    mergedData.on = mergedOn;
  }

  if (extraProps.nativeOn) {
    mergedData.on = mergedData.on ? { ...mergedData.on, ...extraProps.nativeOn } : extraProps.nativeOn;
  }

  if (typeof extraProps.key === 'string') {
    node.key = extraProps.key;
    mergedData.key = extraProps.key;
  }

  if (typeof extraProps.ref === 'string') {
    mergedData.ref = extraProps.ref;
  }

  node.data = mergedData;

  return node;
}
