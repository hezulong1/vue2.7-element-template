import type { AnyFn } from '@vueuse/core';
import { isAndroid } from './browser';

export function once<K extends keyof WindowEventMap>(el: Window, type: K, fn: AnyFn): void;
export function once<K extends keyof DocumentEventMap>(el: Document, type: K, fn: AnyFn): void;
export function once<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: AnyFn): void;
export function once(el: HTMLElement, type: string, fn: AnyFn): void;
export function once(el: HTMLElement | Window | Document, type: string, fn: AnyFn): void {
  let listener = function (this: typeof el) {
    if (fn) {
      // eslint-disable-next-line prefer-rest-params
      fn.apply<typeof el, any, void>(this, arguments);
    }
    el.removeEventListener(type, listener);
  };
  el.addEventListener(type, listener);
}

// port from https://github.com/ai/nanoevents

type EventsMap = Record<string, any>;

interface DefaultEvents extends EventsMap {
  [event: string]: (...args: any) => void;
}

export interface Unsubscribe {
  (): void;
}

export declare class Emitter<Events extends EventsMap = DefaultEvents> {
  /**
   * Event names in keys and arrays with listeners in values.
   *
   * ```js
   * emitter1.events = emitter2.events
   * emitter2.events = { }
   * ```
   */
  events: Partial<{ [E in keyof Events]: Events[E][] }>;

  /**
   * Add a listener for a given event.
   *
   * ```js
   * const unbind = ee.on('tick', (tickType, tickDuration) => {
   *   count += 1
   * })
   *
   * disable () {
   *   unbind()
   * }
   * ```
   *
   * @param event The event name.
   * @param cb The listener function.
   * @returns Unbind listener from event.
   */
  on<K extends keyof Events>(this: this, event: K, cb: Events[K]): Unsubscribe;

  /**
   * Calls each of the listeners registered for a given event.
   *
   * ```js
   * ee.emit('tick', tickType, tickDuration)
   * ```
   *
   * @param event The event name.
   * @param args The arguments for listeners.
   */
  emit<K extends keyof Events>(
    this: this,
    event: K,
    ...args: Parameters<Events[K]>
  ): void;
}

/**
 * Create event emitter.
 *
 * ```js
 * import { createNanoEvents } from 'nanoevents'
 *
 * class Ticker {
 *   constructor() {
 *     this.emitter = createNanoEvents()
 *   }
 *   on(...args) {
 *     return this.emitter.on(...args)
 *   }
 *   tick() {
 *     this.emitter.emit('tick')
 *   }
 * }
 * ```
 */
export function createNanoEvents<Events extends EventsMap = DefaultEvents>(): Emitter<Events> {
  return {
    events: {},
    emit(event, ...args) {
      (this.events[event] || [] as any).forEach((i: any) => i(...args));
    },
    on(event, cb) {
      (this.events[event] = this.events[event] || [] as any).push(cb);
      return () =>
        (this.events[event] = (this.events[event] || [] as any).filter((i: any) => i !== cb));
    },
  };
}

export const EVENT_CODE = {
  tab: 'Tab',
  enter: 'Enter',
  space: 'Space',
  left: 'ArrowLeft', // 37
  up: 'ArrowUp', // 38
  right: 'ArrowRight', // 39
  down: 'ArrowDown', // 40
  esc: 'Escape',
  delete: 'Delete',
  backspace: 'Backspace',
  numpadEnter: 'NumpadEnter',
  pageUp: 'PageUp',
  pageDown: 'PageDown',
  home: 'Home',
  end: 'End',
};

export const composeEventHandlers = <E>(
  theirsHandler?: (event: E) => boolean | void,
  oursHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {},
) => {
  const handleEvent = (event: E) => {
    const shouldPrevent = theirsHandler?.(event);

    if (checkForDefaultPrevented === false || !shouldPrevent) {
      return oursHandler?.(event);
    }
  };
  return handleEvent;
};

type WhenMouseHandler = (e: PointerEvent) => any;
export const whenMouse = (handler: WhenMouseHandler): WhenMouseHandler => (e: PointerEvent) =>
  e.pointerType === 'mouse' ? handler(e) : undefined;

export const getEventKey = (event: KeyboardEvent): string => {
  let key = event.key && event.key !== 'Unidentified' ? event.key : '';

  // On Android, event.key and event.code may not be useful when entering characters or space
  // So here we directly get the last character of the input
  // **only takes effect in the keyup event**
  if (!key && event.type === 'keyup' && isAndroid) {
    const target = event.target as HTMLInputElement;
    key = target.value.charAt(target.selectionStart! - 1);
  }

  return key;
};

export const getEventCode = (event: KeyboardEvent): string => {
  if (event.code && event.code !== 'Unidentified') return event.code;
  // On android, event.code is always '' (see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#browser_compatibility)
  const key = getEventKey(event);

  if (key) {
    if (Object.values(EVENT_CODE).includes(key)) return key;

    switch (key) {
      case ' ':
        return EVENT_CODE.space;
      default:
        return '';
    }
  }

  return '';
};
