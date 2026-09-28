import type { TooltipInstance } from '../../tooltip';
import type { OptionValue, SelectProps } from './props';
import type { OptionBasic, OptionPublicInstance, SelectDropdownInstance, SelectStates } from './typings';

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  useSlots,
  watch,
  watchEffect,
} from 'vue';
import { onClickOutside, useDebounceFn, useResizeObserver, isClient, clamp, isIOS, noop } from '@vueuse/core';
import { ArrowDown } from 'element-icons';
import { EVENT_CODE, getEventCode } from '@/utils/event';
import { ensureArray, looseEqual } from '@/utils/array';
import {
  isFunction,
  isObject,
  isPlainObject,
  isUndefined,
  isUndefinedOrNull,
} from '@/utils/types';
import { scrollIntoView } from '@/utils/dom';
import { useComposition } from '@/composables/use-composition';
import { useFocusController } from '@/composables/use-focus-controller';
import { getByPath } from '@/utils/object';
import { useLocale } from '@/composables/use-locale';
import { useFormDisabled, useFormItem } from '../../form';
import { findLastIndex, isArray, MINIMUM_INPUT_WIDTH } from './utils';

export interface UseSelectOptions extends SelectProps {
  onInput: (val: OptionValue | OptionValue[] | undefined) => void;
  onChange: (val: OptionValue | OptionValue[] | undefined) => void;
  onRemoveTag: (val: unknown) => void;
  onClear: () => void;
  onVisibleChange: (visible: boolean) => void;
}

