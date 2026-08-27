export function createTimeoutTimer() {
  let token: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (token !== null) {
      clearTimeout(token);
      token = null;
    }
  };

  const cancelAndSet = (runner: VoidFunction, timeout: number) => {
    cancel();
    token = setTimeout(() => {
      token = null;
      runner();
    }, timeout);
  };

  return { cancel, cancelAndSet };
}

export function createIntervalTimer() {
  let token: ReturnType<typeof setInterval> | null = null;

  const cancel = () => {
    if (token !== null) {
      clearInterval(token);
      token = null;
    }
  };

  const cancelAndSet = (runner: VoidFunction, interval: number) => {
    cancel();
    token = setInterval(() => {
      runner();
    }, interval);
  };

  return { cancel, cancelAndSet };
}

export const rAF = (() =>
  typeof requestAnimationFrame !== 'undefined'
    ? (fn: VoidFunction) => requestAnimationFrame(fn)
    : (fn: VoidFunction) => setTimeout(fn, 16)
)();

export const cAF = (() =>
  typeof cancelAnimationFrame !== 'undefined'
    ? (handler: number) => cancelAnimationFrame(handler)
    : (handler: number) => clearTimeout(handler)
)();
