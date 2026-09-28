<template>
  <ElSelectDropdown
    ref="tooltipRef"
    :class="['el-select', sizeRef ? `el-select--${sizeRef}` : '']"
    :visible="dropdownMenuVisible"
    :disabled="selectDisabled"
    :placement="placement"
    :append-to="appendTo"
    :teleported="teleported"
    :popper-class="['el-select__popper', popperClass]"
    :popper-style="popperStyle"
    :popper-options="popperOptions"
    :fallback-placements="fallbackPlacements"
    :persistent="persistent"
    :show-arrow="showArrow"
    :offset="offset"
    :reference-el="wrapperRef"

    :multiple="multiple"
    :fit-input-width="fitInputWidth"
    :content-id="contentId"
    :loading="loading"
    :aria-label="ariaLabel"

    @before-show="handleMenuEnter"
    @hide="states.isBeforeHide = false"

    @scroll="e => $emit('popup-scroll', e)"
    @end-reached="d => $emit('popup-end-reached', d)"

    @mouseenter.native="states.inputHovering = true"
    @mouseleave.native="states.inputHovering = false"
  >
    <div ref="wrapperRef" :class="wrapperKls" @click.prevent="toggleMenu">
      <div v-if="$slots.prefix" class="el-select__prefix">
        <div class="el-select__prefix-inner">
          <slot name="prefix" />
        </div>
      </div>

      <div
        ref="selectionRef"
        class="el-select__selection"
        :class="{ 'is-near': multiple && !$slots.prefix && !!states.selected.length }"
      >
        <div
          v-if="shouldShowPlaceholder"
          :class="[
            'el-select__selected-item',
            'el-select__placeholder',
            {
              'is-transparent': !hasModelValue || (expanded && !states.inputValue),
            },
          ]"
        >
          <slot
            v-if="hasModelValue"
            name="label"
            :index="getIndex()"
            :label="currentPlaceholder"
            :value="modelValue"
          >
            <span>{{ currentPlaceholder }}</span>
          </slot>
          <span v-else>{{ currentPlaceholder }}</span>
        </div>

        <slot
          v-if="multiple"
          name="tag"
          :data="showTagList"
          :delete-tag="deleteTag"
          :select-disabled="selectDisabled"
        >
          <ElTooltip
            v-if="collapseTags && collapseTagList.length"
            key="more"
            ref="tagTooltipRef"
            :disabled="dropdownMenuVisible || !collapseTagsTooltip"
            :fallback-placements="['bottom', 'top', 'right', 'left']"
            effect="light"
            placement="bottom"
            popper-class="el-select__collapseTag-popper"
            pure
          >
            <template #default>
              <div
                ref="collapseItemRef"
                class="el-select__selected-item el-select__collapse-item"
                :style="collapseTagStyle"
              >
                <ElTag :size="sizeRef" :type="tagType" :effect="tagEffect">
                  <span class="el-select__tags-text">+ {{ collapseTagList.length }}</span>
                </ElTag>
              </div>
            </template>

            <template #content>
              <div ref="tagMenuRef" class="el-select__selection">
                <div v-for="item in collapseTagList" :key="getValueKey(item)" class="el-select__selected-item">
                  <ElTag
                    :closable="!selectDisabled && !item.isDisabled"
                    :size="sizeRef"
                    :type="tagType"
                    :effect="tagEffect"
                    @close="deleteTag($event, item)"
                  >
                    <span class="el-select__tags-text">
                      <slot name="label" :index="item.index" :label="item.currentLabel" :value="item.value">
                        {{ item.currentLabel }}
                      </slot>
                    </span>
                  </ElTag>
                </div>
              </div>
            </template>
          </ElTooltip>

          <div
            v-for="(item) in showTagList"
            :key="getValueKey(item)"
            class="el-select__selected-item el-select__selected-item--tag"
            :style="tagStyle"
          >
            <ElTag
              :closable="!selectDisabled && !item.isDisabled"
              :size="sizeRef"
              :type="tagType"
              :effect="tagEffect"
              @close="deleteTag($event, item)"
            >
              <span class="el-select__tags-text">
                <slot name="label" :index="item.index" :label="item.currentLabel" :value="item.value">
                  {{ item.currentLabel }}
                </slot>
              </span>
            </ElTag>
          </div>
        </slot>

        <div
          key="input"
          :class="[
            'el-select__selected-item',
            'el-select__input-wrapper',
            {
              'is-hidden': !filterable || selectDisabled || (multiple && !states.inputValue && !isFocused),
            },
          ]"
        >
          <input
            :id="inputId"
            ref="inputRef"
            :value="states.inputValue"
            type="text"
            :name="name"
            :class="inputKls"
            :disabled="selectDisabled"
            :autocomplete="autocomplete"
            :style="[inputStyle]"
            :tabindex="tabindex"
            role="combobox"
            :readonly="!filterable"
            spellcheck="false"
            :aria-activedescendant="hoverOption?.id || ''"
            :aria-controls="contentId"
            :aria-expanded="dropdownMenuVisible ? 'true' : 'false'"
            :aria-label="ariaLabel"
            aria-autocomplete="none"
            aria-haspopup="listbox"

            @keydown="handleKeydown"
            @compositionstart="handleCompositionStart"
            @compositionupdate="handleCompositionUpdate"
            @compositionend="handleCompositionEnd"
            @input="onInput"
            @click.stop="toggleMenu"
            @change.stop
          >
          <span
            v-if="filterable"
            ref="calculatorRef"
            aria-hidden="true"
            class="el-select__input-calculator"
          >{{ states.inputValue }}</span>
        </div>
      </div>

      <div ref="suffixRef" class="el-select__suffix">
        <div class="el-select__suffix-inner">
          <span
            v-if="iconComponent && !showClearBtn"
            class="el-icon el-select__caret el-select__icon"
            :class="{ 'is-reverse': iconReverse }"
          >
            <component :is="iconComponent" />
          </span>
          <span
            v-if="showClearBtn"
            class="el-icon el-select__caret el-select__icon el-select__clear"
            @click="handleClearClick"
          >
            <CircleClose />
          </span>
          <span
            v-if="validateState && validateIcon && needStatusIcon"
            class="el-icon el-input__icon el-input__validateIcon"
            :class="{ 'is-loading': validateState === 'validating' }"
          >
            <component :is="validateIcon" />
          </span>
        </div>
      </div>
    </div>

    <template v-for="slotName in ['header', 'loading', 'footer']">
      <slot v-if="$slots[slotName]" :slot="slotName" :name="slotName" />
    </template>

    <template #content>
      <ElOption v-if="showNewOption" :value="states.inputValue" created />
      <slot />
    </template>

    <template #empty>
      <slot name="empty">
        <span>{{ emptyText }}</span>
      </slot>
    </template>
  </ElSelectDropdown>
