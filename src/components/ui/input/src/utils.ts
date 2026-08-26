import type { ShallowRef } from 'vue';
import type { InputType } from './typings';
import { isFirefox } from '@/utils/browser';
import { isUndefinedOrNull } from '@/utils/types';

const allowed = new Set(['text', 'textarea', 'number', 'email', 'tel', 'search', 'url', 'password']);
export const allowInputText = (type: InputType) => allowed.has(type);

let hiddenTextarea: HTMLTextAreaElement | undefined;

const HIDDEN_STYLE = {
  height: '0',
  visibility: 'hidden',
  overflow: isFirefox ? '' : 'hidden',
  position: 'absolute',
  'z-index': '-1000',
  top: '0',
  right: '0',
};

const CONTEXT_STYLE = [
  'letter-spacing',
  'line-height',
  'padding-top',
  'padding-bottom',
  'font-family',
  'font-weight',
  'font-size',
  'text-rendering',
  'text-transform',
  'width',
  'text-indent',
  'padding-left',
  'padding-right',
  'border-width',
  'box-sizing',
  'word-break',
];

interface NodeStyle {
  contextStyle: string[][];
  boxSizing: string;
  paddingSize: number;
  borderSize: number;
}

interface TextAreaHeight {
  height: string;
  minHeight?: string;
}

const calculateNodeStyling = (targetElement: Element): NodeStyle => {
  const style = window.getComputedStyle(targetElement);

  const boxSizing = style.getPropertyValue('box-sizing');

  const paddingSize =
    Number.parseFloat(style.getPropertyValue('padding-bottom')) +
    Number.parseFloat(style.getPropertyValue('padding-top'));

  const borderSize =
    Number.parseFloat(style.getPropertyValue('border-bottom-width')) +
    Number.parseFloat(style.getPropertyValue('border-top-width'));

  const contextStyle = CONTEXT_STYLE.map(name => [
    name,
    style.getPropertyValue(name),
  ]);

  return { contextStyle, paddingSize, borderSize, boxSizing };
};

export function calcTextareaHeight(
  targetElement: HTMLTextAreaElement,
  minRows = 1,
  maxRows?: number,
): TextAreaHeight {
  if (!hiddenTextarea) {
    hiddenTextarea = document.createElement('textarea');
    let hostNode = document.body;
    // #23575
    if (!isFirefox && targetElement.parentNode) {
      hostNode = targetElement.parentNode as HTMLElement;
    }
    hostNode.appendChild(hiddenTextarea);
  }

  const { paddingSize, borderSize, boxSizing, contextStyle } = calculateNodeStyling(targetElement);

  contextStyle.forEach(([key, value]) =>
    hiddenTextarea?.style.setProperty(key, value),
  );

  Object.entries(HIDDEN_STYLE).forEach(([key, value]) =>
    hiddenTextarea?.style.setProperty(key, value, 'important'),
  );

  hiddenTextarea.value = targetElement.value || targetElement.placeholder || '';

  let height = hiddenTextarea.scrollHeight;
  const result = {} as TextAreaHeight;

  if (boxSizing === 'border-box') {
    height = height + borderSize;
  } else if (boxSizing === 'content-box') {
    height = height - paddingSize;
  }

  hiddenTextarea.value = '';
  const singleRowHeight = hiddenTextarea.scrollHeight - paddingSize;

  if (typeof minRows === 'number') {
    let minHeight = singleRowHeight * minRows;
    if (boxSizing === 'border-box') {
      minHeight = minHeight + paddingSize + borderSize;
    }
    height = Math.max(minHeight, height);
    result.minHeight = `${ minHeight }px`;
  }
  if (typeof maxRows === 'number') {
    let maxHeight = singleRowHeight * maxRows;
    if (boxSizing === 'border-box') {
      maxHeight = maxHeight + paddingSize + borderSize;
    }
    height = Math.min(maxHeight, height);
  }
  result.height = `${ height }px`;
  hiddenTextarea.parentNode?.removeChild(hiddenTextarea);
  hiddenTextarea = undefined;

  return result;
}

interface SelectionInfo {
  selectionStart?: number;
  selectionEnd?: number;
  value?: string;
  beforeTxt?: string;
  afterTxt?: string;
}

// Keep input cursor in the correct position when we use formatter.
export function useCursor(input: ShallowRef<HTMLInputElement | undefined>): [() => void, () => void] {
  let selectionInfo: SelectionInfo;

  function recordCursor() {
    if (isUndefinedOrNull(input.value)) return;

    const { selectionStart, selectionEnd, value } = input.value;

    if (selectionStart == null || selectionEnd == null) return;

    const beforeTxt = value.slice(0, Math.max(0, selectionStart));
    const afterTxt = value.slice(Math.max(0, selectionEnd));

    selectionInfo = {
      selectionStart,
      selectionEnd,
      value,
      beforeTxt,
      afterTxt,
    };
  }

  function setCursor() {
    if (isUndefinedOrNull(input.value) || isUndefinedOrNull(selectionInfo)) return;

    const { value } = input.value;
    const { beforeTxt, afterTxt, selectionStart } = selectionInfo;

    if (
      isUndefinedOrNull(beforeTxt) ||
      isUndefinedOrNull(afterTxt) ||
      isUndefinedOrNull(selectionStart)
    ) return;

    let startPos = value.length;

    if (value.endsWith(afterTxt)) {
      startPos = value.length - afterTxt.length;
    } else if (value.startsWith(beforeTxt)) {
      startPos = beforeTxt.length;
    } else {
      const beforeLastChar = beforeTxt[selectionStart - 1];
      const newIndex = value.indexOf(beforeLastChar, selectionStart - 1);
      if (newIndex !== -1) {
        startPos = newIndex + 1;
      }
    }

    input.value.setSelectionRange(startPos, startPos);
  }

  return [recordCursor, setCursor];
}
