<template>
  <li
    v-show="visible"
    :id="id"
    :class="containerKls"
    :aria-disabled="isDisabled || undefined"
    :aria-selected="`${itemSelected}`"
    role="option"
    @mouseover="handleMousemove"
    @mousedown="handleMousedown"
    @click.stop="handleClick"
  >
    <slot>
      <span>{{ currentLabel }}</span>
    </slot>
  </li>
</template>

<script setup lang="ts">
import type { OptionPublicInstance, OptionStates } from './typings';

import { computed, getCurrentInstance, inject, nextTick, onBeforeUnmount, reactive, toRaw, toRefs, watch } from 'vue';
import { useId } from '@/composables/use-id';
import { isFocusable } from '@/utils/aria';
import { ensureArray, looseEqual } from '@/utils/array';
import { isObject } from '@/utils/types';
import { getByPath } from '@/utils/object';
import { SELECT_CONTEXT_KEY, SELECT_GROUP_CONTEXT_KEY, escapeStringRegexp } from './utils';
import { optionProps } from './props';

defineOptions({ name: 'ElOption' });

const props = defineProps(optionProps);

const states = reactive<OptionStates>({
  index: -1,
  groupDisabled: false,
  visible: true,
  hover: false,
});

const vm = getCurrentInstance()!.proxy as unknown as OptionPublicInstance;
const id = computed(() => props.id ?? (useId().value));

const selectGroupContext = inject(SELECT_GROUP_CONTEXT_KEY, { disabled: false });
const selectContext = inject(SELECT_CONTEXT_KEY);
if (!selectContext) {
  throw new ReferenceError('[ElOption] usage: <el-select><el-option /></el-select>');
}

const itemSelected = computed(() => {
  const value = props.value;
  const valueList = ensureArray(selectContext.props.value);
  const valueKey = selectContext.props.valueKey;

  return isObject(value)
    ? valueList.some(item => toRaw(getByPath(item, valueKey)) === getByPath(value, valueKey))
    : valueList.includes(value);
});

const limitReached = computed(() => {
  const { multiple, multipleLimit, value } = selectContext.props;

  if (!multiple) return false;

  const valueList = ensureArray(value ?? []);
  return !itemSelected.value && multipleLimit > 0 && valueList.length >= multipleLimit;
});

const currentLabel = computed(() => props.label ?? (isObject(props.value) ? '' : (props.value)));
const isDisabled = computed(() => props.disabled || states.groupDisabled || limitReached.value);

watch(
  () => currentLabel.value,
  () => {
    if (!props.created && !selectContext.props.remote) selectContext.setSelected();
  },
);

watch(
  () => props.value,
  (val, oldVal) => {
    const { remote, valueKey } = selectContext.props;
    const shouldUpdate = remote ? val !== oldVal : !looseEqual(val, oldVal);

    if (shouldUpdate) {
      selectContext.onOptionDestroy(oldVal, vm);
      selectContext.onOptionCreate(vm);
    }

    if (!props.created && !remote) {
      if (
        valueKey &&
        isObject(val) &&
        isObject(oldVal) &&
        val[valueKey] === oldVal[valueKey]
      ) return;
      selectContext.setSelected();
    }
  },
);

watch(
  () => selectGroupContext.disabled,
  (value) => {
    states.groupDisabled = value;
  },
  { immediate: true },
);

const { visible, hover } = toRefs(states);

const containerKls = computed(() => {
  const cls = ['el-select-dropdown__item'];
  if (isDisabled.value) cls.push('is-disabled');
  if (itemSelected.value) cls.push('is-selected');
  if (hover.value) cls.push('is-hovering');
  return cls;
});

selectContext.onOptionCreate(vm);

onBeforeUnmount(() => {
  const key = vm.value;

  // if option is not selected, remove it from cache
  // 未选中的 option 卸载时从 cachedOptions 里删掉
  nextTick(() => {
    const { selected: selectedOptions } = selectContext.states;
    const doesSelected = selectedOptions.some(item => item.value === vm.value);
    // original: if (select.states.cachedOptions.get(key) === vm && !doesSelected) {
    //   select.states.cachedOptions.delete(key)
    // }
    // Vue 2 不能观察 Map，cachedOptions 改由 Select 内部 Map + removeCachedOption 管理
    if (!doesSelected) {
      selectContext.removeCachedOption(key, vm);
    }
  });

  selectContext.onOptionDestroy(key, vm);
});

function handleClick() {
  if (!selectContext || isDisabled.value) return;
  selectContext.handleOptionSelect(vm);
}

function handleMousedown(event: MouseEvent) {
  let target = event.target as HTMLElement | null;
  let currentTarget = event.currentTarget as HTMLElement;

  while (target && target !== currentTarget) {
    if (isFocusable(target)) return;
    target = target.parentElement;
  }

  event.preventDefault();
}

function handleMousemove() {
  if (!selectContext || isDisabled.value) return;
  selectContext.states.hoveringIndex = selectContext.optionsArray.indexOf(vm);
}

function updateOption(query: string) {
  const regexp = new RegExp(escapeStringRegexp(query), 'i');
  states.visible = regexp.test(String(currentLabel.value)) || !!props.created;
}

defineExpose({
  id,
  currentLabel,
  itemSelected,
  isDisabled,
  visible,
  hover,
  states,
  select: selectContext,
  hoverItem: handleMousemove,
  handleMousedown,
  updateOption,
  selectOptionClick: handleClick,
});
</script>
