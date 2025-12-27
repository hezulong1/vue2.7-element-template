import { hasOwn } from '@vue/shared';
import { isClient } from '@vueuse/core';
import { cacheStringFunction } from './logic';
import { capitalize } from './string';
import { isFunction, isNumber, isNumeric, isObject } from './types';

export function getWindow(e?: Node | UIEvent | null): Window & typeof globalThis {
  const candidateNode = e as Node | undefined | null;
  if (candidateNode?.ownerDocument?.defaultView) {
    return candidateNode.ownerDocument.defaultView.window;
  }

  const candidateEvent = e as UIEvent | undefined | null;
  if (candidateEvent?.view) {
    return candidateEvent.view.window;
  }

  return window;
}

export function getComputedStyle(element: Element): CSSStyleDeclaration;
export function getComputedStyle<P extends keyof CSSStyleDeclaration>(element: Element, property: P): CSSStyleDeclaration[P];
export function getComputedStyle(element: Element, property?: keyof CSSStyleDeclaration) {
  const style = getWindow(element).getComputedStyle(element, null);
  return property ? style[property] : style;
}

const prefixes = ['', 'webkit', 'ms', 'moz', 'o'];

export const getStyleProperty = cacheStringFunction(<T extends string>(property: T): T => {
  const bodyStyle = getWindow().document.body.style;

  for (const prefix of prefixes) {
    const toCheck = prefix ? (prefix + capitalize(property)) : property;
    if (hasOwn(bodyStyle, toCheck)) {
      return toCheck;
    }
  }

  return property;
});

export function addUnit(value?: string | number, defaultUnit = 'px') {
  if (!value) return '';

  if (isNumber(value) || isNumeric(value)) {
    return `${value}${defaultUnit}`;
  } else if (typeof value === 'string') {
    return value;
  }

  if (import.meta.env.DEV) {
    console.error('binding value must be a string or number');
  }
}

export function isNode(e: any): e is Node {
  // TODO: 或许并不需要这方面的判断
  if (!isClient) return false;
  return isObject(e) && (e instanceof Node || e instanceof getWindow(e as Node).Node);
}

const ELEMENT_NODE: typeof Node.ELEMENT_NODE = 1;
const COMMENT_NODE: typeof Node.COMMENT_NODE = 8;

export function isComment(e: any): e is Comment {
  return isNode(e) && e.nodeType === COMMENT_NODE && e.nodeName === '#comment';
}

export function isElement(e: any): e is Element {
  return isNode(e) && e.nodeType === ELEMENT_NODE && typeof e.nodeName === 'string';
}

export function isHTMLElement(e: any): e is HTMLElement {
  return isElement(e) && (e instanceof HTMLElement || e instanceof getWindow(e as Node).HTMLElement);
}

export function isSVGElement(e: any): e is SVGElement {
  return isElement(e) && (e instanceof SVGElement || e instanceof getWindow(e as Node).SVGElement);
}

const _remove = (
  () => isFunction(Element.prototype.remove) && isFunction(CharacterData.prototype.remove)
    ? (el: Node) => (el as Element).remove?.()
    : (el: Node) => el.parentNode?.removeChild(el)
)();

export function remove(...children: (Node | undefined | null)[]): void {
  for (const child of children) {
    if (!child) continue;
    _remove(child);
  }
}

const _after = (targetEl: Element, node: Node) => {
  const parentNode = targetEl.parentNode;
  if (!parentNode) return;

  if (parentNode.lastChild === targetEl) {
    parentNode.appendChild(node);
  } else {
    parentNode.insertBefore(node, targetEl.nextSibling);
  }
};

export const after = (
  () => typeof Element.prototype.after === 'function'
    ? (targetEl: Element, ...children: Node[]) => targetEl.after(...children)
    : (targetEl: Element, ...children: Node[]) => {
        for (const child of children) {
          _after(targetEl, child);
        }
      }
)();

let scrollBarWidth: number | undefined;

// 假设滚动条宽高一致（可使用 CSS 设置宽高），若不一致，需要按照实际情况处理代码逻辑
// 可以查看项目的 git 记录参考解决
export function getScrollbarWidth() {
  if (!isClient) return 0;
  if (typeof scrollBarWidth !== 'undefined') return scrollBarWidth;

  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = 'scroll';

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;
  remove(outer);
  scrollBarWidth = widthNoScroll - widthWithScroll;

  return scrollBarWidth;
}

export function openNewWindow(url: string, title: string, width: number, height: number): void {
  interface IFFScreen {
    left: number;
    top: number;
  }

  // Fixes dual-screen position                                     Most browsers       Firefox
  const dualScreenLeft = typeof window.screenLeft !== 'undefined' ? window.screenLeft : (<IFFScreen><any>screen).left;
  const dualScreenTop = typeof window.screenTop !== 'undefined' ? window.screenTop : (<IFFScreen><any>screen).top;

  const iWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  const iHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  const left = ((iWidth / 2) - (width / 2)) + dualScreenLeft;
  const top = ((iHeight / 2) - (height / 2)) + dualScreenTop;
  const features = 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left;
  const newWindow = window.open(url, title, features);

  // Puts focus on the newWindow
  if (newWindow && newWindow.focus) {
    newWindow.focus();
  }
}

export function hasClass(el?: Element, cls?: string): boolean {
  if (!el || !cls) return false;
  if (cls.indexOf(' ') !== -1) throw new Error('className should not contain space.');
  return el.classList.contains(cls);
}

const classNameToArray = (cls = '') => cls.split(' ').filter(x => !!x.trim());

/**
 * IE 中 classList.add 不支持多参数
 */
export function addClass(el?: Element, cls?: string): void {
  if (!el) return;

  for (const clsName of classNameToArray(cls)) {
    el.classList.add(clsName);
  }
}

/**
 * IE 中 classList.remove 不支持多参数
 */
export function removeClass(el?: Element, cls?: string): void {
  if (!el) return;

  for (const clsName of classNameToArray(cls)) {
    el.classList.remove(clsName);
  }
}

type Selector<E, K> = E | K | null | undefined;
export type QuerySelector<E extends Element = Element, K extends string = string> = Selector<E, K> | (() => Selector<E, K>);

export function query<K extends keyof HTMLElementTagNameMap>(selector: QuerySelector<HTMLElementTagNameMap[K], K>): HTMLElementTagNameMap[K] | null;
export function query<K extends keyof SVGElementTagNameMap>(selector: QuerySelector<SVGElementTagNameMap[K], K>): SVGElementTagNameMap[K] | null;
export function query<E extends Element>(selector: QuerySelector<E>): E | null;
export function query<E extends Element>(selector: QuerySelector<E>): E | null {
  let el: E | null = null;

  if (typeof selector === 'string') {
    el = document.querySelector(selector);
  } else if (typeof selector === 'function') {
    el = query(selector());
  } else {
    el = selector || null;
  }

  return el;
}
