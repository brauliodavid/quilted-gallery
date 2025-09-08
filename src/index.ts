class QuiltedGallery {
  private el: HTMLElement;
  private opts: BaseOptions;
  private items: QuiltedItem[];
  private ro?: ResizeObserver;
  private mounted = false;

  constructor(el: HTMLElement, items: QuiltedItem[], opts: Partial<BaseOptions> = {}) {
    if (!el) throw new Error('container element required');

    this.opts = {
      cols: 4,
      rowHeight: 121,
      gap: 4,
      maxColsPerItem: 3,
      maxRowsPerItem: 3,
      lookahead: 6,
      respectExplicitSpans: true,
      allowReorder: true,
      highlightProb: 0.5,
      maxHighlightsPerRow: 1,
      heroColsMax: 4,
      heroRowsMax: 4,
      minTotalHeroes: 1,
      forceHeroOnFirstRow: true,
      injectDefaultCSS: true,
      autoResize: true,
      src: (it) => it.src,
      srcset: () => '',
      classNames: { root: 'qg-root', item: 'qg-item' },
      ...opts
    };

    this.el = el;
    this.items = items;
    if (this.opts.injectDefaultCSS) injectCSS();
    this.mount();
    this.render();
  }

  setItems(items: QuiltedItem[]) { this.items = items || []; this.render(); return this; }
  updateOptions(patch: Partial<Options>) { Object.assign(this.opts, patch); this.render(); return this; }
  destroy() { this.ro?.disconnect(); this.el.innerHTML = ''; this.mounted = false; }

  private mount() {
    if (this.mounted) return;
    this.el.classList.add(this.opts.classNames.root);
    if (this.opts.autoResize) {
      this.ro = new ResizeObserver(() => this.render());
      this.ro.observe(this.el);
    }
    this.mounted = true;
  }

  private resolveCols() {
    const c = this.opts.cols;
    if (typeof c === 'function') {
      const w = this.el.clientWidth || window.innerWidth || 1024;
      return Math.max(1, Math.floor(c(w)));
    }
    return Math.max(1, Math.floor(c));
  }

  private applyGridStyle(cols: number) {
    this.el.style.display = 'grid';
    this.el.style.gridAutoFlow = 'dense';
    this.el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.el.style.gridAutoRows = `${this.opts.rowHeight}px`;
    this.el.style.gap = `${this.opts.gap}px`;
  }

  private computeView() {
    const cols = this.resolveCols();
    const allDims = this.items.every(i => (i.width ?? 0) > 0 && (i.height ?? 0) > 0);
    if (!allDims) {
      const maxC = Math.max(1, Math.min(cols, this.opts.maxColsPerItem));
      const maxR = Math.max(1, this.opts.maxRowsPerItem);
      return this.items.map(it => ({
        src: it.src, title: it.title || '', alt: it.alt || '',
        cols: it.cols ? clamp(it.cols, 1, maxC) : 1,
        rows: it.rows ? clamp(it.rows, 1, maxR) : 1
      }));
    }
    const p: PackOptions = {
      maxColsPerItem: this.opts.maxColsPerItem,
      maxRowsPerItem: this.opts.maxRowsPerItem,
      lookahead: clamp(this.opts.lookahead, 0, 12),
      respectExplicitSpans: this.opts.respectExplicitSpans,
      allowReorder: this.opts.allowReorder,
      heroColsMax: this.opts.heroColsMax,
      heroRowsMax: this.opts.heroRowsMax,
      highlightProb: this.opts.highlightProb,
      maxHighlightsPerRow: this.opts.maxHighlightsPerRow,
      minTotalHeroes: this.opts.minTotalHeroes,
      forceHeroOnFirstRow: this.opts.forceHeroOnFirstRow
    };
    return packGreedy(this.items, cols, p);
  }

  render() {
    const cols = this.resolveCols();
    this.applyGridStyle(cols);

    const view = this.computeView();
    this.el.innerHTML = '';

    for (let i = 0; i < view.length; i++) {
      const it = view[i];
      const cell = document.createElement('div');
      cell.className = this.opts.classNames.item;
      cell.style.gridColumn = `span ${it.cols}`;
      cell.style.gridRow = `span ${it.rows}`;

      const img = document.createElement('img');
      img.src = this.opts.src(this.items[i] || (it as any), this.opts.rowHeight, it.rows, it.cols) || it.src;
      const ss = this.opts.srcset(this.items[i] || (it as any), this.opts.rowHeight, it.rows, it.cols);
      if (ss) img.setAttribute('srcset', ss);
      img.alt = it.alt || it.title || '';
      img.loading = 'lazy';

      // 👇 Add click handler (fires callback and CustomEvent)
      cell.addEventListener('click', (ev) => {
        const payload = { item: this.items[i] || (it as any), index: i, event: ev };
        // callback
        this.opts.onItemClick?.(payload);
        // DOM event (bubbles so parent can listen)
        this.el.dispatchEvent(new CustomEvent('itemClick', {
          detail: payload,
          bubbles: true,
          cancelable: true,
          composed: true
        }));
      });

      cell.appendChild(img);
      this.el.appendChild(cell);
    }
  }
}

// --- helpers (duplicate lightweight versions so your d.ts stays stable) ---
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

import type { BaseOptions, Options, PackOptions, QuiltedItem } from './lib/types';
// NOTE: implement or import your TypeScript version of packGreedy here:
import { packGreedy } from './lib/quilt'; // you’ll write this in TS
import { injectCSS } from './lib/css'; // you’ll write this in TS

export type { Options, PackOptions, QuiltedItem, ItemClickPayload } from './lib/types';

export default QuiltedGallery;   // default export
// export { QuiltedGallery };       // named export (adds { QuiltedGallery })