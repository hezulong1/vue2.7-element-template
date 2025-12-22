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
