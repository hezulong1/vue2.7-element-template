<template>
  <div :class="switchKls" @click.prevent="switchValue">
    <input
      :id="inputId"
      ref="input"
      class="el-switch__input"
      type="checkbox"
      role="switch"
      :aria-checked="checked"
      :aria-disabled="switchDisabled"
      :aria-label="ariaLabel"
      :name="name"
      :true-value="activeValue"
      :false-value="inactiveValue"
      :disabled="switchDisabled"
      :tabindex="tabindex"
      @change="handleChange"
      @keydown.enter="switchValue"
    >
    <span
      v-if="!inlinePrompt && (inactiveIcon || inactiveText || $slots.inactive)"
      :class="['el-switch__label', 'el-switch__label--left', !checked ? 'is-active' : '']"
    >
      <slot name="inactive">
        <span v-if="inactiveIcon" class="el-icon">
          <component :is="inactiveIcon" />
        </span>
        <span v-if="!inactiveIcon && inactiveText" :aria-hidden="checked">{{ inactiveText }}</span>
      </slot>
    </span>
    <span class="el-switch__core" :style="coreStyle">
      <div v-if="inlinePrompt" class="el-switch__inner">
        <div v-if="!checked" class="el-switch__inner-wrapper">
          <slot name="inactive">
            <span v-if="inactiveIcon" class="el-icon">
              <component :is="inactiveIcon" />
            </span>
            <span v-if="!inactiveIcon && inactiveText">{{ inactiveText }}</span>
          </slot>
        </div>
        <div v-else class="el-switch__inner-wrapper">
          <slot name="active">
            <span v-if="activeIcon" class="el-icon">
              <component :is="activeIcon" />
            </span>
            <span v-if="!activeIcon && activeText">{{ activeText }}</span>
          </slot>
        </div>
      </div>
      <div class="el-switch__action">
        <span v-if="loading" class="el-icon is-loading">
          <Loading />
        </span>
        <slot v-else-if="checked" name="active-action">
          <span v-if="activeActionIcon" class="el-icon">
            <component :is="activeActionIcon" />
          </span>
        </slot>
        <slot v-else-if="!checked" name="inactive-action">
          <span v-if="inactiveActionIcon" class="el-icon">
            <component :is="inactiveActionIcon" />
          </span>
        </slot>
      </div>
    </span>
    <span
      v-if="!inlinePrompt && (activeIcon || activeText || $slots.active)"
      :class="['el-switch__label', 'el-switch__label--right', checked ? 'is-active' : '']"
    >
      <slot name="active">
        <span v-if="activeIcon" class="el-icon">
          <component :is="activeIcon" />
        </span>
        <span v-if="!activeIcon && activeText" :aria-hidden="!checked">{{ activeText }}</span>
      </slot>
    </span>
  </div>
</template>

<script lang="ts" setup generic="T extends SwitchValue">
import type { CSSProperties, PropType } from 'vue';
import type { SwitchValue } from './utils';

import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { noop } from '@vueuse/core';
import { Loading } from 'element-icons';

import { isPromise } from '@/utils/types';
import { useSizeProp } from '@/components/base/ConfigProvider';
import { iconPropType } from '@/utils/vue/icon';
import { warn } from '@/utils/debug';
import { addUnit } from '@/utils/dom';
import {
  useFormDisabled,
  useFormItem,
  useFormItemInputId,
  useFormSize,
} from '../../form';

defineOptions({ name: 'ElSwitch' });

