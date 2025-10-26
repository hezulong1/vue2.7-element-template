import { hasOwn, capitalize } from '@vue/shared';
import { isClient } from '@vueuse/core';
import { cacheStringFunction } from './logic';
import { isNumber, isString, isNumeric } from './types';

export function getWindow(e?: Node | UIEvent | null): Window {
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
  } else if (isString(value)) {
    return value;
  }

  if (import.meta.env.DEV) {
    console.error('binding value must be a string or number');
  }
}

export function isHTMLElement(e: any): e is HTMLElement {
  if (typeof HTMLElement === 'undefined') return false;
  return !!e && e instanceof HTMLElement;
}

export function isElement(e: any): e is Element {
  if (typeof Element === 'undefined') return false;
  return !!e && e instanceof Element;
}

export function remove(...children: Element[]): void {
  children.forEach((child) => {
    if (!child) return;

    if (child.remove) {
      child.remove();
    } else if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
  });
}

let scrollbarSize: { width: number; height: number } | undefined;

export interface GetBrowserScrollbarSizeOptions {
  forceUpdate?: boolean;
  testContainer?: HTMLElement;
}

export function getBrowserScrollbarSize(options?: boolean | GetBrowserScrollbarSizeOptions) {
  let forceUpdate: boolean | undefined;
  let testContainer: HTMLElement | undefined;

  if (typeof options === 'boolean') {
    forceUpdate = options;
  } else if (options) {
    testContainer = options.testContainer;
    // 如果未配置 forceUpdate，则根据 testContainer 是否存在来判断强制更新
    forceUpdate = typeof options.forceUpdate === 'boolean' ? options.forceUpdate : !!testContainer;
  }

  if (typeof scrollbarSize !== 'undefined' && !forceUpdate) return scrollbarSize;
  if (!isClient) {
    scrollbarSize = { width: 0, height: 0 };
    return scrollbarSize;
  }

  if (!testContainer) {
    testContainer = document.body;
  }

  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  testContainer.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  const heightNoScroll = outer.offsetHeight;
  outer.style.overflow = 'scroll';
  // @ts-expect-error 支持 IE11
  outer.style.msOverflowStyle = 'scrollbar';

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;
  const heightWithScroll = inner.offsetHeight;
  remove(outer);

  const width = widthNoScroll - widthWithScroll;
  const height = heightNoScroll - heightWithScroll;
  scrollbarSize = { width, height };

  return scrollbarSize;
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
