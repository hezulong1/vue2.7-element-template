<script lang="ts">
import type { PropType } from 'vue';
import type { FlexItems, FlexJustify } from './typings';

import { defineComponent } from 'vue';

export default defineComponent({
  functional: true,
  props: {
    tag: {
      type: String,
      default: 'div',
    },
    inline: Boolean,
    vertical: Boolean,
    reverse: Boolean,
    center: Boolean,
    wrap: Boolean,
    justify: {
      type: String as PropType<FlexJustify>,
      validator: (value: string) => ['start', 'end', 'center', 'between', 'evenly', 'around'].includes(value),
    },
    items: {
      type: String as PropType<FlexItems>,
      validator: (value: string) => ['start', 'end', 'center'].includes(value),
    },
  },
  render(h, { props, data, children }) {
    const classNames = ['el-flex'];

    if (props.inline) classNames.push('el-flex--inline');
    if (props.vertical) classNames.push('el-flex--vertical');
    if (props.reverse) classNames.push('el-flex--reverse');
    if (props.wrap) classNames.push('el-flex--wrap');

    if (props.center) {
      classNames.push('el-flex--justify-center', 'el-flex--items-center');
    } else {
      if (props.justify) {
        classNames.push(`el-flex--justify-${props.justify}`);
      }

      if (props.items) {
        classNames.push(`el-flex--items-${props.items}`);
      }
    }

    data.class = [data.class, ...classNames];

    return h(props.tag, data, children);
  },
});
</script>
