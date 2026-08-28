<template>
  <div :class="containerKls" @mouseenter="handleMouseenter" @mouseleave="handleMouseleave">
    <template v-if="type !== 'textarea'">
      <!-- 前置元素 -->
      <div v-if="$slots.prepend" class="el-input-group__prepend">
        <slot name="prepend" />
      </div>

      <div ref="wrapperRef" :class="{ 'el-input__wrapper': true, 'is-focus': isFocused }">
        <!-- 前置内容 -->
        <span v-if="$slots.prefix || prefixIcon" class="el-input__prefix">
          <span class="el-input__prefix-inner">
            <slot name="prefix" />
            <span v-if="prefixIcon" class="el-icon el-input__icon">
              <component :is="prefixIcon" />
            </span>
          </span>
        </span>

        <input
          :id="inputId"
          ref="input"
          v-bind="$attrs"
          :class="['el-input__inner', inputClass]"
          :name="name"
          :minlength="countGraphemes ? undefined : minlength"
          :maxlength="countGraphemes ? undefined : maxlength"
          :type="showPassword ? (passwordVisible ? 'text' : 'password') : type"
          :tabindex="tabindex"
          :disabled="inputDisabled"
          :readonly="readonly"
          :autocomplete="autocomplete"
          :autofocus="autofocus"
          :placeholder="placeholder"
          :form="form"
          :inputmode="inputmode"
          :style="inputStyle"
          :aria-label="ariaLabel"
          @compositionstart="handleCompositionStart"
          @compositionupdate="handleCompositionUpdate"
          @compositionend="handleCompositionEnd"
          @input="handleInput"
          @change="handleChange"
          @keydown="handleKeydown"
        >

        <!-- 后置内容 -->
        <span v-if="suffixVisible" class="el-input__suffix">
          <span class="el-input__suffix-inner">

            <span
              v-if="renderClear"
              class="el-icon el-input__icon el-input__clear"
              :style="{ visibility: showClear ? 'visible' : 'hidden' }"
              @mousedown.prevent
              @click="clear"
            >
              <CircleClose />
            </span>

            <template v-if="!showClear || !showPwdVisible || !isWordLimitVisible">
              <slot name="suffix" />
              <span v-if="suffixIcon" class="el-icon el-input__icon">
                <component :is="suffixIcon" />
              </span>
            </template>

            <span
              v-if="showPwdVisible"
              class="el-icon el-input__icon el-input__password"
              @mousedown.prevent
              @mouseup.prevent
              @click="handlePasswordVisible"
            >
              <component :is="passwordVisible ? View : Hide" />
            </span>

            <span
              v-if="validateState"
              class="el-icon el-input__icon el-input__validateIcon"
              :class="{ 'is-loading': validateState === 'validating' }"
            >
              <component :is="validateIcon" />
            </span>

            <span
              v-if="isWordLimitVisible"
              :class="{ 'el-input__count': true, 'is-outside': wordLimitPosition === 'outside' }"
              :aria-label="wordLimitLabel"
              role="status"
            >
              <span class="el-input__count-inner">
                {{ textLength }}/{{ upperLimit }}
              </span>
            </span>
          </span>
        </span>
      </div>

      <!-- 后置元素 -->
      <div v-if="$slots.append" class="el-input-group__append">
        <slot name="append" />
      </div>
    </template>

    <template v-else>
      <textarea
        :id="inputId"
        :ref="scrollable.wrapRef"
        v-bind="$attrs"
        :class="textareaKls"
        :name="name"
        :minlength="countGraphemes ? undefined : minlength"
        :maxlength="countGraphemes ? undefined : maxlength"
        :tabindex="tabindex"
        :disabled="inputDisabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :placeholder="placeholder"
        :form="form"
        :rows="rows"
        :inputmode="inputmode"
        :style="textareaStyle"
        :aria-label="ariaLabel"
        @compositionstart="handleCompositionStart"
        @compositionupdate="handleCompositionUpdate"
        @compositionend="handleCompositionEnd"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
        @keydown="handleKeydown"
        @scroll="handleScroll"
      />
      <ElScrollbarBar
        :move="scrollable.state.moveY"
        :size="scrollable.state.sizeHeight"
        :ratio="scrollable.state.ratioY"
        :always="scrolling"
        vertical
      />

      <span
        v-if="showClear"
        class="el-icon el-textarea__icon el-textarea__clear"
        :style="clearIconStyle"
        @mousedown.prevent
        @click="clear"
      >
        <CircleClose />
      </span>

      <span
        v-if="isWordLimitVisible"
        :class="{ 'el-input__count': true, 'is-outside': wordLimitPosition === 'outside' }"
        :aria-label="wordLimitLabel"
        role="status"
      >
        <span class="el-input__count-inner">
          {{ textLength }}/{{ upperLimit }}
        </span>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes, PropType, StyleValue } from 'vue';
