export const NAMESPACE = 'v2et';

const _c = (ns: string) => (...args: string[]) => [NAMESPACE, ns, ...args].join('-');

export namespace LayoutToken {
  export const createNsName = _c('layout');
}

export namespace AppToken {
  export const createNsName = _c('app');
}
