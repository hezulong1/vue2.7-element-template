import type { InjectionKey, Ref } from 'vue';
import type { MaybeRefOrGetter } from '@vueuse/core';
import type { FieldPath } from '@/utils/typingUtils';
import type { LocaleMessages } from '@/locales';
import type { defaultLocale } from '@/locales/utils';

import { computed, shallowRef, watchEffect } from 'vue';
import { toValue } from '@vueuse/core';
import { useConfigProvider } from '@/components/base/ConfigProvider';
import { format } from '@/utils/string';
import { getByPath } from '@/utils/object';

export type LocaleKeys =
  | Exclude<FieldPath<typeof defaultLocale>, 'name' | 'el'>
  | (string & {});

export type TranslatorOption = Record<string, string | number>;
export type Translator = (path: LocaleKeys, option?: TranslatorOption) => string;
export interface LocaleContext {
  locale: Ref<LocaleMessages>;
  lang: Ref<string>;
  t: Translator;
}

export const localeContextKey: InjectionKey<Ref<LocaleMessages | undefined>> = Symbol('localeContextKey');

export const translate = (
  path: LocaleKeys,
  option: undefined | TranslatorOption,
  locale: LocaleMessages,
) => format(getByPath(locale, path) || '', option);

export const buildTranslator =
  (locale: MaybeRefOrGetter<LocaleMessages>): Translator =>
    (path, option) =>
      translate(path, option, toValue(locale));

export function useLocale() {
  const config = useConfigProvider();
  const locale = shallowRef();
  const lang = computed(() => locale.value.name);

  watchEffect(() => {
    locale.value = config.locale;
  }, { flush: 'sync' });

  return {
    lang,
    locale,
    t: buildTranslator(locale),
  };
}
