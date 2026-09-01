import type { Component, InjectionKey, PropType, Ref, StyleValue } from 'vue';

import './RouteMenu.scss';

import { computed, defineComponent, h, inject, nextTick, provide, reactive, readonly, ref, toRef, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router/composables';
import { createTooltipRoot, tooltipEmit, TooltipContent, TooltipTrigger, Scrollbar } from 'element-ui';
import { ArrowRight } from 'element-icons';
import ElCollapseTransition from '@/components/base/CollapseTransition.vue';
import { isNotEmptyArray } from '@/utils/types';
import { addUnit } from '@/utils/dom';
import { isExternalUrl } from '@/utils/uri';
import { ensurePrefix } from '@/utils/string';
import { warn } from '@/utils/debug';

// Utils
// ----------------------------------------

export type MenuKey = string | number;

export interface MenuItemType {
  index: MenuKey;
  label?: string;
  icon?: Component;
  disabled?: boolean;

  title?: string;

  /**
   * VueRouter 路由目标地址，仅支持字符串
   */
  to?: string;
  /**
   * VueRouter 中的 `replace` 方法
   */
  replace?: boolean;
  /**
   * 取 `a` 标签和 `window.open` 支持的公共值，在 `a` 标签上还支持 "_unfencedTop" 值
   *
   * - `a` 标签：{@link https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/a#target}
   * - `window.open` 方法：{@link https://developer.mozilla.org/zh-CN/docs/Web/API/Window/open#target}
   *
   *
   */
  target?: '_blank' | '_self' | '_top' | '_parent';
}

export interface SubMenuType {
  index: MenuKey;
  label?: string;
  icon?: Component;
  disabled?: boolean;

  children?: ItemType[];
}

export type ItemType = MenuItemType | SubMenuType;

interface RootMenuContext {
  collapse: Ref<boolean>;
  activeIndex: Readonly<Ref<MenuKey>>;
  activeIndexPath: Ref<MenuKey[]>;
  openedIndexPath: Ref<MenuKey[]>;
}

interface SubMenuContext {
  disabled: Readonly<Ref<boolean>>;
  keyPath: Ref<MenuKey[]>;
  closeMenu: () => void;
}

const rootMenuContextKey = Symbol('el-pro-menu-root') as InjectionKey<RootMenuContext>;
const subMenuContextKey = Symbol('el-pro-menu-sub') as InjectionKey<SubMenuContext>;

const isSubMenu = (item: ItemType): item is SubMenuType => isNotEmptyArray((item as SubMenuType).children);

function useRootMenu() {
  return inject(rootMenuContextKey)!;
}

interface UseSubMenuOptions {
  index: MenuKey;
  disabled?: boolean;
}

const useSubMenuOptions = {
  index: { type: [String, Number] as PropType<MenuKey>, required: true },
  disabled: Boolean,
} as const;

function useSubMenu(opts: UseSubMenuOptions) {
  const subMenu = inject(subMenuContextKey, undefined);

  const disabled = computed(() => Boolean(opts.disabled ?? (subMenu?.disabled.value)));
  const keyPath = computed(() => [...(subMenu?.keyPath.value ?? []), opts.index]);
  const level = computed(() => keyPath.value.length);
  const isFirstLevel = computed(() => level.value === 1);
  const paddingStyle = computed(() => ({ paddingLeft: isFirstLevel.value ? undefined : addUnit(16 * (level.value - 1)) } as StyleValue));

  function closeSubMenu() {
    subMenu?.closeMenu();
  }

  return {
    disabled,
    keyPath,
    level,
    isFirstLevel,
    paddingStyle,
    // isSelected,
    // isOpened,
    closeSubMenu,
  };
}

// Components
// ----------------------------------------

const MenuItem = defineComponent({
  name: 'ElProMenuItem',
  props: useSubMenuOptions,
  setup(props, { emit, slots }) {
    const rootMenu = useRootMenu();
    const {
      disabled,
      keyPath,
      isFirstLevel,
      paddingStyle,
      closeSubMenu,
    } = useSubMenu(props);

    const isSelected = computed(() => rootMenu.activeIndex.value === props.index);

    watchEffect(() => {
      if (isSelected.value) {
        rootMenu.activeIndexPath.value = keyPath.value.slice(0);
      }
    }, { flush: 'post' });

    function handleClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();

      if (disabled.value) return;
      closeSubMenu();

      emit('click', event);
    }

    function handleMouseenter(event: MouseEvent) {
      if (isFirstLevel.value) emit('mouseenter', event);
    }

    function handleMouseleave(event: MouseEvent) {
      emit('mouseleave', event);
    }

    return () => (
      <li
        class={{
          'el-route-menu-item': true,
          'is-disabled': disabled.value,
          'is-selected': isSelected.value,
        }}
        data-menu-key={props.index}
        role="menuitem"
        tabindex="-1"
        style={paddingStyle.value}
        on-click={handleClick}
        on-mouseenter={handleMouseenter}
        on-mouseleave={handleMouseleave}
      >
        { slots.default?.() }
      </li>
    );
  },
});

