import { isObject } from './types';

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

export function stringToLines(str: string) {
  return str.split(/\r\n|\r|\n/);
}

/**
 * @param trim 是否移除空白符，默认 false
 */
export function stringToArray(str: string | string[], delimiter: string | RegExp = ',', trim = false) {
  let res = Array.isArray(str) ? str : str.split(delimiter);
  if (trim === true) {
    res = res.map(s => s.trim()).filter(s => s);
  }
  return res;
}

export function slash(str: string) {
  return str.replace(/\\/g, '/');
}

export function truncate(value: string, maxLength: number, suffix = '…') {
  return value.length <= maxLength ? value : `${ value.slice(0, Math.max(0, maxLength)) }${ suffix }`;
}

export function ensurePrefix(prefix: string, str: string) {
  return str.startsWith(prefix) ? str : (prefix + str);
}

export function ensureSuffix(suffix: string, str: string) {
  return str.endsWith(suffix) ? str : (str + suffix);
}

/**
   * Helper to create a string from a template and a string record.
   * But with objects instead of positional arguments.
   *
   * @param template string to which formatting is applied
   * @param object
   * @example
   * ```ts
   * format('Hello {greet}, Its {status}!', { greet: 'World', status: 'Okay' }) // Hello World, Its Okay!
   * ```
   */
export function format(template: string, object: Record<string | number, any>): string;
/**
   * Helper to produce a string with a variable number of arguments. Insert variable segments
   * into the string using the {n} notation where N is the index of the argument following the string.
   * @param template string to which formatting is applied
   * @param args replacements for {n}-entries
   * @example
   * ```ts
   * format('Hello {0}, Its {1}!', 'World', 'Okay') // Hello World, Its Okay!
   * ```
   */
export function format(template: string, ...args: any[]): string;
export function format(template: string, ...args: any[]): string {
  const [first] = args;

  if (isObject(first) && !Array.isArray(first)) {
    const values = first as Record<string | number, any>;
    return template.replace(
      /{([^}]+)}/g,
      (match, group) => (values[group] ?? match) as string,
    );
  } else {
    if (args.length === 0) {
      return template;
    }
    return template.replace(
      /{(\d+)}/g,
      (match, group) => {
        const idx = Number.parseInt(group);
        return Number.isNaN(idx) || idx < 0 || (idx >= args.length ? match : args[idx]);
      });
  }
}
