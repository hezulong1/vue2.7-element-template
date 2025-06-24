<script lang="ts">
// Github: https://github.com/lixl39505/teleport-vue2
// Blog: https://juejin.cn/post/7363579190971482162

import { defineComponent } from 'vue';

interface TeleportData {
  teleported: boolean;
  lastTo: string | HTMLElement;
  originalEl?: Node | null;
  rootEl?: Node;
  dumbEl: Node;
}

export default defineComponent({
  name: 'ElTeleport',
  abstract: true,
  props: {
    to: {
      type: [String, HTMLElement],
      required: true,
    },
    disabled: Boolean,
  },
  data() {
    return Object.preventExtensions<TeleportData>({
      teleported: false,
      lastTo: '',
      originalEl: void 0,
      rootEl: void 0,
      dumbEl: document.createComment(' el-teleport '),
    });
  },
  mounted() {
    this.onEnter();
  },
  updated() {
    this.onEnter(); // 除了 to、disabled 外，rootEl 以及 originalEl 也可能发生变化
  },
  beforeDestroy() {
    this.dumbEl.parentNode?.removeChild(this.dumbEl);
    this.rootEl?.parentNode?.removeChild(this.rootEl);
  },
  methods: {
    onEnter() {
      // @ts-expect-error 调用私有属性
      this.rootEl = this._vnode.elm;
      this.originalEl = this.teleported ? this.dumbEl?.parentNode : this.rootEl?.parentNode;
      this.disabled ? this.restore() : this.teleport();
    },
    restore() {
      if (!this.teleported) return;
      this.$vnode.elm = this.rootEl;
      this.teleported = false;
      this.lastTo = '';

      if (!this.originalEl) return;
      this.rootEl && this.originalEl.insertBefore(this.rootEl, this.dumbEl);
      this.dumbEl.parentNode?.removeChild(this.dumbEl);
    },
    teleport() {
      if (!this.rootEl || !this.originalEl) return;
      if (!this.teleported) this.originalEl.insertBefore(this.dumbEl, this.rootEl);
      this.$vnode.elm = this.dumbEl;
      this.teleported = true;

      let targetEl;
      if (this.to !== this.lastTo) targetEl = typeof this.to === 'string' ? document.querySelector(this.to) : this.to;
      if (!targetEl) return;
      targetEl.appendChild(this.rootEl);
      this.lastTo = this.to;
    },
  },
  render(h) {
    return this.$slots.default?.[0];
  },
});
</script>