const SubMenu = defineComponent({
  name: 'ElRouteMenuSub',
  props: useSubMenuOptions,
  setup(props, { emit, slots }) {
    const rootMenu = useRootMenu();
    const {
      disabled,
      keyPath,
      isFirstLevel,
      paddingStyle,
      closeSubMenu,
    } = useSubMenu(props);

    const opened = computed(() => rootMenu.openedIndexPath.value.includes(props.index));
    const iconStyle = computed(() => {
      const s: StyleValue = {};
      if (!rootMenu.collapse.value) {
        s.transform = `translateY(-50%) rotateZ(${ opened.value ? 270 : 90 }deg)`;
      }
      return s;
    });
    const { onClose: closePopup } = createTooltipRoot(reactive({
      disabled,
      role: 'menu',
      trigger: 'hover',
      showAfter: 280,
      hideAfter: 100,
      autoClose: 0,
    }), emit);

    provide(subMenuContextKey, {
      disabled,
      keyPath,
      closeMenu: () => {
        closePopup();
        closeSubMenu();
      },
    });

    function handleClick(e: MouseEvent) {
      if (disabled.value) return;
      emit('click', e);
    }

    return () => {
      const titleTag = [
        slots.title?.(),
        <span class="el-route-menu-sub__arrow el-icon" style={iconStyle.value}><ArrowRight /></span>,
      ];

      const overflowPadding = 6;
      const maxHeight = window.innerHeight - overflowPadding * 2 - /* container border */ 2;

      const child = rootMenu.collapse.value
        ? [
            (
              <TooltipTrigger>
                <div class="el-route-menu-sub__title" style={paddingStyle.value}>
                  { titleTag }
                </div>
              </TooltipTrigger>
            ),
            (
              <TooltipContent
                effect="light"
                pure={true}
                showArrow={false}
                persistent={true}
                placement="right-start"
                fallbackPlacements={[
                  'right-start',
                  'right',
                  'right-end',
                  'left-start',
                  'bottom-start',
                  'bottom-end',
                  'top-start',
                  'top-end',
                ]}
                teleported={isFirstLevel.value}
                popperClass="el-route-menu-sub__popper"
                offset={[-5, 2]}
                popperOptions={{
                  modifiers: [{ name: 'preventOverflow', options: { padding: overflowPadding } }],
                }}
              >
                <Scrollbar tag="ul" maxHeight={maxHeight} viewClass="el-route-menu-sub__poper-children el-route-menu el-route-menu--submenu">
                  { slots.default?.() }
                </Scrollbar>
              </TooltipContent>
            ),
          ]
        : [
            (
              <div class="el-route-menu-sub__title" onClick={handleClick}>
                { titleTag }
              </div>
            ),
            (
              <ElCollapseTransition fade>
                <ul v-show={opened.value} class="el-route-menu-sub__children el-route-menu el-route-menu--submenu" role="menu">
                  { slots.default?.() }
                </ul>
              </ElCollapseTransition>
            ),
          ];

      return (
        <li
          class={{
            'el-route-menu-sub': true,
            'is-disabled': disabled.value,
            'is-selected': rootMenu.activeIndexPath.value.includes(props.index),
            'is-opened': opened.value,
          }}
          data-menu-key={props.index}
          role="menuitem"
          aria-haspopup={rootMenu.collapse.value ? 'true' : undefined}
          aria-expanded={opened.value}
        >
          { child }
        </li>
      );
    };
  },
});