</template>

<script setup lang="ts">
import type { OptionValue } from './props';
import type { ScrollbarDirection, ScrollbarScrollEvent } from '../../scrollbar';

import { computed, provide, reactive, toRefs } from 'vue';
import { CircleClose } from 'element-icons';
import { useId } from '@/composables/use-id';
import { ValidateComponentsMap } from '@/utils/vue/icon';
import { useFormItem, useFormItemInputId, useFormSize } from '../../form';
import { Tooltip as ElTooltip } from '../../tooltip';
import { Tag as ElTag } from '../../tag';
import ElOption from './Option.vue';
import ElSelectDropdown from './SelectDropdown.vue';
import { useSelect, type UseSelectOptions } from './useSelect';
import { useCalcInputWidth } from './useCalcInputWidth';
import { SELECT_CONTEXT_KEY, isArray } from './utils';
import { selectProps } from './props';

defineOptions({ name: 'ElSelect' });

const props = defineProps(selectProps);
const emit = defineEmits<{
  (type: 'input', val: OptionValue | OptionValue[] | undefined): void;
  (type: 'change', val: OptionValue | OptionValue[] | undefined): void;
  (type: 'remove-tag', val: unknown): void;
  (type: 'clear'): void;
  (type: 'visible-change', visible: boolean): void;
  (type: 'focus', evt: FocusEvent): void;
  (type: 'blur', evt: FocusEvent): void;
  (type: 'popup-scroll', event: ScrollbarScrollEvent): void;
  (type: 'popup-end-reached', direction: ScrollbarDirection): void;
}>();

