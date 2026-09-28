<template>
  <ul v-show="visible" ref="groupRef" class="el-select-group__wrap">
    <li class="el-select-group__title">{{ label }}</li>
    <li>
      <ul class="el-select-group">
        <slot />
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import type { OptionPublicInstance } from './typings';

import {
  computed,
  getCurrentInstance,
  onMounted,
  provide,
  reactive,
  ref,
  shallowRef,
  toRefs,
} from 'vue';
import { useMutationObserver } from '@vueuse/core';
import { SELECT_GROUP_CONTEXT_KEY } from './utils';

defineOptions({ name: 'ElOptionGroup' });

const props = defineProps({
  /**
   * @description name of the group
   */
  label: String,
  /**
   * @description whether to disable all options in this group
   */
  disabled: Boolean,
});

const groupRef = ref<HTMLElement>();
const instance = getCurrentInstance()!.proxy as unknown as ComponentPublicInstance;
const children = shallowRef<OptionPublicInstance[]>([]);

provide(SELECT_GROUP_CONTEXT_KEY, reactive(toRefs(props)));

const visible = computed(() => children.value.some(option => option.visible === true));

const isOption = (node: ComponentPublicInstance): node is OptionPublicInstance => {
  const options = node.$options as { name?: string; Ctor?: { options?: { name?: string } } };
  return (options.name || options.Ctor?.options?.name) === 'ElOption';
};

function collectOptions() {
  const children: OptionPublicInstance[] = [];

  const walk = (vm: ComponentPublicInstance) => {
    vm.$children.forEach((child) => {
      if (isOption(child)) {
        children.push(child);
      } else if (child.$children?.length) {
        walk(child);
      }
    });
  };

  walk(instance);
  return children;
}

function updateChildren() {
  children.value = collectOptions();
}

onMounted(() => {
  updateChildren();
});

useMutationObserver(groupRef, updateChildren, {
  attributes: true,
  subtree: true,
  childList: true,
});
</script>
