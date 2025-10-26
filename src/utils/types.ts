import { hasOwn, isObject, isString } from '@vue/shared';

export { isObject, isPlainObject, isString, isFunction, isSet, isMap, isDate, isPromise, toRawType } from '@vue/shared';

export const isUndefined = (val: unknown): val is undefined => val === void 0;
export const isUndefinedOrNull = (val: unknown): val is undefined | null => isUndefined(val) || val === null;
// export const isDefined = <T>(val: T | undefined | null): val is T => !isUndefinedOrNull(val);
export const isBoolean = (val: unknown): val is boolean => val === true || val === false;
export const isNumber = (val: unknown): val is number => typeof val === 'number';

export const isNumeric = (val: string): boolean => isString(val) ? !Number.isNaN(Number(val)) : false;

export function isSafeNumber(val: unknown): val is number {
  return isNumber(val) && val <= Number.MAX_SAFE_INTEGER && val >= Number.MIN_SAFE_INTEGER;
}

export function isNonEmptyString(val: unknown): val is string {
  return isString(val) && !!val.trim();
}

export function isNonEmptyArray<T>(obj: T[] | undefined | null): obj is T[];
export function isNonEmptyArray<T>(obj: readonly T[] | undefined | null): obj is readonly T[];
export function isNonEmptyArray<T>(obj: T[] | readonly T[] | undefined | null): obj is T[] | readonly T[] {
  return Array.isArray(obj) && obj.length > 0;
}

export function isNonEmptyObject<T extends object>(obj: T | undefined | null): obj is T {
  if (isObject(obj)) {
    for (const key in obj) {
      if (hasOwn(obj, key)) {
        return true;
      }
    }
  }

  return false;
}