const props = defineProps({
  /**
   * @description binding value, it should be equivalent to either `active-value` or `inactive-value`, by default it's `boolean` type
   */
  value: {
    type: [Boolean, String, Number] as unknown as PropType<T>,
    default: false,
  },
  /**
   * @description whether Switch is disabled
   */
  disabled: {
    type: Boolean,
    default: undefined,
  },
  /**
   * @description whether Switch is in loading state
   */
  loading: Boolean,
  /**
   * @description size of Switch
   */
  size: useSizeProp,
  /**
   * @description width of Switch
   */
  width: {
    type: [String, Number] as PropType<string | number>,
    default: '',
  },
  /**
   * @description whether icon or text is displayed inside dot, only the first character will be rendered for text
   */
  inlinePrompt: Boolean,
  /**
   * @description component of the icon displayed in action when in `off` state
   */
  inactiveActionIcon: iconPropType,
  /**
   * @description component of the icon displayed in action when in `on` state
   */
  activeActionIcon: iconPropType,
  /**
   * @description component of the icon displayed when in `on` state, overrides `active-text`
   */
  activeIcon: iconPropType,
  /**
   * @description component of the icon displayed when in `off` state, overrides `inactive-text`
   */
  inactiveIcon: iconPropType,
  /**
   * @description text displayed when in `on` state
   */
  activeText: {
    type: String,
    default: '',
  },
  /**
   * @description text displayed when in `off` state
   */
  inactiveText: {
    type: String,
    default: '',
  },
  /**
   * @description switch value when in `on` state
   */
  activeValue: {
    type: [Boolean, String, Number] as PropType<SwitchValue>,
    default: true,
  },
  /**
   * @description switch value when in `off` state
   */
  inactiveValue: {
    type: [Boolean, String, Number] as PropType<SwitchValue>,
    default: false,
  },
  /**
   * @description input name of Switch
   */
  name: {
    type: String,
    default: '',
  },
  /**
   * @description whether to trigger form validation
   */
  validateEvent: {
    type: Boolean,
    default: true,
  },
  /**
   * @description before-change hook before the switch state changes. If `false` is returned or a `Promise` is returned and then is rejected, will stop switching
   */
  beforeChange: Function as PropType<() => boolean | Promise<boolean>>,
  /**
   * @description id for input
   */
  id: String,
  /**
   * @description tabindex for input
   */
  tabindex: [String, Number] as PropType<string | number>,
  activeColor: String,
  inactiveColor: String,
  borderColor: String,
  ariaLabel: String,
});
const emit = defineEmits<{
  (type: 'input', val: T): void;
  (type: 'change', val: T): void;
}>();

const { formItem } = useFormItem();
const switchSize = useFormSize();

const { inputId } = useFormItemInputId(props, {
  formItemContext: formItem,
});

const input = shallowRef<HTMLInputElement>();
const isControlled = ref(props.value !== false);
const actualValue = computed(() => isControlled.value ? props.value : false);
const checked = computed(() => actualValue.value === props.activeValue);

const switchDisabled = useFormDisabled(
  computed(() => {
    if (props.loading) {
      return true;
    }
    return undefined;
  }),
);

const switchKls = computed(() => {
  const cls = ['el-switch'];
  if (switchSize.value) cls.push(`el-switch--${ switchSize.value }`);
  if (switchDisabled.value) cls.push('is-disabled');
  if (checked.value) cls.push('is-checked');
  return cls;
});

const coreStyle = computed(() => {
  const s: CSSProperties = {
    width: addUnit(props.width),
  };

  if (checked.value) {
    if (props.activeColor) {
      s.backgroundColor = props.activeColor;
      s.borderColor = props.activeColor;
    }
  } else {
    if (props.inactiveColor) {
      s.backgroundColor = props.inactiveColor;
      s.borderColor = props.inactiveColor;
    }
  }

  if (props.borderColor) {
    s.borderColor = props.borderColor;
  }

  return s;
});

watch(
  () => props.value,
  () => {
    isControlled.value = true;
  },
);

if (![props.activeValue, props.inactiveValue].includes(actualValue.value)) {
  warn('[switch] model-value must be active-value or inactive-value');
  emit('change', props.inactiveValue as T);
  emit('input', props.inactiveValue as T);
}

watch(checked, (val) => {
  input.value!.checked = val;

  if (props.validateEvent) {
    formItem?.validate?.('change').catch(noop);
  }
});

const handleChange = () => {
  const val = (checked.value ? props.inactiveValue : props.activeValue) as T;
  emit('change', val);
  emit('input', val);
  nextTick(() => {
    input.value!.checked = checked.value;
  });
};

const switchValue = () => {
  if (switchDisabled.value) return;

  const { beforeChange } = props;
  if (!beforeChange) {
    handleChange();
    return;
  }

  const shouldChange = beforeChange();

  const isPromiseOrBool = [
    isPromise(shouldChange),
    typeof shouldChange === 'boolean',
  ].includes(true);
  if (!isPromiseOrBool) {
    throw new TypeError(
      `[switch] beforeChange must return type \`Promise<boolean>\` or \`boolean\`, but got ${ typeof shouldChange }`,
    );
  }

  if (isPromise(shouldChange)) {
    shouldChange
      .then((result) => {
        if (result) {
          handleChange();
        }
      })
      .catch((e) => {
        warn(`[switch] some error occurred: ${ e }`);
      });
  } else if (shouldChange) {
    handleChange();
  }
};

const focus = (): void => {
  input.value?.focus?.();
};

onMounted(() => {
  input.value!.checked = checked.value;
});

defineExpose({
  /**
   *  @description manual focus to the switch component
   * */
  focus,
  /**
   * @description whether Switch is checked
   */
  checked,
});
</script>
