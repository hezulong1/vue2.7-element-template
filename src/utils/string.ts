const camelizeRE = /-(\w)/g;
export function camelize(str: string) {
  return str.replace(camelizeRE, (_, letter) => (letter ? letter.toUpperCase() : ''));
}

export function capitalize<T extends string>(str: T) {
  return <Capitalize<T>>(str.charAt(0).toUpperCase() + str.slice(1));
}

const kebabCaseRE = /\B([A-Z])/g;
export function kebabCase(str: string) {
  return str.replace(kebabCaseRE, '-$1').toLowerCase();
}

const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const charsetLength = charset.length;

export function randomString(len = 5, prefix = '') {
  let text = '';

  for (let i = 0; i < len; i++) {
    text += charset.charAt(Math.floor(Math.random() * charsetLength));
  }

  return prefix ? `${prefix}-${text}` : text;
}
