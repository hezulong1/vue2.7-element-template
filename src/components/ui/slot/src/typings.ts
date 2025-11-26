export interface RenderAppInstance {
  update(): void;
}

export type ForwardRefSetter = (el: Element | null) => void;
