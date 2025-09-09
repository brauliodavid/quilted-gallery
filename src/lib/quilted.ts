import { injectCSS } from "./css";
import type { BaseOptions, Options, QuiltedImage } from "./types";

// src/lib/quilted.ts
export class QuiltedGallery {
  private el: HTMLElement;
  private opts: BaseOptions;
  private images: QuiltedImage[];
  private ro?: ResizeObserver;
  private mounted = false;

  // NEW: keep and reuse item instances
  public items: QuiltedGalleryItem[] = [];

  constructor(el: HTMLElement, images: QuiltedImage[], opts: Partial<BaseOptions> = {}) {
    if (!el) throw new Error('container element required');

    this.opts = {
      cols: 4,
      rowHeight: 121,
      gap: 4,
      autoResize: true,
      injectDefaultCSS: true,
      src: (it) => it.src,
      srcset: () => '',
      classNames: { root: 'qg-root', item: 'qg-item' },
      ...opts
    } as BaseOptions;

    this.el = el;
    this.images = images || [];
    if (this.opts.injectDefaultCSS) injectCSS();
    this.mount();
    this.render();
  }

  setItems(images: QuiltedImage[]) { this.images = images || []; this.render(); return this; }
  updateOptions(patch: Partial<Options>) { Object.assign(this.opts, patch); this.render(); return this; }

  destroy() {
    this.ro?.disconnect();
    for (const c of this.items) c.destroy();
    this.el.innerHTML = '';
    this.items = [];
    this.mounted = false;
  }

  private mount() {
    if (this.mounted) return;
    this.el.classList.add(this.opts.classNames.root);
    if (this.opts.autoResize) {
      this.ro = new ResizeObserver(() => this.render());
      this.ro.observe(this.el);
    }

    // Listen for a command-style event to remove by index
    this.el.addEventListener('removeItem', (ev: Event) => {
      const e = ev as CustomEvent<{ index: number; animate?: boolean }>;
      const idx = e?.detail?.index;
      if (typeof idx === 'number') {
        this.removeAt(idx, { animate: e.detail?.animate });
      }
    });

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

  render() {
    const cols = this.resolveCols();
    this.applyGridStyle(cols);

    const targetLen = this.images.length;

    // add missing tiles (no model mutation)
    while (this.items.length < targetLen) {
      const idx = this.items.length;
      this.createItemAt(idx, { animate: false });
    }

    // remove extra tiles
    while (this.items.length > targetLen) {
      const item = this.items.pop()!;
      item.destroy();
      this.el.removeChild(item.el);
    }

    // sync content/spans
    for (let i = 0; i < targetLen; i++) {
      const it = this.images[i];
      const item = this.items[i];
      item.setIndex(i).applyItem(it);
    }
  }

  private createItemAt(index: number, opts: { animate?: boolean } = {}) {
    const img = this.images[index];
    const item = new QuiltedGalleryItem(img, index, this.opts);

    // insert in DOM at the right position
    const ref = this.el.children[index] || null;
    this.el.insertBefore(item.el, ref);

    // keep tiles array in sync
    this.items.splice(index, 0, item);

    // reindex following cells
    for (let i = index; i < this.items.length; i++) {
      this.items[i].setIndex(i);
    }

    // optional enter animation
    if (opts.animate !== false) {
      item.el.classList.add('qg-enter');

      // Force a style/layout flush to commit the initial state.
      // This guarantees the first append animates as well.
      void item.el.offsetWidth;

      item.el.classList.add('qg-enter-active');

      const onEnd = (e: TransitionEvent) => {
        if (e.target !== item.el) return;
        item.el.classList.remove('qg-enter', 'qg-enter-active');
        item.el.removeEventListener('transitionend', onEnd);
      };
      item.el.addEventListener('transitionend', onEnd, { once: true });
    }

    return item;
  }

  append(image: QuiltedImage, opts: { index?: number, animate?: boolean } = {}) {
    const index = Math.max(0, Math.min(opts.index ?? this.images.length, this.images.length));

    // model
    this.images.splice(index, 0, image);

    // tile (no full re-render needed)
    return this.createItemAt(index, { animate: opts.animate !== false });
  }

  updateItemAt(index: number, patch: Partial<QuiltedImage>, opts: { reflow?: boolean } = {}) {
    const { reflow = false } = opts;
    const model = this.images[index];
    if (!model) return this;

    Object.assign(model, patch); // update model
    const item = this.items[index];
    if (item) item.applyItem(model); // update item view

    if (reflow) this.render(); // optional full reflow
    return this;
  }

  /** Remove one image/tile by index. Optionally animates the reflow of remaining items. */
  removeAt(index: number, opts: { animate?: boolean } = {}) {
    const { animate = true } = opts;

    const model = this.images[index];
    const cell  = this.items[index];
    if (!model || !cell) return this; // out of bounds or already gone

    const doRemove = () => {
      // 1) Update model
      this.images.splice(index, 1);

      // 2) Remove DOM + view instance
      cell.destroy();
      if (cell.el.parentNode === this.el) this.el.removeChild(cell.el);

      // 3) Update items array and reindex following cells
      this.items.splice(index, 1);
      for (let i = index; i < this.items.length; i++) {
        this.items[i].setIndex(i);
      }
    };

    if (animate) {
      // Animate layout shift of the remaining tiles
      this.animate(doRemove);
    } else {
      doRemove();
    }

    // Notify via callback (if provided) and DOM event
    this.opts.onItemRemove?.({ index, image: model });
    this.el.dispatchEvent(new CustomEvent('itemRemoved', {
      detail: { index, item: model },
      bubbles: true, cancelable: true, composed: true
    }));

    return this;
  }

  /** Animate any synchronous DOM mutation that changes layout (rows/cols, add/remove, rowHeight, etc.) */
  animate(mutator: () => void, opts: { duration?: number; easing?: string } = {}) {
    const dur  = opts.duration ?? 300;
    const ease = opts.easing  ?? 'cubic-bezier(.2,.7,.1,1)';

    const els = this.items.map(c => c.el);

    // FIRST: clear transforms / transitions, and temporarily remove enter classes
    const removedEnter = new Map<HTMLElement, string[]>();
    for (const el of els) {
      const toRemove: string[] = [];
      if (el.classList.contains('qg-enter')) toRemove.push('qg-enter');
      if (el.classList.contains('qg-enter-active')) toRemove.push('qg-enter-active');
      if (toRemove.length) {
        removedEnter.set(el, toRemove);
        el.classList.remove(...toRemove);
      }
      el.style.transition = 'none';
      el.style.transform  = '';
    }

    const first = new Map<HTMLElement, DOMRect>();
    for (const el of els) first.set(el, el.getBoundingClientRect());

    // MUTATE
    mutator();

    // Force reflow so LAST reflects the mutation
    this.el.getBoundingClientRect();

    // LAST + INVERT
    const toAnimate: HTMLElement[] = [];
    for (const el of els) {
      const f = first.get(el)!;
      const l = el.getBoundingClientRect();
      const dx = f.left - l.left;
      const dy = f.top  - l.top;
      const sx = f.width  / (l.width  || 1);
      const sy = f.height / (l.height || 1);

      // skip tiny deltas
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 &&
          Math.abs(1 - sx) < 0.01 && Math.abs(1 - sy) < 0.01) {
        el.style.transition = '';
        continue;
      }

      el.style.transformOrigin = '0 0';
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      toAnimate.push(el);
    }

    // PLAY
    requestAnimationFrame(() => {
      for (const el of toAnimate) {
        void el.offsetWidth; // commit start
        el.style.transition = `transform ${dur}ms ${ease}, opacity ${dur}ms ${ease}`;
        el.style.transform  = '';
      }
      // restore transitions/classes after
      setTimeout(() => {
        for (const el of els) el.style.transition = '';
        for (const [el, classes] of removedEnter) el.classList.add(...classes); // optional: re-apply if still entering
      }, dur + 40);
    });
  }
}