export function useSelect(props: UseSelectOptions) {
  const slots = useSlots();
  const { t } = useLocale();

  const states = reactive<SelectStates>({
    inputValue: '',
    // options: [],
    // cachedOptions: [],
    optionValues: [],
    selected: [],
    collapseItemWidth: 0,
    selectedLabel: '',
    hoveringIndex: -1,
    previousQuery: null,
    inputHovering: false,
    menuVisibleOnFocus: false,
    isBeforeHide: false,
    // extra
    selectionWidth: 0,
  });

  // Vue 2 cannot observe Map; keep Maps outside reactive and bump a version.
  const optionMap = new Map<OptionValue, OptionPublicInstance>();
  const cachedOptionMap = new Map<OptionValue, OptionPublicInstance>();
  const optionsVersion = ref(0);

  const selectionRef = shallowRef<HTMLElement>();
  const tooltipRef = shallowRef<SelectDropdownInstance>();
  const tagTooltipRef = shallowRef<TooltipInstance>();
  const popperRef = computed(() => tooltipRef.value?.popperRef?.$el as HTMLElement | undefined);
  const inputRef = shallowRef<HTMLInputElement>();
  const suffixRef = shallowRef<HTMLElement>();
  const tagMenuRef = shallowRef<HTMLElement>();
  const collapseItemRef = shallowRef<HTMLElement>();

  // the controller of the expanded popup
  const expanded = ref(false);
  const hoverOption = shallowRef();
  // const hoverOptionId = computed(() => (hoverOption.value as OptionPublicInstance | undefined)?.id || '');
  const debouncing = ref(false);

  const { formItem } = useFormItem();

  const {
    isComposing,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
  } = useComposition({
    afterComposition: e => onInput(e as unknown as Event),
  });

  const selectDisabled = useFormDisabled();

  const { wrapperRef, isFocused, handleBlur } = useFocusController(inputRef, {
    disabled: selectDisabled,
    afterFocus() {
      if (props.automaticDropdown && !expanded.value) {
        expanded.value = true;
        states.menuVisibleOnFocus = true;
      }
    },
    beforeBlur(event) {
      return Boolean(
        tooltipRef.value?.isFocusInsideContent(event) ||
        tagTooltipRef.value?.isFocusInsideContent(event),
      );
    },
    afterBlur() {
      expanded.value = false;
      states.menuVisibleOnFocus = false;
      if (props.validateEvent) {
        formItem?.validate?.('blur').catch(noop);
      }
    },
  });

  const hasModelValue = computed(
    () => Array.isArray(props.value)
      ? props.value.length > 0
      // : !isEmptyValue(props.modelValue)
      : !isUndefinedOrNull(props.value) && props.value !== '',
  );

  // const needStatusIcon = computed(() => form?.statusIcon ?? false)

  const showClearBtn = computed(() => (
    props.clearable &&
    !selectDisabled.value &&
    hasModelValue.value &&
    (isFocused.value || states.inputHovering)
  ));

  const iconComponent = computed(() => props.remote && props.filterable && !props.remoteShowSuffix ? null : ArrowDown);
  const iconReverse = computed(() => !!(iconComponent.value && expanded.value));
  const debounce = computed(() => (props.remote ? props.debounce : 0));
  // const isRemoteSearchEmpty = computed(() => props.remote && !states.inputValue && states.options.size === 0)
  const isRemoteSearchEmpty = computed(() => props.remote && !states.inputValue && optionMap.size === 0);

  const optionsArray = computed(() => {
    void optionsVersion.value;
    // const list = Array.from(states.options.values())
    const list = Array.from(optionMap.values());
    const newList: OptionPublicInstance[] = [];
    states.optionValues.forEach((item) => {
      const index = list.findIndex(i => i.value === item);
      if (index > -1) {
        newList.push(list[index]);
      }
    });
    return newList.length >= list.length ? newList : list;
  });

  const cachedOptionsArray = computed(() => {
    void optionsVersion.value;
    // return Array.from(states.cachedOptions.values())
    return Array.from(cachedOptionMap.values());
  });

  const filteredOptionsCount = computed(() => optionsArray.value.filter(option => option.visible).length);

  function bumpOptions() {
    optionsVersion.value++;
  }

  const emptyText = computed(() => {
    if (props.loading) {
      return props.loadingText || t('el.select.loading');
    } else {
      if (
        props.filterable &&
        states.inputValue &&
        // states.options.size > 0 &&
        optionMap.size > 0 &&
        filteredOptionsCount.value === 0
      ) {
        return props.noMatchText || t('el.select.noMatch');
      }
      // if (states.options.size === 0) {
      if (optionMap.size === 0) {
        return props.noDataText || t('el.select.noData');
      }
    }
    return undefined;
  });

  const showNewOption = computed(() => {
    const hasExistingOption = optionsArray.value
      .filter(option => !option.created)
      .some(option => option.currentLabel === states.inputValue);
    return (
      props.filterable &&
      props.allowCreate &&
      states.inputValue !== '' &&
      !hasExistingOption
    );
  });

  function updateOptions() {
    if (props.filterable && isFunction(props.filterMethod)) return;
    if (props.filterable && props.remote && isFunction(props.remoteMethod)) return;
    optionsArray.value.forEach((option) => {
      option.updateOption?.(states.inputValue);
    });
  }

  const dropdownMenuVisible = computed({
    get() {
      return (
        expanded.value &&
        (props.loading || !isRemoteSearchEmpty.value || (props.remote && !!slots.empty)) &&
        // (!debouncing.value || !isEmpty(states.previousQuery) || states.options.size > 0)
        (!debouncing.value || (states.previousQuery != null && states.previousQuery !== '') || optionMap.size > 0)
      );
    },
    set(val: boolean) {
      expanded.value = val;
    },
  });

  const shouldShowPlaceholder = computed(() => {
    if (props.multiple && !isUndefined(props.value)) {
      return ensureArray(props.value).length === 0 && !states.inputValue;
    }
    const value = Array.isArray(props.value)
      ? props.value[0]
      : props.value;
    return props.filterable || isUndefined(value) ? !states.inputValue : true;
  });

  const currentPlaceholder = computed(
    () => (props.multiple || !hasModelValue.value) ? props.placeholder : states.selectedLabel,
  );

  watch(
    () => props.value,
    (val, oldVal) => {
      if (props.multiple) {
        if (props.filterable && !props.reserveKeyword) {
          states.inputValue = '';
          handleQueryChange('');
        }
      }
      setSelected();

      if (!looseEqual(val, oldVal) && props.validateEvent) {
        formItem?.validate('change').catch(noop);
      }
    },
    {
      flush: 'post',
      deep: true,
    },
  );

  watch(
    () => expanded.value,
    (val) => {
      if (val) {
        handleQueryChange(states.inputValue);
      } else {
        states.inputValue = '';
        states.previousQuery = null;
        states.isBeforeHide = true;
        states.menuVisibleOnFocus = false;
      }
    },
  );

  watch(
    // fix `Array.prototype.push/splice/..` cannot trigger non-deep watcher
    // https://github.com/vuejs/vue-next/issues/2116
    // () => states.options.entries(),
    optionsVersion,
    () => {
      if (!isClient) return;
      // tooltipRef.value?.updatePopper?.()
      setSelected();
      if (
        props.defaultFirstOption &&
        (props.filterable || props.remote) &&
        filteredOptionsCount.value
      ) {
        checkDefaultFirstOption();
      }
    },
    {
      flush: 'post',
    },
  );

  watch([() => states.hoveringIndex, optionsArray], ([val]) => {
    if (typeof val === 'number' && val > -1) {
      hoverOption.value = optionsArray.value[val] || {};
    } else {
      hoverOption.value = {} as OptionPublicInstance;
    }
    optionsArray.value.forEach((option) => {
      option.states.hover = hoverOption.value === option;
    });
  });

  watchEffect(() => {
    // Anything could cause options changed, then update options
    // If you want to control it by condition, write here
    if (states.isBeforeHide) return;
    updateOptions();
  });

  type OptionLike = OptionPublicInstance | OptionBasic;

  const getValueKey = (item: OptionLike) => isObject(item.value) ? getByPath(item.value, props.valueKey) : item.value;

  const getValueIndex = (arr: OptionValue[], option?: OptionPublicInstance) => {
    if (isUndefined(option)) return -1;
    if (!isObject(option.value)) return arr.indexOf(option.value);
    return arr.findIndex(value => looseEqual(getByPath(value, props.valueKey), getValueKey(option)));
  };

  function updateHoveringIndex() {
    const length = states.selected.length;
    if (length > 0) {
      const lastOption = states.selected[length - 1];
      states.hoveringIndex = optionsArray.value.findIndex(
        item => getValueKey(lastOption) === getValueKey(item),
      );
    } else {
      states.hoveringIndex = -1;
    }
  }

  /**
   * find and highlight first option as default selected
   * @remark
   * - if the first option in dropdown list is user-created,
   *   it would be at the end of the optionsArray
   *   so find it and set hover.
   *   (NOTE: there must be only one user-created option in dropdown list with query)
   * - if there's no user-created option in list, just find the first one as usual
   *   (NOTE: exclude options that are disabled or in disabled-group)
   */
  function checkDefaultFirstOption() {
    const optionsInDropdown = optionsArray.value.filter(
      n => n.visible && !n.disabled && !n.states.groupDisabled,
    );
    const userCreatedOption = optionsInDropdown.find(n => n.created);
    const firstOriginOption = optionsInDropdown[0];
    const valueList = optionsArray.value.map(item => item.value);
    states.hoveringIndex = getValueIndex(
      valueList,
      userCreatedOption || firstOriginOption,
    );
  }

  function handleQueryChange(val: string) {
    if (states.previousQuery === val || isComposing.value) {
      return;
    }
    states.previousQuery = val;
    if (props.filterable && isFunction(props.filterMethod)) {
      props.filterMethod(val);
    } else if (
      props.filterable &&
      props.remote &&
      isFunction(props.remoteMethod)
    ) {
      props.remoteMethod(val);
    }
    if (
      props.defaultFirstOption &&
      (props.filterable || props.remote) &&
      filteredOptionsCount.value
    ) {
      nextTick(checkDefaultFirstOption);
    } else {
      nextTick(updateHoveringIndex);
    }
  }

  const getOption = (value: OptionValue) => {
    let option: OptionBasic | undefined;
    const isObjectValue = isPlainObject(value);

    // for (let i = states.cachedOptions.size - 1; i >= 0; i--) {
    for (let i = cachedOptionMap.size - 1; i >= 0; i--) {
      const cachedOption = cachedOptionsArray.value[i];
      const isEqualValue = isObjectValue
        ? getByPath(cachedOption.value, props.valueKey) === getByPath(value, props.valueKey)
        : cachedOption.value === value;
      if (isEqualValue) {
        option = {
          index: optionsArray.value
            .filter(opt => !opt.created)
            .indexOf(cachedOption),
          value,
          currentLabel: cachedOption.currentLabel,
          get isDisabled() {
            return cachedOption.isDisabled;
          },
        };
        break;
      }
    }
    if (option) return option;

    const existingSelected = states.selected.find(item =>
      isObjectValue
        ? getByPath(item.value, props.valueKey) === getByPath(value, props.valueKey)
        : item.value === value,
    );
    const label = isObjectValue
      ? value.label
      : existingSelected
        ? existingSelected.currentLabel
        : (value ?? '');
    // const label = isObjectValue ? (value as Record<string, any>).label : (value ?? '');
    const newOption: OptionBasic = {
      index: -1,
      value,
      currentLabel: label as string | number,
    };
    return newOption;
  };

  function setSelected() {
    if (!props.multiple) {
      const value = isArray(props.value) ? props.value[0] : props.value;
      const option = getOption(value as OptionValue);
      // states.selectedLabel = option.currentLabel
      states.selectedLabel = String(option.currentLabel ?? '');
      states.selected = [option];
      return;
    } else {
      states.selectedLabel = '';
    }
    const result: OptionBasic[] = [];
    if (!isUndefined(props.value)) {
      ensureArray(props.value).forEach((value) => {
        result.push(getOption(value));
      });
    }
    states.selected = result;
  }

  function resetCollapseItemWidth() {
    if (!collapseItemRef.value) return;
    states.collapseItemWidth = collapseItemRef.value.getBoundingClientRect().width;
  }

  function updateTooltip() {
    tooltipRef.value?.updatePopper?.();
  }

  function updateTagTooltip() {
    tagTooltipRef.value?.updatePopper?.();
  }

  const onInputChange = () => {
    if (states.inputValue.length > 0 && !expanded.value) {
      expanded.value = true;
    }
    handleQueryChange(states.inputValue);
  };

  const debouncedOnInputChange = useDebounceFn(() => {
    onInputChange();
    debouncing.value = false;
  }, debounce);

  function onInput(event: Event) {
    states.inputValue = (event.target as HTMLInputElement).value;
    if (props.remote) {
      debouncing.value = true;
      debouncedOnInputChange();
    } else {
      return onInputChange();
    }
  }

  const emitChange = (val: OptionValue | OptionValue[]) => {
    if (!looseEqual(props.value, val)) {
      props.onChange(val);
    }
  };

  const getLastNotDisabledIndex = (values: OptionValue[]) =>
    findLastIndex(values, (it) => {
      // const option = states.cachedOptions.get(it)
      const option = cachedOptionMap.get(it);
      // const option = states.cachedOptions.find(o => o.value === it);
      return !option?.disabled && !option?.states.groupDisabled;
    });

  function deletePrevTag(e: KeyboardEvent) {
    const code = getEventCode(e);
    if (!props.multiple) return;
    if (code === EVENT_CODE.delete) return;
    if ((e.target as HTMLInputElement).value.length <= 0) {
      const value = ensureArray(props.value).slice();
      const lastNotDisabledIndex = getLastNotDisabledIndex(value);
      if (lastNotDisabledIndex < 0) return;
      const removeTagValue = value[lastNotDisabledIndex];
      value.splice(lastNotDisabledIndex, 1);
      props.onInput(value);
      emitChange(value);
      props.onRemoveTag(removeTagValue);
    }
  }

  const focus = () => {
    inputRef.value?.focus();
  };

  const blur = () => {
    if (expanded.value) {
      expanded.value = false;
      nextTick(() => inputRef.value?.blur());
      return;
    }
    inputRef.value?.blur();
  };

  function deleteTag(event: MouseEvent, tag: OptionBasic) {
    const index = states.selected.indexOf(tag);
    if (index > -1 && !selectDisabled.value) {
      const value = ensureArray(props.value).slice();
      value.splice(index, 1);
      props.onInput(value);
      emitChange(value);
      props.onRemoveTag(tag.value);
    }
    event.stopPropagation();
    focus();
  }

  function deleteSelected(event: Event) {
    event.stopPropagation();
    // const value = props.multiple ? [] : valueOnClear.value
    const value: OptionValue[] | OptionValue = props.multiple ? [] : props.valueOnClear;
    if (props.multiple) {
      for (const item of states.selected) {
        if (item.isDisabled) (value as OptionValue[]).push(item.value);
      }
    }
    props.onInput(value);
    emitChange(value);
    states.hoveringIndex = -1;
    expanded.value = false;
    props.onClear();
    focus();
  }

  const scrollToOption = (option: OptionPublicInstance | OptionLike[]) => {
    const targetOption = isArray(option) ? option[option.length - 1] : option;

    let target: HTMLElement | null = null;

    if (!isUndefinedOrNull(targetOption?.value)) {
      const options = optionsArray.value.filter(item => item.value === targetOption.value);
      if (options.length > 0) {
        target = options[0].$el;
      }
    }

    if (tooltipRef.value && target) {
      const menu = popperRef.value?.querySelector?.('.el-select-dropdown__wrap');
      if (menu) {
        scrollIntoView(menu as HTMLElement, target);
      }
    }
    tooltipRef.value?.handleScroll();
  };

  function handleOptionSelect(option: OptionPublicInstance) {
    if (props.multiple) {
      const value = ensureArray(props.value ?? []).slice();
      const optionIndex = getValueIndex(value, option);
      if (optionIndex > -1) {
        value.splice(optionIndex, 1);
      } else if (props.multipleLimit <= 0 || value.length < props.multipleLimit) {
        value.push(option.value);
      }
      props.onInput(value);
      emitChange(value);
      if (option.created) {
        handleQueryChange('');
      }
      if (props.filterable && (option.created || !props.reserveKeyword)) {
        states.inputValue = '';
      }
    } else {
      if (!looseEqual(props.value, option.value)) {
        props.onInput(option.value);
      }
      emitChange(option.value);
      expanded.value = false;
    }
    focus();
    if (expanded.value) return;
    nextTick(() => {
      scrollToOption(option);
    });
  }

  function onOptionCreate(vm: OptionPublicInstance) {
    optionMap.set(vm.value, vm);
    cachedOptionMap.set(vm.value, vm);

    // extra
    if (!states.optionValues.includes(vm.value)) {
      states.optionValues.push(vm.value);
    }
    bumpOptions();
  }

  function onOptionDestroy(key: OptionValue, vm: OptionPublicInstance) {
    if (optionMap.get(key) === vm) {
      optionMap.delete(key);
      // extra
      const idx = states.optionValues.indexOf(key);
      if (idx > -1) states.optionValues.splice(idx, 1);
      bumpOptions();
    }
  }

  function handleMenuEnter() {
    states.isBeforeHide = false;
    nextTick(() => {
      tooltipRef.value?.update();
      scrollToOption(states.selected);
    });
  }

  function handleClearClick(event: Event) {
    deleteSelected(event);
  }

  function handleClickOutside(event: Event) {
    expanded.value = false;

    if (isFocused.value) {
      const _event = new FocusEvent('blur', event);
      nextTick(() => handleBlur(_event));
    }
  }

  function handleEsc() {
    if (states.inputValue.length > 0) {
      states.inputValue = '';
    } else {
      expanded.value = false;
    }
  }

  const toggleMenu = (event?: Event) => {
    if (
      selectDisabled.value ||
      (props.filterable && expanded.value && event && !suffixRef.value?.contains(event.target as Node))
    ) return;

    // We only set the inputHovering state to true on mouseenter event on iOS devices
    // To keep the state updated we set it here to true
    if (isIOS) states.inputHovering = true;

    if (states.menuVisibleOnFocus) {
      // controlled by automaticDropdown
      states.menuVisibleOnFocus = false;
    } else {
      expanded.value = !expanded.value;
    }
  };

  function selectOption() {
    if (!expanded.value) {
      toggleMenu();
    } else {
      const option = optionsArray.value[states.hoveringIndex];
      if (option && !option.isDisabled) {
        handleOptionSelect(option);
      }
    }
  }

  const optionsAllDisabled = computed(() =>
    optionsArray.value
      .filter(option => option.visible)
      .every(option => option.isDisabled),
  );

  const showTagList = computed(() => {
    if (!props.multiple) {
      return [];
    }
    return props.collapseTags
      ? states.selected.slice(0, props.maxCollapseTags)
      : states.selected;
  });

  const collapseTagList = computed(() => {
    if (!props.multiple) {
      return [];
    }
    return props.collapseTags
      ? states.selected.slice(props.maxCollapseTags)
      : [];
  });

  function navigateOptions(direction: 'prev' | 'next') {
    if (!expanded.value) {
      expanded.value = true;
      return;
    }
    if (
      optionMap.size === 0 ||
      filteredOptionsCount.value === 0 ||
      isComposing.value
    ) return;

    if (!optionsAllDisabled.value) {
      if (direction === 'next') {
        states.hoveringIndex++;
        // if (states.hoveringIndex === states.options.size) {
        if (states.hoveringIndex === optionMap.size) {
          states.hoveringIndex = 0;
        }
      } else if (direction === 'prev') {
        states.hoveringIndex--;
        if (states.hoveringIndex < 0) {
          // states.hoveringIndex = states.options.size - 1
          states.hoveringIndex = optionMap.size - 1;
        }
      }
      const option = optionsArray.value[states.hoveringIndex];
      if (option?.isDisabled || !option?.visible) {
        navigateOptions(direction);
      }
      nextTick(() => scrollToOption(hoverOption.value as OptionPublicInstance));
    }
  }

  const findFocusableIndex = (
    arr: OptionPublicInstance[],
    start: number,
    step: number,
    len: number,
  ) => {
    for (let i = start; i >= 0 && i < len; i += step) {
      const obj = arr[i];
      if (!obj?.isDisabled && obj?.visible) {
        return i;
      }
    }
    return null;
  };

  const focusOption = (targetIndex: number, mode: 'up' | 'down') => {
    // const len = states.options.size
    const len = optionMap.size;
    if (len === 0) return;
    const start = clamp(targetIndex, 0, len - 1);
    const options = optionsArray.value;
    const direction = mode === 'up' ? -1 : 1;
    const newIndex =
      findFocusableIndex(options, start, direction, len) ??
      findFocusableIndex(options, start - direction, -direction, len);

    if (newIndex != null) {
      states.hoveringIndex = newIndex;
      nextTick(() => scrollToOption(hoverOption.value as OptionPublicInstance));
    }
  };

  function handleKeydown(e: KeyboardEvent) {
    const code = getEventCode(e);
    let isPreventDefault = true;
    switch (code) {
      case EVENT_CODE.up:
        navigateOptions('prev');
        break;
      case EVENT_CODE.down:
        navigateOptions('next');
        break;
      case EVENT_CODE.enter:
      case EVENT_CODE.numpadEnter:
        if (!isComposing.value) {
          selectOption();
        }
        break;
      case EVENT_CODE.esc:
        handleEsc();
        break;
      case EVENT_CODE.backspace:
        isPreventDefault = false;
        deletePrevTag(e);
        return;
      case EVENT_CODE.home:
        if (!expanded.value) return;
        focusOption(0, 'down');
        break;
      case EVENT_CODE.end:
        if (!expanded.value) return;
        focusOption(optionMap.size - 1, 'up');
        break;
      case EVENT_CODE.pageUp:
        if (!expanded.value) return;
        focusOption(states.hoveringIndex - 10, 'up');
        break;
      case EVENT_CODE.pageDown:
        if (!expanded.value) return;
        focusOption(states.hoveringIndex + 10, 'down');
        break;
      default:
        isPreventDefault = false;
        break;
    }
    if (isPreventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const getGapWidth = () => {
    if (!selectionRef.value) return 0;
    const style = window.getComputedStyle(selectionRef.value);
    return Number.parseFloat(style.gap || '6px');
  };

  const tagStyle = computed(() => {
    const gapWidth = getGapWidth();
    const inputSlotWidth =
      props.filterable && !selectDisabled.value
        ? gapWidth + MINIMUM_INPUT_WIDTH
        : 0;
    const collapseSlotWidth =
      collapseItemRef.value && props.maxCollapseTags === 1
        ? states.collapseItemWidth + gapWidth
        : 0;
    const reservedWidth = inputSlotWidth + collapseSlotWidth;
    return { maxWidth: `calc(100% - ${ reservedWidth }px)` };
    // const inputSlotWidth = opts.filterable ? gapWidth + MINIMUM_INPUT_WIDTH : 0;
    // const maxWidth =
    //   collapseItemRef.value && opts.maxCollapseTags === 1
    //     ? states.selectionWidth -
    //       states.collapseItemWidth -
    //       gapWidth -
    //       inputSlotWidth
    //     : states.selectionWidth - inputSlotWidth;
    // return { maxWidth: `${ maxWidth }px` };
  });

  const collapseTagStyle = computed(() => ({ maxWidth: `${ states.selectionWidth }px` }));

  // 这是新增的
  useResizeObserver(selectionRef, function resetSelectionWidth() {
    if (!selectionRef.value) return;
    states.selectionWidth = Number.parseFloat(
      window.getComputedStyle(selectionRef.value).width,
    );
  });
  useResizeObserver(wrapperRef, updateTooltip);
  useResizeObserver(tagMenuRef, updateTagTooltip);
  useResizeObserver(collapseItemRef, resetCollapseItemWidth);

  watch(
    () => dropdownMenuVisible.value,
    (newVal) => {
      // if (newVal) {
      //   stop = useResizeObserver(menuRef, updateTooltip).stop
      // } else {
      //   stop?.()
      //   stop = undefined
      // }
      props.onVisibleChange(newVal);
    },
  );

  let stopOnClickOutside: VoidFunction | undefined;

  onMounted(() => {
    setSelected();
    // 新增的
    stopOnClickOutside = onClickOutside(
      computed(() => tooltipRef.value?.$el as HTMLElement | undefined),
      (event) => {
        if (!dropdownMenuVisible.value) return;
        handleClickOutside(event as Event);
      },
      {
        ignore: [popperRef],
      },
    );
  });

  onBeforeUnmount(() => {
    stopOnClickOutside?.();
  });

  function removeCachedOption(key: OptionValue, vm: OptionPublicInstance) {
    if (cachedOptionMap.get(key) === vm) {
      cachedOptionMap.delete(key);
      bumpOptions();
    }
  }

  return {
    // inputId,
    // contentId,
    // nsSelect,
    // nsInput,
    states,
    isFocused,
    expanded,
    optionsArray,
    hoverOption,
    // hoverOptionId, 新增的
    // selectSize,
    filteredOptionsCount,
    updateTooltip,
    updateTagTooltip,
    debouncedOnInputChange,
    onInput,
    deletePrevTag,
    deleteTag,
    deleteSelected,
    handleOptionSelect,
    scrollToOption,
    hasModelValue,
    shouldShowPlaceholder,
    currentPlaceholder,
    // mouseEnterEventName,
    // needStatusIcon,
    showClearBtn,
    iconComponent,
    iconReverse,
    // validateState,
    // validateIcon,
    showNewOption,
    updateOptions,
    // collapseTagSize,
    setSelected,
    selectDisabled,
    emptyText,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleKeydown,
    onOptionCreate,
    onOptionDestroy,
    removeCachedOption, // 新增的
    handleMenuEnter,
    focus,
    blur,
    handleClearClick,
    handleClickOutside,
    handleEsc,
    toggleMenu,
    selectOption,
    getValueKey,
    navigateOptions,
    dropdownMenuVisible,
    showTagList,
    collapseTagList,
    // popupScroll,
    getOption,
    // endReached,
    optionMap, // 新增的

    // computed style
    tagStyle,
    collapseTagStyle, // 新增的

    popperRef,
    inputRef,
    tooltipRef,
    tagTooltipRef,
    // prefixRef,
    suffixRef,
    // selectRef,
    wrapperRef,
    selectionRef,
    // menuRef,
    tagMenuRef,
    collapseItemRef,
  };
}
