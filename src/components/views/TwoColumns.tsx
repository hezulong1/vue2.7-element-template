import type { PropType, StyleValue } from 'vue';
import type { FlexFull, FlexJustify } from 'element-ui';
import { defineComponent } from 'vue';

import { Flex } from 'element-ui';

export default defineComponent({
  functional: true,
  props: {
    justify: {
      type: String as PropType<FlexJustify>,
      default: 'between',
      validator: (value: string) => ['start', 'end', 'center', 'between', 'evenly', 'around'].includes(value),
    },
    full: Boolean as PropType<FlexFull>,
    startStyle: [String, Object] as PropType<StyleValue>,
    endStyle: [String, Object] as PropType<StyleValue>,
  },
  render(h, { props, data, slots }) {
    const $slots = slots();
    return (
      <Flex class="el-pro-two-columns" {...data} justify={props.justify} full={props.full}>
        <Flex class="start" items="center" style={props.startStyle}>
          { $slots.start }
        </Flex>

        <Flex class="end" items="center" style={props.endStyle}>
          { $slots.end }
        </Flex>
      </Flex>
    );
  },
});
