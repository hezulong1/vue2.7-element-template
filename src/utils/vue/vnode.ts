import type { VNode, VNodeData } from 'vue';
import { isObject, hasOwn, normalizeStyle, normalizeClass } from '@vue/shared';
import { isNonEmptyArray } from '../types';

export function isVNode(value: any): value is VNode {
  return isObject(value) && hasOwn(value, 'componentOptions') && hasOwn(value, 'context');
}

export function isEmptyVNode(vnode: VNode): boolean {
  return !(vnode.tag || (vnode.text && vnode.text.trim() !== ''));
}

export function filterEmptyVNode(children: VNode[] = []) {
  return children.filter(vnode => !isEmptyVNode(vnode));
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
  if (isNonEmptyArray(vnode.children)) {
    cloned.children = vnode.children.map(_deepCloneVNode);
  }
  if (isNonEmptyArray(vnode.componentOptions?.children)) {
    cloned.componentOptions!.children = vnode.componentOptions.children.map(_deepCloneVNode);
  }
  return cloned;
}

type ExtraProps = Omit<VNodeData, 'staticClass' | 'staticStyle' | 'slot' | 'tag' | 'hook' | 'inlineTemplate'> & {
  children?: VNode[] | undefined;
};

export function cloneVNode(vnode: VNode, extraProps?: ExtraProps | null, deep?: boolean) {
  const node = deep ? _deepCloneVNode(vnode) : _cloneVNode(vnode);
  if (!extraProps) return node;

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

  const children = isNonEmptyArray(extraProps.children) ? extraProps.children : null;

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
