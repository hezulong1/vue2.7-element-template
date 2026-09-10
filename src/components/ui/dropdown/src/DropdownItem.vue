<template>
  <li
    :id="`${id}`"
    ref="elRef"
    :class="{ 'el-dropdown-menu__item': true, 'is-disabled': disabled }"
    :tabindex="tabIndex"
    :role="role"
    :aria-label="`${disabled}`"
    v-bind="{ [COLLECTION_ITEM_SIGN]: true }"
    @click="handleClick"
    @focus="handleFocus"
    @keydown.self="handleKeydown"
    @mousedown="handleMousedown"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <span v-if="icon || $slots.icon" class="el-icon">
      <slot name="icon" :disabled="disabled">
        <component :is="icon" />
      </slot>
    </span>
    <slot />
  </li>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, inject, type PropType } from 'vue';
import { iconPropType } from '@/utils/vue/icon';
import { EVENT_CODE, getEventCode } from '@/utils/event';
import { DROPDOWN_CONTEXT_KEY, DROPDOWN_INSTANCE_CONTEXT_KEY } from './utils';
import { createRovingFocusItem, COLLECTION_ITEM_SIGN } from './roving-focus';

defineOptions({ name: 'ElDropdownItem' });

const props = defineProps({
  /**
   * @description a command to be dispatched to Dropdown's `command` callback
   */
  command: null as unknown as PropType<any>,
  /**
   * @description whether the item is disabled
   */
  disabled: Boolean,
  /**
   * @description whether a divider is displayed
   */
  divided: Boolean,
  textValue: String,
  /**
   * @description custom icon
   */
  icon: iconPropType,
});

const emit = defineEmits<{
  (type: 'click', evt: MouseEvent): void;
  (type: 'pointermove', evt: PointerEvent): void;
  (type: 'pointerleave', evt: PointerEvent): void;
  (type: 'mousedown', e: MouseEvent): void;
  (type: 'keydown', e: KeyboardEvent): void;
  (type: 'focus', e: FocusEvent): void;
}>();

const {
  id,
  elRef,
  tabIndex,
  handleMousedown,
  handleFocus,
  handleKeydown: _handleKeydown,
} = createRovingFocusItem({
  focusable: computed(() => !props.disabled),
  onMousedown(e) {
    emit('mousedown', e);
  },
  onKeydown(e) {
    emit('keydown', e);
  },
  onFocus(e) {
    emit('focus', e);
  },
});

const instance = getCurrentInstance()?.proxy;
const dropdownContext = inject(DROPDOWN_CONTEXT_KEY, undefined)!;
const dropdownInstanceContext = inject(DROPDOWN_INSTANCE_CONTEXT_KEY, undefined);

const role = computed<string>(() => {
  const { value: role } = dropdownContext.role;
  switch (role) {
    case 'menu': return 'menuitem';
    case 'navigation': return 'link';
    default: return 'button';
  }
});

function handlePointerMove(e: PointerEvent) {
  emit('pointermove', e);
  if (!e.defaultPrevented) {
    if (e.pointerType === 'mouse') {
      if (props.disabled) {
        dropdownContext.onItemLeave(e);
        return;
      }

      const target = e.currentTarget as HTMLElement;
      /**
       * This handles the following scenario:
       *   when the item contains a form element such as input element
       *   when the mouse is moving over the element itself which is contained by
       *   the item, the default focusing logic should be prevented so that
       *   it won't cause weird action.
       */
      if (target === document.activeElement || target.contains(document.activeElement)) return;

      dropdownContext.onItemEnter(e);

      if (!e.defaultPrevented) {
        target?.focus({ preventScroll: true });
      }
    }
  }
}

function handlePointerLeave(e: PointerEvent) {
  emit('pointerleave', e);
  if (!e.defaultPrevented) {
    if (e.pointerType === 'mouse') {
      dropdownContext.onItemLeave(e);
    }
  }
}

function handleKeydown(e: KeyboardEvent) {
  const code = getEventCode(e);
  if ([EVENT_CODE.enter, EVENT_CODE.numpadEnter, EVENT_CODE.space].includes(code)) {
    e.preventDefault();
    e.stopImmediatePropagation();
    doClick(e);
    return;
  }

  if (!e.shiftKey && EVENT_CODE.tab === code) {
    dropdownContext.handleClose();
    return;
  }

  _handleKeydown(e);
}

function handleClick(e: MouseEvent) {
  doClick(e as PointerEvent);
}

function doClick(e: PointerEvent | KeyboardEvent) {
  if (props.disabled) return;
  emit('click', e as PointerEvent);

  const shouldPrevent = e.type !== 'keydown' && e.defaultPrevented;
  if (!shouldPrevent) {
    if (props.disabled) {
      e.stopImmediatePropagation();
      return;
    }

    if (dropdownInstanceContext?.hideOnClick?.value) {
      dropdownInstanceContext.handleClick?.();
    }

    dropdownInstanceContext?.commandHandler?.(props.command, instance, e);
  }
}
</script>