import type { InputAutoComplete, InputType, InputAutoSize, InputResize } from './typings';

import { useSlots, computed, ref, nextTick, shallowRef, watch, toRef, onBeforeUnmount, onMounted } from 'vue';
import { isClient, noop, useResizeObserver } from '@vueuse/core';
import { CircleClose, Hide, View } from 'element-icons';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { isDefined, isObject, isUndefinedOrNull } from '@/utils/types';
import { ValidateComponentsMap, iconPropType } from '@/utils/vue/icon';
import { useComposition } from '@/composables/use-composition';
import { useFocusController } from '@/composables/use-focus-controller';
import { cAF, createTimeoutTimer, rAF } from '@/utils/async';
import { looseToNumber } from '@/utils/number';
import { ScrollbarBar as ElScrollbarBar, useScrollable, type ScrollbarScrollEvent, type ScrollbarDirection } from '../../scrollbar';
import { useFormDisabled, useFormItem, useFormItemInputId, useFormSize } from '../../form';
import { allowInputText, calcTextareaHeight, useCursor } from './utils';

defineOptions({
  name: 'ElInput',
  inheritAttrs: false,
});

const props = defineProps({
  id: String,
  name: String,
  value: [String, Number] as PropType<string | number>,
  maxlength: [String, Number] as PropType<string | number>,
  minlength: [String, Number] as PropType<string | number>,
  type: {
    type: String as PropType<InputType>,
    default: 'text',
  },
  placeholder: String,
  form: String,
  disabled: Boolean,
  readonly: Boolean,
  clearable: Boolean,
  autofocus: Boolean,
  autocomplete: {
    type: String as PropType<InputAutoComplete>,
    default: 'off',
  },
  tabindex: {
    type: [String, Number] as PropType<string | number>,
    default: 0,
  },
  validateEvent: {
    type: Boolean,
    default: true,
  },
  showWordLimit: Boolean,
  wordLimitPosition: {
    type: String as PropType<'inside' | 'outside'>,
    default: 'inside',
  },
  ariaLabel: String,
  inputmode: String as PropType<HTMLAttributes['inputmode']>,
  /**
   * @description Count graphemes of input value. If it's set, native maxlength and minlength won't be used.
   */
  countGraphemes: Function as PropType<(value: string) => number>,
  inputStyle: null as unknown as PropType<StyleValue>,
  inputClass: null as unknown as PropType<any>,

  // Input
  size: useSizeProp,
  showPassword: Boolean,
  suffixIcon: iconPropType,
  prefixIcon: iconPropType,

  // Textarea
  resize: String as PropType<InputResize>,
  autosize: {
    type: [Boolean, Object] as PropType<InputAutoSize>,
    default: false,
  },
  rows: {
    type: Number,
    default: 2,
  },
});

const emit = defineEmits<{
  (type: 'input', value: string): void;
  (type: 'change', value: string, event?: Event): void;
  (type: 'focus', event: FocusEvent): void;
  (type: 'blur', event: FocusEvent): void;
  (type: 'clear', event?: MouseEvent): void;
  (type: 'mouseenter', event: MouseEvent): void;
  (type: 'mouseleave', event: MouseEvent): void;
  (type: 'keydown', event: KeyboardEvent): void;
  (type: 'compositionstart', event: CompositionEvent): void;
  (type: 'compositionupdate', event: CompositionEvent): void;
  (type: 'compositionend', event: CompositionEvent): void;
  // Textarea
  (type: 'scroll', event: ScrollbarScrollEvent): void;
  (type: 'end-reached', value: ScrollbarDirection): void;
}>();

