export const EXTERNAL_URL_RE = /^(?:[a-z]+:|\/\/)/i;

export function isExternalUrl(path: string): boolean {
  return EXTERNAL_URL_RE.test(path);
}

export function getUrlParams(search = location.href) {
  const index = search.indexOf('?');
  const raw = search.slice(index + 1);
  return ~index ? Object.fromEntries(new URLSearchParams(raw)) : {};
}

/**
 * @example
 * input: { name:'jack', sex:undefined, score:0, age: 18, like: [] }
 * output: `name=jack&score=0&age=18&like=`
 */
export function objectToUrl(obj: Record<string, any>) {
  const arr = Object.keys(obj).map((key) => {
    if (obj[key] == null) return '';
    return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
  }).filter(Boolean);
  return arr.join('&');
}

/**
 * 拼接多个 URL Path
 *
 * 处理规则：
 * 1. 支持传入任意数量的字符串参数
 * 2. 自动去除每个参数首尾的空格
 * 3. 自动将连续的 "/" 合并成一个 "/"
 * 4. 自动去除 "/" 两边多余的空格
 * 5. 每一段路径首尾的 "/" 会被去除
 * 6. 最终结果统一以 "/" 开头
 * 7. 如果所有参数都是空字符串或空格，则返回 ""
 * 8. 如果所有参数都是 "/"，则返回 "/"
 *
 * @example
 * joinPaths('////a/', 'jjj/')
 * // => '/a/jjj'
 *
 * @example
 * joinPaths('////a/b c////j/k/  oo/', 'jjj/')
 * // => '/a/b c/j/k/oo/jjj'
 *
 * @example
 * joinPaths('////a     ', '   jjj/   ')
 * // => '/a/jjj'
 *
 * @example
 * joinPaths(' ', '     ')
 * // => ''
 *
 * @example
 * joinPaths('/', '/////', '/')
 * // => '/'
 */
export function joinPaths(...paths: string[]) {
  // 处理每一个路径
  const parts = paths
    // 去除每个路径首尾的空格
    .map(path => path.trim())

    // 将连续的 "/" 以及 "/" 两边的空格统一处理成一个 "/"
    //
    // 例如：
    // "////a/b c////j/k/  oo/"
    // ↓
    // "/a/b c/j/k/oo/"
    .map(path => path.replace(/\s*\/+\s*/g, '/'))

    // 去除每一段路径首尾多余的 "/"
    //
    // 例如：
    // "/a/"       → "a"
    // "////a////" → "a"
    .map(path => path.replace(/^\/+|\/+$/g, ''))

    // 过滤掉处理后为空的路径
    .filter(Boolean);

  // 如果存在有效的路径内容
  if (parts.length > 0) {
    // 使用 "/" 将所有路径拼接起来
    // 例如：
    // ["a", "b", "c"] → "/a/b/c"
    return '/' + parts.join('/');
  }

  // 如果没有有效路径，但参数中存在 "/"，
  // 说明用户传入的是根路径
  //
  // 例如：
  // joinPaths('/', '/////', '/') → '/'
  if (paths.some(path => /^\/+$/.test(path.trim()))) {
    return '/';
  }

  // 所有参数都是空字符串或者空格
  //
  // 例如：
  // joinPaths(' ', '     ') → ''
  return '';
}

export function Path(strList: TemplateStringsArray, ...values: string[]) {
  return joinPaths(strList.reduce((result, string, index) => result + string + (values[index] || ''), ''));
}
