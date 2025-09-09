// src/element.ts
import { QuiltedGallery } from '../index';
import type { Options as GalleryOptions, QuiltedImage } from '../index';

export type ElementOptions = GalleryOptions;

const DEFAULTS: Partial<ElementOptions> = {
  cols: 4,
  rowHeight: 121,
  gap: 4,
  injectDefaultCSS: true,
  autoResize: true,
};

const OBSERVED_ATTRS = [
  'cols',
  'row-height',
  'gap',
  'inject-default-css',
  'auto-resize',
  'items-json',
] as const;

function numAttr(el: Element, name: string): number | undefined {
  const v = el.getAttribute(name);
  return v == null ? undefined : Number(v);
}
function boolAttr(el: Element, name: string): boolean | undefined {
  if (!el.hasAttribute(name)) return undefined;
  const v = el.getAttribute(name);
  return v === null || v === '' || v.toLowerCase() === 'true';
}

export class QuiltedGalleryElement extends HTMLElement {
  static tagName = 'quilted-gallery';
  static get observedAttributes() { return OBSERVED_ATTRS as unknown as string[]; }

  #gallery?: QuiltedGallery;
  #items: QuiltedImage[] = [];

  constructor() {
    super();
    // Let it participate in layout by default
    if (!this.style.display) this.style.display = 'block';
  }

  async connectedCallback() {
    // Prefer items-json, else parse light-DOM <img> and wait for them to load
    if (!this.#items.length && this.getAttribute('items-json')) {
      try { this.#items = JSON.parse(this.getAttribute('items-json')!); } catch {}
    } else if (!this.#items.length) {
      this.#items = await this.#parseLightDomAsync();
    }

    // If width is 0 (hidden tab/accordion), wait one frame
    if (this.offsetWidth === 0) await new Promise(requestAnimationFrame);

    this.#ensure();
  }

  disconnectedCallback() {
    this.#gallery?.destroy?.();
    this.#gallery = undefined;
  }

  attributeChangedCallback(name: string) {
    if (name === 'items-json') {
      const raw = this.getAttribute('items-json') ?? '[]';
      try { this.items = JSON.parse(raw); } catch {}
      return;
    }
    if (this.#gallery) this.#applyOptions();
  }

  // -------- Public API (no DOM name collisions) --------
  get items() { return this.#items; }
  set items(v: QuiltedImage[]) {
    this.#items = Array.isArray(v) ? v : [];
    if (this.#gallery) this.#gallery.setItems(this.#items);
  }

  replaceItems(items: QuiltedImage[]) { this.items = items; }

  addItem(item: QuiltedImage) {
    this.#items = [...this.#items, item];
    this.#gallery?.addItem(item);
  }

  updateItemAt(index: number, patch: Partial<QuiltedImage>) {
    if (index < 0 || index >= this.#items.length) return;
    this.#items = this.#items.map((it, i) => i === index ? { ...it, ...patch } : it);
    this.#gallery?.updateItemAt(index, this.#items[index]);
  }

  removeItemAt(index: number) {
    if (index < 0 || index >= this.#items.length) return;
    const copy = this.#items.slice(); copy.splice(index, 1); this.#items = copy;
    this.#gallery?.removeItemAt(index);
  }

  relayout() { this.#gallery?.render(); }

  refresh() {
    this.#gallery?.destroy?.();
    this.#gallery = new QuiltedGallery(this, this.#items, this.#readOptions());
  }

  updateOptions(patch: Partial<ElementOptions>) {
    const next = { ...this.#readOptions(), ...patch };
    if (this.#gallery) this.#gallery.updateOptions(next);
  }

  // -------- Internals --------
  #ensure() {
    if (this.#gallery) return;
    this.#gallery = new QuiltedGallery(this, this.#items, this.#readOptions());
  }

  #readOptions(): ElementOptions {
    return {
      ...DEFAULTS,
      cols: numAttr(this, 'cols') ?? DEFAULTS.cols,
      rowHeight: numAttr(this, 'row-height') ?? DEFAULTS.rowHeight,
      gap: numAttr(this, 'gap') ?? DEFAULTS.gap,
      injectDefaultCSS: boolAttr(this, 'inject-default-css') ?? DEFAULTS.injectDefaultCSS,
      autoResize: boolAttr(this, 'auto-resize') ?? DEFAULTS.autoResize,
    };
  }

  #applyOptions() {
    if (this.#gallery && 'updateOptions' in this.#gallery) {
      this.#gallery.updateOptions(this.#readOptions());
    } else {
      this.refresh();
    }
  }

  async #parseLightDomAsync(): Promise<QuiltedImage[]> {
    const imgs = Array.from(this.querySelectorAll('img')) as HTMLImageElement[];
    if (!imgs.length) return [];
    await Promise.all(
      imgs.filter(img => !img.complete).map(img =>
        new Promise<void>(res => img.addEventListener('load', () => res(), { once: true }))
      )
    );
    return imgs.map(img => ({
      src: img.getAttribute('src') ?? '',
      title: img.getAttribute('title') ?? undefined,
      alt: img.getAttribute('alt') ?? undefined,
      width: img.naturalWidth || undefined,
      height: img.naturalHeight || undefined,
    }));
  }
}

export function register(tagName = QuiltedGalleryElement.tagName) {
  if (!customElements.get(tagName)) customElements.define(tagName, QuiltedGalleryElement);
}

declare global {
  interface HTMLElementTagNameMap {
    'quilted-gallery': QuiltedGalleryElement;
  }
}