type TargetElement = HTMLInputElement | HTMLTextAreaElement;

let passwordFocusValue: string | undefined;

const slots = useSlots();
const scrollable = useScrollable({}, emit);

const hovering = ref(false);
const scrolling = ref(false);
const passwordVisible = ref(false);
const saveValue = ref('');
const countStyle = ref<StyleValue>();
const clearIconStyle = ref<StyleValue>();
const textareaCalcStyle = shallowRef(props.inputStyle);
const textareaHeight = ref<string>();

const input = shallowRef<HTMLInputElement>();
const textarea = computed(() => scrollable.wrapRef.value as HTMLTextAreaElement | undefined);
const _ref = computed(() => input.value || textarea.value);

const { form: elForm, formItem: elFormItem } = useFormItem();
const inputSize = useFormSize();
const inputDisabled = useFormDisabled();
const { inputId } = useFormItemInputId(props, { formItemContext: elFormItem });

// wrapperRef for type="text", handleFocus and handleBlur for type="textarea"
// @ts-ignore - used in template ref binding, TS cannot detect template usage
const { wrapperRef, isFocused, handleFocus, handleBlur } = useFocusController(
  _ref,
  {
    disabled: inputDisabled,
    afterFocus() {
      if (props.showPassword) {
        passwordFocusValue = _ref.value?.value;
      }
    },
    beforeBlur(event) {
      if (props.showPassword) {
        const target = _ref.value;
        if (
          event.relatedTarget &&
          target?.parentElement?.contains(event.relatedTarget as Node)
        ) {
          return undefined;
        }
        const value = target?.value;
        if (
          !isUndefinedOrNull(value) &&
          !isUndefinedOrNull(passwordFocusValue) &&
          value !== passwordFocusValue
        ) {
          target?.dispatchEvent(new Event('change', { bubbles: true }));
        }
        passwordFocusValue = undefined;
      }
      return undefined;
    },
    afterBlur() {
      if (props.validateEvent) {
        elFormItem?.validate?.('blur').catch(noop);
      }
    },
  },
);

const upperLimit = computed(() => props.maxlength?.toString());
const needStatusIcon = computed(() => elForm?.statusIcon ?? false);
const validateState = computed(() => elFormItem?.validateState || '');
const validateIcon = computed(() => validateState.value && ValidateComponentsMap[validateState.value]);

const nativeInputValue = computed(() => isUndefinedOrNull(props.value) ? '' : String(props.value));
const textLength = computed(() =>
  props.countGraphemes && props.showWordLimit
    ? props.countGraphemes(nativeInputValue.value)
    : nativeInputValue.value.length,
);
// const wordLimitLabel = computed(() =>
//   t('el.input.characters', {
//     count: textLength.value,
//     max: maxlength.value ?? '',
//   })
// )
const wordLimitLabel = computed(() => `${ textLength.value } / ${ upperLimit.value } 个字符`);
const renderClear = computed(() => props.clearable && !inputDisabled.value && !props.readonly);
const showClear = computed(() => renderClear.value && !!(nativeInputValue.value) && (isFocused.value || hovering.value));
const showPwdVisible = computed(() => props.showPassword && !inputDisabled.value && !!nativeInputValue.value);
// props.showPassword && !inputDisabled.value && !props.readonly && (!!nativeInputValue.value || isFocused.value)

const isWordLimitVisible = computed(
  () =>
    props.showWordLimit &&
    !!(upperLimit.value) &&
    (props.type === 'text' || props.type === 'textarea') &&
    !inputDisabled.value &&
    !props.readonly &&
    !props.showPassword,
);
const inputExceed = computed(() => isWordLimitVisible.value && textLength.value > Number(upperLimit.value));
const suffixVisible = computed(
  () =>
    !!(slots.suffix) ||
    !!(props.suffixIcon) ||
    props.clearable || // showClear.value
    props.showPassword ||
    isWordLimitVisible.value ||
    (!!validateState.value && needStatusIcon.value),
);

const [recordCursor, setCursor] = useCursor(input);

