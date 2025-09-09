export type QuiltedImage<T = unknown> = {
  src: string;
  title?: string;
  alt?: string;
  rows?: number;
  cols?: number;
  data?: T;
};

export type ItemClickPayload = {
  item: QuiltedImage;
  index: number;
  event: MouseEvent;
};

export type Options = Partial<BaseOptions>;

export type BaseOptions = {
  cols: number | ((containerWidth: number) => number);
  rowHeight: number;
  gap: number;
  autoResize: boolean;
  injectDefaultCSS: boolean;
  onItemRemove?: (ev: {index: number, image: QuiltedImage}) => void;
  src: (it: QuiltedImage, cellH: number, rows: number, cols: number) => string;
  srcset: (it: QuiltedImage, cellH: number, rows: number, cols: number) => string;
  classNames: { root: string; item: string };
  onItemClick?: (payload: ItemClickPayload) => void;
};

export interface QuiltedInput {
  src: string;
  width: number;
  height: number;
  title?: string;
  [k: string]: any
}

export interface QuiltedOutput {
  src: string;
  cols: number;
  rows: number;
  [k: string]: any
}