const contentId = useId();
const { form, formItem } = useFormItem();

const { inputId } = useFormItemInputId(props, { formItemContext: formItem });
const sizeRef = useFormSize();
const needStatusIcon = computed(() => form?.statusIcon ?? false);
const validateState = computed(() => formItem?.validateState || '');
const validateIcon = computed(() => validateState.value ? ValidateComponentsMap[validateState.value] : null);

const modelValue = computed(() => {
  const { value, multiple } = props;
  return isArray(value)
    ? multiple ? value : undefined
    : multiple ? [] : value;
});

const API = useSelect(reactive(
  Object.assign(
    { ...toRefs(props), value: modelValue },
    {
      onInput(val) {
        emit('input', val);
      },
      onChange(val) {
        emit('change', val);
      },
      onRemoveTag(val) {
        emit('remove-tag', val);
      },
      onClear() {
        emit('clear');
      },
      onVisibleChange(visible) {
        emit('visible-change', visible);
      },
    } as UseSelectOptions,
  ),
));

const { calculatorRef, inputStyle } = useCalcInputWidth();

const wrapperKls = computed(() => {
  const cls = ['el-select__wrapper'];
  if (API.isFocused.value) cls.push('is-focused');
  if (API.states.inputHovering) cls.push('is-hovering');
  if (props.filterable) cls.push('is-filterable');
  if (API.selectDisabled.value) cls.push('is-disabled');
  return cls;
});

const inputKls = computed(() => {
  const cls = ['el-select__input'];
  if (sizeRef.value) cls.push(`el-select__input--${ sizeRef.value }`);
  if (props.multiple && API.showTagList.value.length) cls.push(`is-indent`);
  return cls;
});

provide(
  SELECT_CONTEXT_KEY,
  reactive(Object.assign(
    { props: { ...toRefs(props), value: modelValue } },
    {
      states: API.states,
      optionsArray: API.optionsArray,
      setSelected: API.setSelected,
      handleOptionSelect: API.handleOptionSelect,
      onOptionCreate: API.onOptionCreate,
      onOptionDestroy: API.onOptionDestroy,
      removeCachedOption: API.removeCachedOption,
    },
  )),
);

const selectedLabel = computed(() => {
  if (!props.multiple) {
    return API.states.selectedLabel;
  }
  return API.states.selected.map(i => i.currentLabel as string);
});

const {

  states,
  isFocused,
  expanded,
  // optionsArray,
  hoverOption,
  // filteredOptionsCount,
  onInput,
  deleteTag,
  hasModelValue,
  shouldShowPlaceholder,
  currentPlaceholder,
  showClearBtn,
  iconComponent,
  iconReverse,

  showNewOption,

  selectDisabled,
  emptyText,
  handleCompositionStart,
  handleCompositionUpdate,
  handleCompositionEnd,
  handleKeydown,
  handleMenuEnter,
  handleClearClick,
  toggleMenu,
  getValueKey,
  dropdownMenuVisible,
  showTagList,
  collapseTagList,
  getOption,
  tagStyle,
  collapseTagStyle,
  inputRef,
  tooltipRef,
  popperRef,
  tagTooltipRef,
  suffixRef,
  wrapperRef,
  selectionRef,
  // scrollbarRef,
  tagMenuRef,
  collapseItemRef,
} = API;

const getIndex = () => {
  const value = modelValue.value;
  if (!value) throw new Error('modelValue is empty.');
  return getOption(value).index;
};

defineExpose({
  /**
   * @description selected label, string for single, array for multiple
   */
  selectedLabel,
  /**
   * @description focus the Input component
   */
  focus: API.focus,
  /**
   * @description blur the Input component, and hide the options
   */
  blur: API.blur,
  popperRef,
});
</script>
