export type InputType = 'text' | 'textarea' | 'email' | 'tel' | 'hidden' | 'password' | 'search' | 'url' | (string & NonNullable<unknown>);
export type InputAutoComplete = 'on' | 'off' | (string & NonNullable<unknown>);
export type InputAutoSize = { minRows?: number; maxRows?: number } | boolean;
export type InputResize = 'none' | 'both' | 'horizontal' | 'vertical';
