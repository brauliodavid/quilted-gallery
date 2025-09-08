export type QuiltedItem<T = unknown> = {
  src: string;
  title?: string;
  alt?: string;
  width?: number;
  height?: number;
  rows?: number;
  cols?: number;
  data?: T;
};

export type ItemClickPayload = {
  item: QuiltedItem;
  index: number;
  event: MouseEvent;
};

export type PackOptions = {
  maxColsPerItem: number;
  maxRowsPerItem: number;
  lookahead: number;
  respectExplicitSpans: boolean;
  allowReorder: boolean;
  heroColsMax: number;
  heroRowsMax: number;
  highlightProb: number;
  maxHighlightsPerRow: number;
  minTotalHeroes: number;
  forceHeroOnFirstRow: boolean;
};

export type Options = Partial<BaseOptions>;

export type BaseOptions = {
  cols: number | ((containerWidth: number) => number);
  rowHeight: number;
  gap: number;
  maxColsPerItem: number;
  maxRowsPerItem: number;
  lookahead: number;
  respectExplicitSpans: boolean;
  allowReorder: boolean;
  highlightProb: number;
  maxHighlightsPerRow: number;
  heroColsMax: number;
  heroRowsMax: number;
  minTotalHeroes: number;
  forceHeroOnFirstRow: boolean;
  items: QuiltedItem[];
  injectDefaultCSS: boolean;
  autoResize: boolean;
  src: (it: QuiltedItem, cellH: number, rows: number, cols: number) => string;
  srcset: (it: QuiltedItem, cellH: number, rows: number, cols: number) => string;
  classNames: { root: string; item: string };
  onItemClick?: (payload: ItemClickPayload) => void;
};