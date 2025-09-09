import { QuiltedGallery as QG } from '../index';
import type { QuiltedImage, Options, BaseOptions } from '../index';

export type ElementOptions = Partial<Options>;

export class QuiltedGalleryElement extends HTMLElement {
  static tagName = 'quilted-gallery';

  // Core instance + local state
  #gallery: QG | null = null;
  #items: QuiltedImage[] = [];
  #options: ElementOptions = { cols: 4, rowHeight: 121, gap: 4, injectDefaultCSS: true, autoResize: true };

  constructor() {
    super();
    if (!this.style.display) this.style.display = 'block';
  }

  connectedCallback() {
    // Handle pre-upgrade property sets: el.items = [...] before customElements.define()
    this.#upgradeProperty('items');
    this.#upgradeProperty('options');

    // If no items set programmatically, try items-json or <img> fallback
    if (!this.#items.length) {
      const raw = this.getAttribute('items-json');
      if (raw) {
        try { this.#items = JSON.parse(raw); } catch {}
      }
    }

    // If width is 0 (hidden tab/accordion), wait a frame
    if (this.offsetWidth === 0) {
      requestAnimationFrame(() => this.#ensure());
    } else {
      this.#ensure();
    }
  }

  disconnectedCallback() {
    this.#gallery?.destroy?.();
    this.#gallery = null;
  }

  // ---------- Public properties (React-style) ----------
  get items(): QuiltedImage[] {
    return this.#items;
  }
  set items(v: QuiltedImage[]) {
    this.#items = Array.isArray(v) ? v : [];
    this.#gallery ? this.#gallery.setItems(this.#items) : void 0;
  }

  get options(): ElementOptions {
    return this.#options;
  }
  set options(patch: ElementOptions) {
    this.#options = { ...this.#options, ...(patch || {}) };
    this.#gallery ? this.#gallery.patchOptions(this.#options) : void 0;
  }

  // ---------- Convenience API (no DOM name collisions) ----------
  setItems(items: QuiltedImage[]) { this.items = items; }
  addItem(item: QuiltedImage) { this.#items = [...this.#items, item]; this.#gallery?.addItem(item); }
  updateItemAt(index: number, patch: Partial<QuiltedImage>) { this.#gallery?.updateItemAt(index, patch); }
  removeItemAt(index: number) {
    if (index < 0 || index >= this.#items.length) return;
    this.#items = this.#items.slice(0, index).concat(this.#items.slice(index + 1));
    this.#gallery?.removeItemAt(index);
  }

  relayout() { this.#gallery?.render(); }
  refresh() {
    this.#gallery?.destroy?.();
    this.#gallery = null;
    this.#ensure();
  }

  patchOptions(patch: Partial<BaseOptions>){
    this.options = patch
  }

  // ---------- Internals ----------
  #ensure() {
    if (this.#gallery) return;
    this.#gallery = new QG(this, this.#items, this.#options);
    // Optional: bridge camelCase events to dash-case for framework ergonomics
    this.addEventListener('itemClick' as any, (ev: Event) => {
      this.dispatchEvent(new CustomEvent('item-click', { detail: (ev as CustomEvent).detail, bubbles: true, composed: true }));
    });
    this.addEventListener('itemRemoved' as any, (ev: Event) => {
      this.dispatchEvent(new CustomEvent('item-removed', { detail: (ev as CustomEvent).detail, bubbles: true, composed: true }));
    });
  }

  #upgradeProperty(name: 'items' | 'options') {
    // If a property was set before upgrade, re-apply it so our setter runs
    // (classic web components pattern)
    // @ts-ignore
    if (Object.prototype.hasOwnProperty.call(this, name)) {
      // @ts-ignore
      const value = this[name];
      // @ts-ignore
      delete this[name];
      // @ts-ignore
      this[name] = value;
    }
  }
}

// Tree-shakable registration
// element/element.ts (or element/index.ts)

declare global { interface Window { __QG_DEFINED__?: boolean } }

export function register(tagName = QuiltedGalleryElement.tagName) {
  if (typeof window === 'undefined' || !('customElements' in window)) return;

  const name = String(tagName).trim().toLowerCase();
  if (!/-/.test(name)) return; // CE names must contain a hyphen

  if (window.__QG_DEFINED__) return;          // already registered in this runtime
  if (customElements.get(name)) {             // registry already has it
    window.__QG_DEFINED__ = true;
    return;
  }

  try {
    customElements.define(name, QuiltedGalleryElement);
    window.__QG_DEFINED__ = true;
  } catch (err: any) {
    const msg = String(err?.message || '');
    // Ignore second define or polyfill quirks
    if (err?.name === 'NotSupportedError' || /already been defined/i.test(msg)) {
      window.__QG_DEFINED__ = true;
      return;
    }
    throw err;
  }
}