export class QuiltedGalleryItem {
  el: HTMLDivElement;
  imgEl: HTMLImageElement;

  private opts: BaseOptions;
  private item: QuiltedImage;
  private index: number;

  constructor(item: QuiltedImage, index: number, opts: BaseOptions) {
    this.opts = opts;
    this.item = item || ({} as QuiltedImage);
    this.index = index;

    this.el = document.createElement('div');
    this.el.className = this.opts.classNames.item;

    this.imgEl = document.createElement('img');
    (this.imgEl as any).loading = 'lazy';
    (this.imgEl as any).decoding = 'async';
    this.el.appendChild(this.imgEl);

    // Single place to wire click behavior
    this.el.addEventListener('click', (ev) => {
      const payload = { item: this.item, index: this.index, event: ev };
      this.opts.onItemClick?.(payload);
      this.el.dispatchEvent(new CustomEvent('itemClick', {
        detail: payload, bubbles: true, cancelable: true, composed: true
      }));
    });

    // Initial apply
    this.applyItem(this.item);
    this.setIndex(this.index);
  }

  /** Update only the index without touching the DOM tree. */
  setIndex(i: number) {
    this.index = i;
    this.el.dataset.index = String(i);
    return this;
  }

  /** Replace the item and refresh spans + image. */
  applyItem(patch: Partial<QuiltedImage>) {
    Object.assign(this.item, patch);
    this.imgEl.alt = this.item.alt || this.item.title || '';
    this.updateGridSpan(this.item.rows ?? 1, this.item.cols ?? 1);
    this.updateImage();
    return this;
  }

  /** Update only spans (when layout changes but image is same). */
  updateGridSpan(rows: number, cols: number) {
    const r = Math.max(1, rows || 1);
    const c = Math.max(1, cols || 1);
    this.el.style.gridRow = `span ${r}`;
    this.el.style.gridColumn = `span ${c}`;
    return this;
  }

  /** Recompute src/srcset (e.g., when rowHeight or spans change). */
  updateImage() {
    const rows = Math.max(1, this.item.rows || 1);
    const cols = Math.max(1, this.item.cols || 1);
    const nextSrc = this.opts.src(this.item, this.opts.rowHeight, rows, cols) || this.item.src;
    const nextSrcset = this.opts.srcset(this.item, this.opts.rowHeight, rows, cols);

    // If it’s the same URL, skip swap anim
    const isSame = this.imgEl.currentSrc === nextSrc || this.imgEl.src === nextSrc;
    if (!isSame) {
      this.imgEl.classList.add('is-swapping');
      const onload = () => {
        this.imgEl.classList.remove('is-swapping');
        this.imgEl.removeEventListener('load', onload);
      };
      this.imgEl.addEventListener('load', onload, { once: true });
    }

    this.imgEl.src = nextSrc;
    if (nextSrcset) this.imgEl.setAttribute('srcset', nextSrcset);
    this.imgEl.alt = this.item.alt || this.item.title || '';

    return this;
  }

  /** Clean up DOM if you’re removing this item. */
  destroy() {
    this.el.replaceChildren();
  }
}

export default QuiltedGallery