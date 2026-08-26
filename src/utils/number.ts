export function looseToNumber(val: string) {
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? val : n;
}
