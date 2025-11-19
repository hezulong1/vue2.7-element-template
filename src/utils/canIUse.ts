import { isClient } from '@vueuse/core';
import { customAlphabet } from './nanoid';

const nanoid = customAlphabet('scrollbar', 5);

export const supportCustomizeScrollbar = (() => {
  if (!isClient) return false;

  const id = nanoid();
  const el = document.createElement('div');

  el.id = id;
  el.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;';
  document.body.appendChild(el);

  const style = document.createElement('style');
  style.textContent = `#${id}::-webkit-scrollbar{width:10px;height:10px}`;
  document.head.appendChild(style);

  const scrollbarWidth = el.offsetWidth - el.clientWidth;
  const supportWekbkit = scrollbarWidth === 10;

  let supportStandard = false;

  if (typeof CSS !== 'undefined') {
    supportStandard = CSS.supports('scrollbar-width', 'none');
  } else {
    el.style.cssText += 'scrollbar-width:none;';
    supportStandard = el.offsetWidth === el.clientWidth;
  }

  document.body.removeChild(el);
  document.head.removeChild(style);

  return supportWekbkit || supportStandard;
})();
