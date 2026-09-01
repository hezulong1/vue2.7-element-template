<script lang="tsx">
import type { PropType, StyleValue } from 'vue';
import type { Placement } from '@popperjs/core';

import { defineComponent, provide, reactive, toRef } from 'vue';
import { placements } from '@popperjs/core';
import { filterEmptyVNode, cloneVNode, isVNode } from '@/utils/vue/vdom';
import { tooltipContentProps, Tooltip as ElTooltip, type TooltipEffect } from '../../tooltip';
import { avatarGroupContextKey, type AvatarShape, type AvatarSize } from './utils';
import ElAvatar from './Avatar.vue';

export default defineComponent({
  name: 'ElAvatarGroup',
  props: {
    /**
     * @description control the size of avatars in this avatar-group
     */
    size: [Number, String] as PropType<AvatarSize>,
    /**
     * @description control the shape of avatars in this avatar-group
     */
    shape: {
      type: String as PropType<AvatarShape>,
      validator: (val: string) => ['circle', 'square'].includes(val),
    },
    /**
     * @description whether to collapse avatars
     */
    collapseAvatars: Boolean,
    /**
     * @description whether show all collapsed avatars when mouse hover text of the collapse-avatar. To use this, `collapse-avatars` must be true
     */
    collapseAvatarsTooltip: Boolean,
    /**
     * @description the max avatars number to be shown. To use this, `collapse-avatars` must be true
     */
    maxCollapseAvatars: {
      type: Number,
      default: 1,
    },
    /**
     * @description tooltip theme, built-in theme: `dark` / `light`
     */
    effect: {
      type: String as PropType<TooltipEffect>,
      default: 'light',
    },
    /**
     * @description placement of tooltip
     */
    placement: {
      type: String as PropType<Placement>,
      validator: (v: any): v is Placement => placements.includes(v),
      default: 'top',
    },
    /**
     * @description custom class name for tooltip
     */
    popperClass: tooltipContentProps.popperClass,
    /**
     * @description custom style for tooltip
     */
    popperStyle: tooltipContentProps.popperStyle,
    /**
     * @description custom class name for the collapse-avatar
     */
    collapseClass: null as unknown as PropType<any>,
    /**
     * @description custom style for the collapse-avatar
     */
    collapseStyle: null as unknown as PropType<StyleValue>,
  },
  setup(props, { slots }) {
    const context = reactive({
      size: toRef(props, 'size'),
      shape: toRef(props, 'shape'),
    });

    provide(
      avatarGroupContextKey,
      context,
    );

    return () => {
      const avatars = filterEmptyVNode(slots.default?.());
      let visibleAvatars = avatars;

      const showCollapseAvatar = props.collapseAvatars && avatars.length > props.maxCollapseAvatars;

      if (showCollapseAvatar) {
        visibleAvatars = avatars.slice(0, props.maxCollapseAvatars);
        const hiddenAvatars = avatars.slice(props.maxCollapseAvatars);

        visibleAvatars.push(
          <ElTooltip
            popperClass={props.popperClass}
            popperStyle={props.popperStyle}
            placement={props.placement}
            effect={props.effect}
            disabled={!props.collapseAvatarsTooltip}
            showAfter={300}
            hideAfter={100}
            pure
          >
            <ElAvatar
              size={props.size}
              shape={props.shape}
              class={props.collapseClass}
              style={props.collapseStyle}
            >
              +
              { ' ' }
              { hiddenAvatars.length }
            </ElAvatar>

            <div slot="content" class="el-avatar-group__collapse-avatars">
              { hiddenAvatars.map((node, idx) => isVNode(node) ? cloneVNode(node, { key: String(node.key ?? idx) }) : node) }
            </div>
          </ElTooltip>,
        );
      }

      return <div class="el-avatar-group">{ visibleAvatars }</div>;
    };
  },
});
</script>