const containerKls = computed(() => {
  const { type } = props;
  const classes = [type === 'textarea' ? 'el-textarea el-scrollbar' : 'el-input'];

  if (type === 'hidden') classes.push('el-input-hidden');
  if (inputDisabled.value) classes.push('is-disabled');
  if (inputExceed.value) classes.push('is-exceed');

  if (type !== 'textarea') {
    if (inputSize.value) classes.push(`el-input--${ inputSize.value }`);
    if (slots.append || slots.prepend) classes.push('el-input-group');
    if (slots.append) classes.push('el-input-group--append');
    if (slots.prepend) classes.push('el-input-group--prepend');
    if (slots.prefix || props.prefixIcon) classes.push('el-input--prefix');
    if (slots.suffix || props.suffixIcon || props.clearable || props.showPassword) classes.push('el-input--suffix');
    if (showClear.value && showPwdVisible.value) classes.push('el-input-suffix--password-clear');
  }

  return classes;
});

const textareaKls = computed(() => {
  const classes = ['el-textarea__inner', 'el-scrollbar__wrap', 'el-scrollbar__wrap--hidden-default'];

  if (isFocused.value) classes.push('is-focus');
  if (props.clearable) classes.push('is-clearable');
  classes.push(props.inputClass);

  return classes;
});

const textareaStyle = computed(() => {
  const style = [
    props.inputStyle,
    textareaCalcStyle.value,
  ];

  const { resize } = props;
  if (resize) style.push({ resize });

  const { value: height } = textareaHeight;
  if (height) style.push({ height });

  return style as StyleValue;
});

const doUpdateScrollbar = (next?: boolean) => {
  if (next) {
    nextTick(scrollable.update);
  } else {
    scrollable.update();
  }
};

const resizeTextarea = () => {
  const { type, autosize } = props;

  if (!isClient || type !== 'textarea' || !textarea.value) return;

  if (autosize) {
    const minRows = isObject(autosize) ? autosize.minRows : undefined;
    const maxRows = isObject(autosize) ? autosize.maxRows : undefined;
    const textareaStyle = calcTextareaHeight(textarea.value, minRows, maxRows);

    // If the scrollbar is displayed, the height of the textarea needs more space than the calculated height.
    // If set textarea height in this case, the scrollbar will not hide.
    // So we need to hide scrollbar first, and reset it in next tick.
    // see https://github.com/element-plus/element-plus/issues/8825
    textareaCalcStyle.value = {
      overflowY: 'hidden',
      ...textareaStyle,
    };

    nextTick(() => {
      // NOTE: Force repaint to make sure the style set above is applied.
      void textarea.value!.offsetHeight;
      textareaCalcStyle.value = textareaStyle as StyleValue;
      doUpdateScrollbar();
    });
  } else {
    textareaCalcStyle.value = {
      minHeight: calcTextareaHeight(textarea.value).minHeight,
    };
    doUpdateScrollbar();
  }
};

const createOnceInitResize = (resizeTextarea: () => void) => {
  let isInit = false;
  return () => {
    if (isInit || !props.autosize) {
      if (props.resize !== 'none') {
        // The execution here may occur before `setTimeout(resizeTextarea)`,
        // potentially causing a regression of issue #21836, so the assignment needs to be deferred.
        setTimeout(() => {
          textareaHeight.value = textarea.value?.style.height;
          doUpdateScrollbar();
        });
      }
      return;
    }
    const isElHidden = textarea.value?.offsetParent === null;
    if (!isElHidden) {
      setTimeout(resizeTextarea);
      isInit = true;
    }
  };
};
// fix: https://github.com/element-plus/element-plus/issues/12074
const onceInitSizeTextarea = createOnceInitResize(resizeTextarea);

let rAFId: number | undefined;

useResizeObserver(textarea, ([entry]) => {
  onceInitSizeTextarea();
  if (
    (!isWordLimitVisible.value && !renderClear.value) ||
    (props.resize !== 'both' && props.resize !== 'horizontal')
  ) return;

  const { width } = entry.target.getBoundingClientRect();

  const updateStyle = () => {
    rAFId = undefined;
    countStyle.value = {
      /** right: 100% - (width - right(10)) */
      right: `calc(100% - ${ width - 10 }px)`,
    };
    clearIconStyle.value = {
      /** right: 100% - (width - right(11)) */
      right: `calc(100% - ${ width - 11 }px)`,
    };
  };

  rAFId && cAF(rAFId);
  rAFId = rAF(updateStyle);
});

