const camelizeRE = /-(\w)/g;
export function camelize(str: string) {
  return str.replace(camelizeRE, (_, letter) => (letter ? letter.toUpperCase() : ''));
}

export function capitalize<T extends string>(str: T) {
  return <Capitalize<T>>(str.charAt(0).toUpperCase() + str.slice(1));
}

const kebabRE = /\B([A-Z])/g;
export function kebab(str: string) {
  return str.replace(kebabRE, '-$1').toLowerCase();
}
