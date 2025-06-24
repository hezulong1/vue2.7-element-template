<script lang="ts">
import { defineComponent } from 'vue';

type RendererElement = any;

export default defineComponent({
  functional: true,
  render(h, { children }) {
    const reset = (el: RendererElement) => {
      el.style.maxHeight = '';
      el.style.overflow = el.dataset.oldOverflow;
      el.style.paddingTop = el.dataset.oldPaddingTop;
      el.style.paddingBottom = el.dataset.oldPaddingBottom;
    };

    const data = {
      props: {
        name: 'el-collapse-transition',
      },
      on: {
        beforeEnter(el: RendererElement) {
          if (!el.dataset) el.dataset = {};

          el.dataset.oldPaddingTop = el.style.paddingTop;
          el.dataset.oldPaddingBottom = el.style.paddingBottom;
          if (el.style.height) el.dataset.elExistsHeight = el.style.height;

          el.style.maxHeight = '0';
          el.style.paddingTop = '0';
          el.style.paddingBottom = '0';
        },

        enter(el: RendererElement) {
          el.dataset.oldOverflow = el.style.overflow;
          if (el.scrollHeight !== 0) {
            el.style.height = el.scrollHeight + 'px';
          } else {
            el.style.height = '';
          }

          el.style.overflow = 'hidden';
          requestAnimationFrame(() => {
            el.dataset.oldOverflow = el.style.overflow;
            if (el.dataset.elExistsHeight) {
              el.style.maxHeight = el.dataset.elExistsHeight;
            } else if (el.scrollHeight !== 0) {
              el.style.maxHeight = `${el.scrollHeight}px`;
            } else {
              el.style.maxHeight = '0';
            }

            el.style.paddingTop = el.dataset.oldPaddingTop;
            el.style.paddingBottom = el.dataset.oldPaddingBottom;
            el.style.overflow = 'hidden';
          });
        },

        afterEnter(el: RendererElement) {
          el.style.maxHeight = '';
          el.style.overflow = el.dataset.oldOverflow;
        },

        enterCancelled(el: RendererElement) {
          reset(el);
        },

        beforeLeave(el: RendererElement) {
          if (!el.dataset) el.dataset = {};
          el.dataset.oldPaddingTop = el.style.paddingTop;
          el.dataset.oldPaddingBottom = el.style.paddingBottom;
          el.dataset.oldOverflow = el.style.overflow;

          el.style.maxHeight = `${el.scrollHeight}px`;
          el.style.overflow = 'hidden';
        },

        leave(el: RendererElement) {
          if (el.scrollHeight !== 0) {
            el.style.maxHeight = '0';
            el.style.paddingTop = '0';
            el.style.paddingBottom = '0';
          }
        },

        afterLeave(el: RendererElement) {
          reset(el);
        },

        leaveCancelled(el: RendererElement) {
          reset(el);
        },
      },
    };

    return h('transition', data, children);
  },
});
</script>

<style>
.el-collapse-transition-leave-active,
.el-collapse-transition-enter-active {
  transition: 0.3s max-height ease-in-out, 0.3s padding-top ease-in-out, 0.3s padding-bottom ease-in-out;
}
</style>
