export default Object.fromEntries(
  Object.entries(import.meta.glob('./src/*.ts'))
    .map(([path, loadLocale]) => [path.match(/([\w-]*)\.ts$/)?.[1], loadLocale]),
) as Record<Language, () => Promise<{ default: LocaleMessages }>>;

export interface TranslatePair {
  [key: string]: string | string[] | TranslatePair;
}

export type Language = string;

export interface LocaleMessages {
  name: Language;
  el: TranslatePair;
  pro: TranslatePair;
}
