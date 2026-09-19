import type { Prettify } from '@/utils/typingUtils';
import type { TooltipProps, TooltipEmit } from './props';

import { computed, getCurrentInstance, onBeforeMount, onDeactivated, onMounted, readonly, ref, toRef, watch, provide } from 'vue';
import { isClient } from '@vueuse/core';

import { useId } from '@/composables/use-id';
import { useDelayedToggle } from '@/composables/use-delayed-toggle';
import { isFunction } from '@/utils/types';
import { hasOwn } from '@/utils/object';
import { TOOLTIP_ROOT_CONTEXT_KEY } from './utils';

export type CreateTooltipRootOptions = Prettify<
  Partial<Pick<TooltipProps, 'role' | 'visible' | 'disabled'>>
  & Pick<TooltipProps, 'showAfter' | 'hideAfter' | 'autoClose' | 'trigger'>
>;

export function createTooltipRoot(props: CreateTooltipRootOptions, emit: TooltipEmit) {
  const visibleRef = toRef(props, 'visible');

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
    if (props.disabled) return;

    const shouldEmit = hasVisibleHandler.value && isClient;

    if (shouldEmit) {
      emit('update:visible', true);
    }

    if (!isControlled() || !shouldEmit) {
      doShow(event);
    }
  };

  const hide = (event?: Event) => {
    if (props.disabled === true || !isClient) return;

    const shouldEmit = hasVisibleHandler.value && isClient;

    if (shouldEmit) {
      emit('update:visible', false);
    }

    if (!isControlled() || !shouldEmit) {
      doHide(event);
    }
  };

  const { open: onOpen, close: onClose } = useDelayedToggle({
    openDelay: toRef(props, 'showAfter'),
    closeDelay: toRef(props, 'hideAfter'),
    autoCloseDelay: toRef(props, 'autoClose'),
    onOpen: show,
    onClose: hide,
  });

  onMounted(() => {
    watch(
      visibleRef,
      (val) => {
        if (typeof val !== 'boolean') return;
        if (props.disabled && val) {
          if (hasVisibleHandler.value) {
            emit('update:visible', false);
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
    toRef(props, 'disabled'),
    (val) => {
      if (val && open.value) {
        open.value = false;
      }
      if (!val && typeof props.visible === 'boolean') {
        open.value = props.visible;
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
    role: computed(() => props.role ?? 'tooltip'),
    controlled: computed(() => typeof visibleRef.value === 'boolean' && !hasVisibleHandler.value),
    id: useId(),
    open: readonly(open),
    trigger: toRef(props, 'trigger'),
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
      emit('before-show', toggleReason.value);
    },
    onShow: () => {
      emit('show', toggleReason.value);
    },
    onHide: () => {
      emit('hide', toggleReason.value);
    },
    onBeforeHide: () => {
      emit('before-hide', toggleReason.value);
    },
  });

  return {
    onOpen,
    onClose,
    hide,
  };
}