export const RouteMenu = defineComponent({
  name: 'ElRouteMenu',
  props: {
    items: Array as PropType<ItemType[]>,
    activeIndex: [String, Number] as PropType<MenuKey>,
    collapse: Boolean,
    openedIndexPath: Array as PropType<MenuKey[]>,
  },
  emits: {
    ...tooltipEmit,
    'select': (item: ItemType, indexPath: MenuKey[]) => true,
    'update:active-index': (value: MenuKey | undefined) => true,
  },
  setup(props, { emit }) {
    const router = useRouter();
    const route = useRoute();

    const activeIndexRef = ref(typeof props.activeIndex !== 'undefined' ? props.activeIndex : route.fullPath);
    const activeIndexPathRef = ref([activeIndexRef.value]);
    const openedIndexPathRef = ref(props.collapse ? [] : (typeof props.openedIndexPath !== 'undefined') ? props.openedIndexPath.slice(0) : route.fullPath.split('/'));

    const itemTipTrigger = ref<HTMLLIElement>();
    const itemTipContent = ref('');
    const itemTipControl = createTooltipRoot(reactive({
      trigger: 'hover',
      showAfter: 500,
      hideAfter: 100,
      autoClose: 0,
    }), emit);

    watch(activeIndexRef, () => {
      emit('update:active-index', activeIndexRef.value);
    });

    watchEffect(() => {
      if (props.collapse) openedIndexPathRef.value = [];
      if (props.items) findActiveItem(props.items);
    }, { flush: 'post' });

    provide(rootMenuContextKey, {
      activeIndex: readonly(activeIndexRef),
      activeIndexPath: activeIndexPathRef,
      collapse: toRef(props, 'collapse'),
      openedIndexPath: openedIndexPathRef,
    });

    function findActiveItem(rootItems: ItemType[]) {
      const currentPath = route.fullPath;

      type Stack = Array<{ items: ItemType[]; indexPath: MenuKey[] }>;
      const stack: Stack = [{ items: rootItems, indexPath: [] }];

      while (stack.length) {
        const { items, indexPath } = stack.pop()!;
        for (const i of items) {
          if (isSubMenu(i)) {
            stack.push({
              items: i.children!,
              indexPath: [...indexPath, i.index],
            });
          } else {
            const itemPath = i.to || ensurePrefix('/', i.index.toString());
            if (currentPath === itemPath) {
              activeIndexRef.value = i.index;
              activeIndexPathRef.value = indexPath.slice(0);
              // 为了动画效果，如果不需要，可移除 nextTick
              nextTick(() => {
                openedIndexPathRef.value = indexPath.slice(0);
              });
              return;
            }
          }
        }
      }
    }

    function renderItems(items: ItemType[] | undefined, parentIndexPath: MenuKey[] = []) {
      const renderContent = (item: ItemType) => {
        const vnodes = [];
        const iconVnode = (<span class="el-route-menu-item__icon el-icon">{ h(item.icon) }</span>);

        props.collapse
          // 折叠菜单：按需渲染图标
          ? item.icon && vnodes.push(iconVnode)
          // 展开菜单：必须渲染图标
          : vnodes.push(iconVnode);

        vnodes.push(<span class="el-route-menu-item__content">{ item.label }</span>);

        return vnodes;
      };

      const renderMenuItem = (item: MenuItemType) => {
        let href = item.to ?? ensurePrefix('/', item.index.toString());
        let target = item.target ?? (isExternalUrl(href) ? '_blank' : undefined);

        ({ href } = router.resolve(href, router.currentRoute));

        return (
          <MenuItem
            index={item.index}
            disabled={item.disabled}
            on-click={() => {
              if (!item.to || item.to === route.fullPath) return;

              const done = () => {
                activeIndexRef.value = item.index;
                activeIndexPathRef.value = [...parentIndexPath, item.index];
                emit('select', item, activeIndexPathRef.value);
              };

              if (item.target) {
                window.open(href, item.target);
                done();
              } else {
                router[item.replace ? 'replace' : 'push'](item.to)
                  // TODO 处理路由问题
                  .catch(warn)
                  .finally(done);
              }
            }}
            on-mouseenter={(event: MouseEvent) => {
              if (!props.collapse) return;

              const content = item.title || (typeof item.label === 'string' ? item.label : '');
              if (!content) return;

              itemTipContent.value = content;
              itemTipTrigger.value = event.target as HTMLLIElement;
              itemTipControl.onOpen(event);
            }}
            on-mouseleave={(event: MouseEvent) => {
              itemTipControl.onClose(event);
            }}
          >
            <a href={href} target={target} on-click-stop>
              { renderContent(item) }
            </a>
          </MenuItem>
        );
      };

      const renderSubMenu = (item: SubMenuType) => {
        const indexPath = [...parentIndexPath, item.index];
        return (
          <SubMenu
            index={item.index}
            disabled={item.disabled}
            on-click={() => {
              const i = openedIndexPathRef.value.indexOf(item.index);
              if (i > -1) openedIndexPathRef.value.splice(i, 1);
              else openedIndexPathRef.value.push(item.index);
            }}
          >
            <template slot="title">
              { renderContent(item) }
            </template>
            { renderItems(item.children, indexPath) }
          </SubMenu>
        );
      };

      return isNotEmptyArray(items) ? items.map(item => isSubMenu(item) ? renderSubMenu(item) : renderMenuItem(item)) : null;
    }

    return () => (
      <div>
        <ul class={{ 'el-route-menu': true, 'el-route-menu--root': true, 'el-route-menu--collapse': props.collapse }}>
          { renderItems(props.items) }
        </ul>
        {
          props.collapse && itemTipTrigger.value && (
            <TooltipContent
              enterable={false}
              offset={7}
              effect="light"
              placement="right"
              fallbackPlacements={['left']}
              showArrow
              persistent
              virtualTriggering={true}
              referenceEl={itemTipTrigger.value}
              popperOptions={{
                modifiers: [
                  {
                    name: 'computeStyles',
                    options: {
                      adaptive: false,
                      enabled: false,
                    },
                  },
                ],
              }}
            >
              { itemTipContent.value }
            </TooltipContent>
          )
        }
      </div>
    );
  },
});
