import type { TooltipProps, TooltipEmit } from './props';

import { computed, getCurrentInstance, onBeforeMount, onDeactivated, onMounted, readonly, ref, toRef, watch } from 'vue';
import { isClient } from '@vueuse/core';

import { useId } from '@/composables/use-id';
import { useDelayedToggle } from '@/composables/use-delayed-toggle';
import { isFunction } from '@/utils/types';
import { hasOwn } from '@/utils/object';

import { provideTooltipRoot } from './composables';

export function createTooltipRoot(props: TooltipProps, emit: TooltipEmit) {
  const visibleRef = toRef(props, 'visible');

  const open = ref(false);
  const toggleReason = ref<Event>();

  const vm = getCurrentInstance()?.proxy;
  const isControlled = computed(() => {
    const propData = vm?.$options.propsData;
    return propData ? hasOwn(propData, 'visible') : false;
  });
  const hasUpdateVisibleHandler = computed(() => isFunction(vm?.$listeners['update:visible']));

  const doShow = (event?: Event) => {
    if (open.value === true) return;
    open.value = true;

    if (toggleReason.value) {
      toggleReason.value = event;
    }
  };

  const doHide = (event?: Event) => {
    if (open.value === false) return;
    open.value = false;

    if (toggleReason.value) {
      toggleReason.value = event;
    }
  };

  const show = (event?: Event) => {
    if (props.disabled) return;

    const shouldEmit = hasUpdateVisibleHandler.value && isClient;

    if (shouldEmit) {
      emit('update:visible', true);
    }

    if (!isControlled.value || !shouldEmit) {
      doShow(event);
    }
  };

  const hide = (event?: Event) => {
    if (props.disabled === true || !isClient) return;

    const shouldEmit = hasUpdateVisibleHandler.value && isClient;

    if (shouldEmit) {
      emit('update:visible', false);
    }

    if (!isControlled.value || !shouldEmit) {
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
      (val: boolean | undefined) => {
        if (typeof val !== 'boolean') return;
        if (props.disabled && val) {
          if (hasUpdateVisibleHandler.value) {
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

  provideTooltipRoot({
    triggerEl: ref(),
    contentEl: ref(),
    popperInstanceRef: ref(),
    role: computed(() => props.role ?? 'tooltip'),
    controlled: computed(() => typeof visibleRef.value === 'boolean' && !hasUpdateVisibleHandler.value),
    id: useId(),
    open: readonly(open),
    trigger: toRef(props, 'trigger'),
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
