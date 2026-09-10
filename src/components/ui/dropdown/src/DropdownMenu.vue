<script lang="tsx">
import type { PropType } from 'vue';

import { defineComponent, inject } from 'vue';
import { hasOwn } from '@/utils/object';
import { getEventCode, EVENT_CODE } from '@/utils/event';
import { composeRefs } from '@/utils/vue/refs';
import { cloneVNode, filterEmptyVNode } from '@/utils/vue/vdom';
import { DROPDOWN_CONTEXT_KEY } from './utils';
import { createRovingFocusGroup } from './roving-focus';

export default defineComponent({
  name: 'ElDropdownMenu',
  props: {
    onKeydown: Function as PropType<(e: KeyboardEvent) => void>,
  },
  setup(props, { slots }) {
    const dropdownContext = inject(DROPDOWN_CONTEXT_KEY, undefined)!;

    const {
      elRef,
      onBlur,
      onFocus,
      onMousedown,
      onKeydown,
    } = createRovingFocusGroup({
      loop: dropdownContext.loop,
      currentTabId: dropdownContext.currentTabId,
      onCurrentTabIdChange(id) {
        dropdownContext.setCurrentTabId(id.toString());
      },
    });

    const dropdownListWrapperRef = composeRefs(
      dropdownContext.contentRef,
      elRef,
    );

    function handleKeydown(e: KeyboardEvent) {
      props.onKeydown?.(e);

      const { currentTarget, target } = e;
      const code = getEventCode(e);

      const isKeydownContained = (currentTarget as Node).contains(target as Node);
      if (isKeydownContained) {
        // TODO: implement typeahead search
      }

      if (EVENT_CODE.tab === code) {
        return dropdownContext.handleClose();
      }

      onKeydown(e);
    }

    function handleFocus(e: FocusEvent) {
      if (dropdownContext.isUsingKeyboard.value) onFocus(e);
    }

    return () => {
      const children = filterEmptyVNode(slots.default?.());
      const vnodes = [];

      for (const child of children) {
        const propsData = (child.componentOptions?.propsData ?? {}) as { divided?: boolean };
        const isDivided = hasOwn(propsData, 'divided') && propsData.divided !== false;
        if (isDivided) {
          vnodes.push(<li class="el-dropdown-menu__item--divided" role="separator" />);
        }
        vnodes.push(cloneVNode(child));
      }

      return (
        <ul
          ref={dropdownListWrapperRef}
          class="el-dropdown-menu"
          tabindex="-1"
          role={dropdownContext.role.value}
          aria-labelledby={dropdownContext.triggerId.value}
          onFocusin={handleFocus}
          onFocusout={onBlur}
          v-on:keydown_self={handleKeydown}
          v-on:mousedown_self={onMousedown}
        >
          { vnodes }
        </ul>
      );
    };
  },
});
</script>