const setNativeInputValue = () => {
  // 如果发现输入框不显示值，在这里配置支持的输入类型
  if (!allowInputText(props.type)) return;

  const el = _ref.value;
  if (!el) return;

  const { value } = nativeInputValue;
  if (el.value !== value) {
    el.value = value;
  }
};

const {
  isComposing,
  handleCompositionStart,
  handleCompositionUpdate,
  handleCompositionEnd,
} = useComposition({ emit, afterComposition: handleInput });

function handleMouseenter(event: MouseEvent) {
  hovering.value = true;
  emit('mouseenter', event);
}

function handleMouseleave(event: MouseEvent) {
  hovering.value = false;
  emit('mouseleave', event);
}

function handleKeydown(event: KeyboardEvent) {
  emit('keydown', event);
}

const scrollingTimer = createTimeoutTimer();

function handleScroll(event: UIEvent) {
  scrollable.handleScroll();
  scrolling.value = true;
  scrollingTimer.cancelAndSet(() => {
    scrolling.value = false;
  }, 300);
}

async function handleInput(event: Event) {
  // should not emit input during composition
  // see: https://github.com/ElemeFE/element/issues/10516
  if (isComposing.value) return;

  let { value } = event.target as TargetElement;
  let shouldForceNativeUpdate = false;

  const { countGraphemes } = props;

  if (countGraphemes && isDefined(upperLimit.value)) {
    const limit = Number(upperLimit.value);
    const graphemes = countGraphemes(value);
    const saveGraphemes = countGraphemes(saveValue.value);
    if (graphemes > limit && graphemes > saveGraphemes) {
      // If current value already exceeds limit, block further input and keep exceed state.
      if (saveGraphemes > limit) {
        value = saveValue.value;
        shouldForceNativeUpdate = true;
      } else {
        // Keep unchanged suffix like native maxlength behavior.
        // Instead of truncating from the end of the whole string,
        // only limit the inserted segment to available capacity.
        const prevValue = saveValue.value;
        const nextValue = value;
        let prefixLen = 0;

        while (
          prefixLen < prevValue.length &&
          prefixLen < nextValue.length &&
          prevValue[prefixLen] === nextValue[prefixLen]
        ) {
          prefixLen++;
        }

        let prevSuffixIndex = prevValue.length;
        let nextSuffixIndex = nextValue.length;
        while (
          prevSuffixIndex > prefixLen &&
          nextSuffixIndex > prefixLen &&
          prevValue[prevSuffixIndex - 1] === nextValue[nextSuffixIndex - 1]
        ) {
          prevSuffixIndex--;
          nextSuffixIndex--;
        }

        const before = nextValue.slice(0, prefixLen);
        const removed = prevValue.slice(prefixLen, prevSuffixIndex);
        const inserted = nextValue.slice(prefixLen, nextSuffixIndex);
        const after = nextValue.slice(nextSuffixIndex);

        const removedCount = countGraphemes(removed);
        const baseCount = saveGraphemes - removedCount;
        const availableInserted = Math.max(0, limit - baseCount);

        let acceptedInserted = '';
        if (availableInserted > 0) {
          // Use Intl.Segmenter for proper grapheme cluster iteration if available.
          if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
            const segmenter = new Intl.Segmenter(undefined, {
              granularity: 'grapheme',
            });
            for (const { segment } of segmenter.segment(inserted)) {
              const candidate = acceptedInserted + segment;
              const newCount = countGraphemes(candidate);
              if (newCount > availableInserted) break;
              acceptedInserted = candidate;
            }
          } else {
            // Fallback to code-point iteration for older environments.
            for (const char of Array.from(inserted)) {
              const candidate = acceptedInserted + char;
              const newCount = countGraphemes(candidate);
              if (newCount > availableInserted) break;
              acceptedInserted = candidate;
            }
          }
        }

        value = before + acceptedInserted + after;
        shouldForceNativeUpdate = true;
      }
    }
  }

  // hack for https://github.com/ElemeFE/element/issues/8548
  // should remove the following line when we don't support IE
  if (String(value) === nativeInputValue.value) {
    // preserve native features while being compatible with #9501
    if (shouldForceNativeUpdate) {
      const target = event.target as TargetElement;
      const blockedValue = target.value;
      const selectionStart = target.selectionStart;
      const selectionEnd = target.selectionEnd;
      setNativeInputValue();
      // Keep caret position stable when input is blocked and value is reset.
      if (
        shouldForceNativeUpdate &&
        _ref.value &&
        selectionStart != null &&
        selectionEnd != null
      ) {
        const restoredValue = _ref.value.value;
        const afterTxt = blockedValue.slice(Math.max(0, selectionEnd));
        let caretPos = Math.min(selectionStart, restoredValue.length);

        if (afterTxt && restoredValue.endsWith(afterTxt)) {
          caretPos = restoredValue.length - afterTxt.length;
        }

        _ref.value.setSelectionRange(caretPos, caretPos);
      }
    }
    return;
  }
  saveValue.value = value;

  recordCursor();
  emit('input', value);

  // ensure native input value is controlled
  // see: https://github.com/ElemeFE/element/issues/12850
  await nextTick();

  // if (!hasModelModifiers.value) {
  setNativeInputValue();
  // }
  setCursor();
}

