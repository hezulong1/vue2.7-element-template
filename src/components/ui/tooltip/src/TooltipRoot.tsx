import type { Arrayable } from '@vueuse/core';
import type { TooltipTriggerType } from './typings';

import { computed, getCurrentInstance, onBeforeMount, onDeactivated, onMounted, readonly, ref, toRef, watch } from 'vue';
import { isClient } from '@vueuse/core';

import { useId } from '@/composables/use-id';
import { useDelayedToggle } from '@/composables/use-delayed-toggle';
import { isFunction } from '@/utils/types';
import { hasOwn } from '@/utils/object';

import { provideTooltipRoot } from './composables';

export interface CreateTooltipRootOptions {
  role?: string;
  visible?: boolean;
  disabled?: boolean;
  showAfter: number;
  hideAfter: number;
  autoClose: number;
  trigger: Arrayable<TooltipTriggerType>;
}

export interface CreateTooltipRootEmits {
  (type: 'update:visible', value: boolean): void;
  (type: 'before-show', e?: Event): void;
  (type: 'before-hide', e?: Event): void;
  (type: 'show', e?: Event): void;
  (type: 'hide', e?: Event): void;
}

export function createTooltipRoot(props: CreateTooltipRootOptions, emit: CreateTooltipRootEmits) {
  const visibleRef = toRef(props, 'visible');

  const open = ref(false);
  const toggleReason = ref<Event>();

  const vm = getCurrentInstance()?.proxy;
  const isControlled = computed(() => {
    const propData = vm?.$options.propsData;
    return propData ? hasOwn(propData, 'visible') : false;
  });
  const hasUpdateHandler = computed(() => isFunction(vm?.$listeners['update:visible']));

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

    const shouldEmit = hasUpdateHandler.value && isClient;

    if (shouldEmit) {
      emit('update:visible', true);
    }

    if (!isControlled.value || !shouldEmit) {
      doShow(event);
    }
  };

  const hide = (event?: Event) => {
    if (props.disabled === true || !isClient) return;

    const shouldEmit = hasUpdateHandler.value && isClient;

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
          if (hasUpdateHandler.value) {
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
    controlled: computed(() => typeof visibleRef.value === 'boolean' && !hasUpdateHandler.value),
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
