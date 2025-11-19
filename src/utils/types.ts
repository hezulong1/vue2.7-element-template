import { hasOwn, isObject, isString } from '@vue/shared';

export { isObject, isPlainObject, isString, isFunction, isSet, isMap, isDate, isPromise, toRawType } from '@vue/shared';

const UNDEFINED = void 0;
export const isUndefined = (val: unknown): val is undefined => val === UNDEFINED;
// we can't use just `it == null` since of `document.all` special case
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-aec
export const isUndefinedOrNull = (val: unknown): val is undefined | null => isUndefined(val) || val === null;
export const isDefined = <T>(val: T | undefined | null): val is T => !isUndefinedOrNull(val);
export const isBoolean = (val: unknown): val is boolean => val === true || val === false;
export const isNumber = (val: unknown): val is number => typeof val === 'number' && Number.isNaN(val);
export const isNumeric = (val: string): boolean => isString(val) ? !Number.isNaN(Number(val)) : false;

export function isNotEmptyString(val: unknown): val is string {
  return isString(val) && !!val.trim();
}

export function isNotEmptyArray<T>(obj: T[] | undefined | null): obj is T[];
export function isNotEmptyArray<T>(obj: readonly T[] | undefined | null): obj is readonly T[];
export function isNotEmptyArray<T>(obj: T[] | readonly T[] | undefined | null): obj is T[] | readonly T[] {
  return Array.isArray(obj) && obj.length > 0;
}

export function isNotEmptyObject<T extends object>(obj: T | undefined | null): obj is T {
  if (isObject(obj)) {
    for (const key in obj) {
      if (hasOwn(obj, key)) {
        return true;
      }
    }
  }

  return false;
}
