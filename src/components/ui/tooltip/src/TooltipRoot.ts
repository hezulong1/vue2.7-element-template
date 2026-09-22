import type { Arrayable, MaybeRefOrGetter } from '@vueuse/core';
import type { TooltipRoleType, TooltipTriggerType } from './typings';
import type { TooltipEmit } from './props';

import { computed, getCurrentInstance, onBeforeMount, onDeactivated, onMounted, readonly, ref, watch, provide } from 'vue';
import { isClient, toValue } from '@vueuse/core';
import { useId } from '@/composables/use-id';
import { useDelayedToggle } from '@/composables/use-delayed-toggle';
import { isFunction } from '@/utils/types';
import { hasOwn } from '@/utils/object';
import { TOOLTIP_ROOT_CONTEXT_KEY } from './utils';

export interface CreateTooltipRootOptions {
  /**
   * Defaults to `'tooltip'`
   */
  role?: MaybeRefOrGetter<TooltipRoleType | undefined>;
  /**
   * Defaults to `[]`
   */
  trigger?: MaybeRefOrGetter<Arrayable<TooltipTriggerType> | undefined>;
  /**
   * Defaults to `undefined`
   */
  visible?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Defaults to `false`
   */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Defaults to `0`
   */
  showAfter?: MaybeRefOrGetter<number | undefined>;
  /**
   * Defaults to `0`
   */
  hideAfter?: MaybeRefOrGetter<number | undefined>;
  /**
   * Defaults to `0`
   */
  autoClose?: MaybeRefOrGetter<number | undefined>;
  onUpdateVisible?: (visible: boolean) => void;
  onBeforeShow?: (e?: Event) => void;
  onBeforeHide?: (e?: Event) => void;
  onShow?: (e?: Event) => void;
  onHide?: (e?: Event) => void;
}

export function createTooltipRoot(props: CreateTooltipRootOptions, emit?: TooltipEmit) {
  const visibleRef = computed(() => toValue(props.visible));
  const disabledRef = computed(() => toValue(props.disabled) ?? false);

  const open = ref(false);
  const toggleReason = ref<Event>();

  const vm = getCurrentInstance()?.proxy;
  const isControlled = () => {
    const propData = vm?.$options.propsData;
    // Plus 中 visible 是 boolean 值才算受控
    // 这里 visible 只要在组件上配置了算受控，即包括 undefined
    // TODO 也许需要和 Plus 保持一致
    return propData ? hasOwn(propData, 'visible') : false;
  };
  const hasVisibleHandler = computed(() => isFunction(vm?.$listeners['update:visible']));

  const keyboardActions = new Set(['keydown', 'keyup', 'keypress']);
  const isUsingKeyboard = computed(() => {
    const type = toggleReason.value?.type;
    if (!type) return false;
    return keyboardActions.has(type);
  });
  const doShow = (event?: Event) => {
    if (open.value === true) return;
    open.value = true;
    toggleReason.value = event;
  };

  const doHide = (event?: Event) => {
    if (open.value === false) return;
    open.value = false;
    toggleReason.value = event;
  };

  const show = (event?: Event) => {
    if (disabledRef.value) return;

    const shouldEmit = hasVisibleHandler.value && isClient;

    if (shouldEmit) {
      props.onUpdateVisible?.(true);
      emit?.('update:visible', true);
    }

    if (!isControlled() || !shouldEmit) {
      doShow(event);
    }
  };

  const hide = (event?: Event) => {
    if (disabledRef.value === true || !isClient) return;

    const shouldEmit = hasVisibleHandler.value && isClient;

    if (shouldEmit) {
      props.onUpdateVisible?.(false);
      emit?.('update:visible', false);
    }

    if (!isControlled() || !shouldEmit) {
      doHide(event);
    }
  };

  const { open: onOpen, close: onClose } = useDelayedToggle({
    openDelay: computed(() => toValue(props.showAfter)),
    closeDelay: computed(() => toValue(props.hideAfter)),
    autoCloseDelay: computed(() => toValue(props.autoClose)),
    onOpen: show,
    onClose: hide,
  });

  onMounted(() => {
    watch(
      visibleRef,
      (val) => {
        if (typeof val !== 'boolean') return;
        if (disabledRef.value && val) {
          if (hasVisibleHandler.value) {
            props.onUpdateVisible?.(false);
            emit?.('update:visible', false);
          }
        } else if (open.value !== val) {
          if (val) {
            doShow();
          } else {
            doHide();
          }
        }
      },
      { immediate: true },
    );
  });

  watch(
    disabledRef,
    (val) => {
      if (val && open.value) {
        open.value = false;
      }
      if (!val && typeof visibleRef.value === 'boolean') {
        open.value = visibleRef.value;
      }
    },
  );

  onDeactivated(() => {
    open.value && hide();
  });

  onBeforeMount(() => {
    toggleReason.value = undefined;
  });

  provide(TOOLTIP_ROOT_CONTEXT_KEY, {
    triggerEl: ref(),
    contentEl: ref(),
    popperInstanceRef: ref(),
    role: computed(() => toValue(props.role) ?? 'tooltip'),
    controlled: computed(() => typeof visibleRef.value === 'boolean' && !hasVisibleHandler.value),
    id: useId(),
    open: readonly(open),
    trigger: computed(() => toValue(props.trigger) ?? []),
    isUsingKeyboard,
    onOpen,
    onClose,
    onToggle: (event?: Event) => {
      if (open.value) {
        onClose(event);
      } else {
        onOpen(event);
      }
    },

    onBeforeShow: () => {
      props.onBeforeShow?.(toggleReason.value);
      emit?.('before-show', toggleReason.value);
    },
    onShow: () => {
      props.onShow?.(toggleReason.value);
      emit?.('show', toggleReason.value);
    },
    onHide: () => {
      props.onHide?.(toggleReason.value);
      emit?.('hide', toggleReason.value);
    },
    onBeforeHide: () => {
      props.onBeforeHide?.(toggleReason.value);
      emit?.('before-hide', toggleReason.value);
    },
  });

  return {
    onOpen,
    onClose,
    hide,
  };
}
