import { isClient } from '@vueuse/core';
import { nanoid } from './nanoid';

export const supportsCustomizeScrollbar = (() => {
  if (!isClient) return false;

  const id = 's-' + nanoid();
  const el = document.createElement('div');

  el.id = id;
  el.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;';
  document.body.appendChild(el);

  const style = document.createElement('style');
  style.textContent = `#${id}::-webkit-scrollbar{width:10px;height:10px}`;
  document.head.appendChild(style);

  const scrollbarWidth = el.offsetWidth - el.clientWidth;
  const webkitSupported = scrollbarWidth === 10;

  let standardSupported = false;

  if (typeof CSS !== 'undefined') {
    standardSupported = CSS.supports('scrollbar-width', 'none');
  } else {
    el.style.cssText += 'scrollbar-width:none;';
    standardSupported = el.offsetWidth === el.clientWidth;
  }

  document.body.removeChild(el);
  document.head.removeChild(style);

  return webkitSupported || standardSupported;
})();

export const supportsPassive = (() => {
  // https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener#option_%E6%94%AF%E6%8C%81%E7%9A%84%E5%AE%89%E5%85%A8%E6%A3%80%E6%B5%8B
  if (!isClient) return false;

  let passiveSupported = false;

  try {
    const options = {
      get passive() {
        // 该函数会在浏览器尝试访问 passive 值时被调用。
        passiveSupported = true;
        return false;
      },
    };
    // @ts-ignore
    window.addEventListener('test', null, options);
    // @ts-ignore
    window.removeEventListener('test', null, options);
  } catch (err) {
    passiveSupported = false;
  }

  return passiveSupported;
})();
