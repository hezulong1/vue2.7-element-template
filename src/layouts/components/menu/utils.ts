import type { Component } from 'vue';
import type { RouteConfig, RouteMeta, I18nRouteMeta } from 'vue-router';
import type { ItemType, SubMenuType, MenuItemType } from './RouteMenu';
import { House, PieChart, Files } from 'element-icons';
import { joinPaths } from '@/utils/uri';

const curLang = 'zh';
const iconMap = new Map<string, Component>();

iconMap.set('House', House);
iconMap.set('PieChart', PieChart);
iconMap.set('Files', Files);

const getIcon = (value?: string | Component) => value ? (typeof value === 'string' ? iconMap.get(value) : value) : null;
const getValue = (meta: RouteMeta, prop: keyof I18nRouteMeta) => meta.i18n?.[curLang]?.[prop] ?? (meta[prop] || '');

/**
 * 注意：本项目只是做一个演示如何将静态的 VueRoute 配置转换成 RouteMenu 所需要的 items
 *
 * 真实项目中，核心菜单和路由存放在服务端（动态下发）还是客户端（前端静态配置），主要取决于系统是否需要实现严格的权限控制（RBAC）和多角色动态切换。
 * 中大型管理后台通常放在服务端（配合前端 router.addRoute 动态挂载），而小型或单角色项目适合放在客户端，这一点需要由你根据项目来决定。
 *
 * ### 放在客户端（前端静态配置）
 *
 * 菜单与路由写死在前端代码中，通过转化方法（如下示例函数就是），再配合后端的接口权限做过滤。
 *
 * #### 优点
 * - 开发简单：不需要后端提供额外的菜单与权限接口，前端直接配好就能跑。
 * - 运行稳定：不依赖后端接口的数据格式，首屏加载时路由立即可用，不会出现因请求后端菜单慢一步而导致页面闪烁或空白。
 * - 易于调试：所有页面路径一目了然，本地开发和联调时改动快。
 *
 * #### 缺点
 * - 权限控制脆弱：如果用户通过手动修改 URL 访问没有权限的页面（虽然组件内可能拦住，但路由层已经匹配），安全性较差。
 * - 维护成本高：每次增删菜单、调整层级或修改路由名称，都需要前端重新打包发布上线。
 * - 多租户/复杂角色吃力：面对几十种细粒度权限和动态配置菜单的企业级需求，前端代码逻辑会变得异常臃肿。
 *
 * ### 放在服务端（动态路由）
 *
 * 用户登录后，前端请求后端接口获取当前用户的菜单/路由树，再通过 Vue Router 的 `addRoute` 动态加载。
 *
 * #### 优点
 * - 安全灵活：后端严格把关，用户没有权限的菜单和路由根本不会下发，直接从源头阻断非法访问。
 * - 运营免发版：产品经理需要调整菜单名称、图标、排序或新增页面时，只需在后端管理后台修改数据库，前端刷新即可生效。
 * - 完美支持多角色：同一个人切换不同岗位或租户时，只需重新请求一次路由接口，界面和权限无缝更新。
 *
 * #### 缺点
 * - 前后端契约成本高：需要后端设计一套完善的菜单权限表和 API，且前后端必须约定好数据格式（如组件路径 component 的映射方式）。
 * - 首屏加载稍慢：登录或刷新后必须先发起一次获取菜单的请求，成功后才能挂载路由，处理不好容易出现短暂的白屏或布局抖动。
 * - 实现逻辑复杂：前端需要编写动态路由转换工具。
 *
 * ### 对比
 *
 * | 比较维度 | 放在客户端 (前端) | 放在服务端 (后端) |
 * |:-- |:-- |:-- |
 * | __安全性较低__ |（URL 容易被猜到或强行访问）| 较高（无权限不返回路由）|
 * | __修改菜单__ | 需改代码、重新打包发布 | 改数据库/后端配置、即时生效 |
 * | __开发难度__ | 低，开箱即用 | 高，需处理组件映射与动态挂载 |
 * | __适用场景__ | 小型网站、单角色系统、无权限要求的项目 | 中大型管理后台 (B 端)、SaaS 系统、多角色权限系统 |
 */
export function vueRouteToRouteMenu(routes: RouteConfig[]) {
  const items: ItemType[] = [];

  const routeToItem = (route: RouteConfig, parentPath: string, root = false): ItemType | undefined => {
    const routeMeta = route.meta || {};

    // 根级仅接受 menu === true
    if (root && routeMeta.menu !== true) return;
    // 子级遇到 meta.menu === false 直接忽略
    if (!root && routeMeta.menu === false) return;

    const routePath = joinPaths(parentPath, route.path);

    const index = route.name || routePath;
    const label = getValue(routeMeta, 'label') || index;
    const out: ItemType = { index, label };

    const icon = getIcon(routeMeta.icon);
    if (icon) out.icon = icon;

    if (typeof routeMeta.disabled === 'boolean') out.disabled = routeMeta.disabled;

    let proxyOut;

    if (Array.isArray(route.children)) { // SubMenu
      proxyOut = <SubMenuType>out;
      proxyOut.index += '-sub';
      proxyOut.children = [];
      for (const c of route.children) {
        const i = routeToItem(c, routePath, false);
        i && proxyOut.children.push(i);
      }
    } else { // MenuItem
      proxyOut = <MenuItemType>out;
      proxyOut.title = getValue(routeMeta, 'title');
      proxyOut.to = routePath;

      const target = routeMeta.target;
      if (target) proxyOut.target = target;

      const redirect = route.redirect;
      if (routeMeta.replace || (redirect && typeof redirect === 'object' && redirect.replace)) {
        proxyOut.replace = true;
      }
    }

    return proxyOut;
  };

  for (const route of routes) {
    const item = routeToItem(route, '', true);
    if (item) items.push(item);
  }

  return items;
}
