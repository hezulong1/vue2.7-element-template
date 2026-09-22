export function looseToNumber(val: string) {
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? val : n;
}

/**
 * @param n 值
 * @param decimals 精度，默认为 0
 */
export function roundFloat(n: number, decimals = 0) {
  n = Number(n.toString() + 'e' + decimals.toString());
  return Number(Math.round(n) + 'e-' + decimals);
}