async function handleChange(event: Event) {
  let { value } = event.target as TargetElement;

  if (props.showPassword) {
    passwordFocusValue = value;
  }

  emit('change', value, event);

  await nextTick();
  setNativeInputValue();
}

const focus = () => {
  _ref.value?.focus();
};

const blur = () => {
  _ref.value?.blur();
};

const select = () => {
  _ref.value?.select();
};

function clear(event?: MouseEvent) {
  passwordFocusValue = '';
  emit('input', '');
  emit('change', '');
  emit('clear', event);
}

watch(
  () => props.value,
  () => {
    nextTick(() => {
      resizeTextarea();
      if (props.autosize) {
        textareaHeight.value = undefined;
      }
    });
    if (props.validateEvent) {
      elFormItem?.validate?.('change').catch(noop);
    }
  },
);

watch(
  () => nativeInputValue.value,
  (val) => {
    saveValue.value = val;
  },
  { immediate: true },
);

function handlePasswordVisible() {
  passwordVisible.value = !passwordVisible.value;
}

// native input value is set explicitly
// do not use v-model / :value in template
// see: https://github.com/ElemeFE/element/issues/14521
watch(nativeInputValue, (newValue) => {
  if (!_ref.value) {
    return;
  }

  const elValue = _ref.value.value;
  const displayValue =
    (props.type === 'number') && !/^0\d/.test(elValue)
      ? `${ looseToNumber(elValue) }`
      : elValue;

  if (displayValue === newValue) {
    return;
  }

  setNativeInputValue();
});

// when change between <input> and <textarea>,
// update DOM dependent value and styles
// https://github.com/ElemeFE/element/issues/14857
watch(
  () => props.type,
  async () => {
    await nextTick();
    setNativeInputValue();
    resizeTextarea();
  },
);

onMounted(() => {
  setNativeInputValue();
  nextTick(resizeTextarea);
});

onBeforeUnmount(() => {
  rAFId && cAF(rAFId);
  scrollingTimer.cancel();
});

defineExpose({
  /** @description HTML input element */
  input,
  /** @description HTML textarea element */
  textarea,
  /** @description HTML element, input or textarea */
  ref: _ref,
  /** @description style of textarea. */
  textareaStyle,

  /** @description from props (used on unit test) */
  autosize: toRef(props, 'autosize'),

  /** @description is input composing */
  isComposing,

  /** @description whether the password is visible */
  passwordVisible,

  /** @description HTML input element native method */
  focus,
  /** @description HTML input element native method */
  blur,
  /** @description HTML input element native method */
  select,
  /** @description clear input value */
  clear,
  /** @description resize textarea. */
  resizeTextarea,
});
</script>
