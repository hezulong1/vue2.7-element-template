import type { InjectionKey } from 'vue';
import type { ComponentSize } from '@/components/base/ConfigProvider';

export type AvatarShape = 'circle' | 'square';
export type AvatarSize = number | ComponentSize;

export interface AvatarGroupContext {
  size?: AvatarSize;
  shape?: AvatarShape;
}

export const avatarGroupContextKey: InjectionKey<AvatarGroupContext> = Symbol('avatarGroupContextKey');
