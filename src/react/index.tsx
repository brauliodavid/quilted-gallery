import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react';

import type { QuiltedImage, Options as ElementOptions } from '../index';
import { register } from '../element'; // local import (builds to dist/element.js)

/** Imperative API you can use via ref */
export type QuiltedGalleryRef = {
  /** underlying <quilted-gallery> element */
  element: HTMLElement | null;
  replaceItems(items: QuiltedImage[]): void;
  addItem(item: QuiltedImage): void;
  updateItemAt(index: number, patch: Partial<QuiltedImage>): void;
  removeItemAt(index: number): void;
  relayout(): void;         // cheap reflow
  refresh(): void;          // full rebuild
  updateOptions(patch: Partial<ElementOptions>): void;
};

/** Props for the React component */
export type QuiltedGalleryProps = {
  /** Items to render (you can also pass <img> children instead) */
  items?: QuiltedImage[];

  /** Options you want to pass programmatically (functions/callbacks go here) */
  options?: Partial<ElementOptions>;

  /** Convenience props for common numeric/boolean options (optional) */
  cols?: number | ElementOptions['cols']; // number or (w)=>number
  rowHeight?: number;
  gap?: number;
  autoResize?: boolean;
  injectDefaultCSS?: boolean;

  /** Callbacks — these are forwarded to options.onItemClick / onItemRemove */
  onItemClick?: ElementOptions['onItemClick'];
  onItemRemove?: ElementOptions['onItemRemove'];

  /** Regular DOM props */
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onClick'>;

export const QuiltedGallery = forwardRef<QuiltedGalleryRef, QuiltedGalleryProps>(
  (
    {
      items,
      options,
      cols,
      rowHeight,
      gap,
      autoResize,
      injectDefaultCSS,
      onItemClick,
      onItemRemove,
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    const elRef = useRef<any>(null);

    // Define the custom element on the client
    useEffect(() => {
      if (typeof window !== 'undefined') register();
    }, []);

    // Set primitive attributes (number/bool) on the element
    useEffect(() => {
      const el = elRef.current;
      if (!el) return;

      // numbers -> attributes
      if (typeof cols === 'number') el.setAttribute('cols', String(cols));
      else el.removeAttribute('cols');

      if (rowHeight != null) el.setAttribute('row-height', String(rowHeight));
      else el.removeAttribute('row-height');

      if (gap != null) el.setAttribute('gap', String(gap));
      else el.removeAttribute('gap');

      // booleans -> presence/absence
      if (autoResize != null) {
        if (autoResize) el.setAttribute('auto-resize', '');
        else el.removeAttribute('auto-resize');
      }
      if (injectDefaultCSS != null) {
        if (injectDefaultCSS) el.setAttribute('inject-default-css', '');
        else el.removeAttribute('inject-default-css');
      }
    }, [cols, rowHeight, gap, autoResize, injectDefaultCSS]);

    // Pass items (controlled)
    useEffect(() => {
      const el = elRef.current;
      if (!el || !items) return;
      el.replaceItems(items);
    }, [items]);

    // Pass options and callbacks (functions must go through updateOptions)
    useEffect(() => {
      const el = elRef.current;
      if (!el) return;
      const patch: Partial<ElementOptions> = {
        ...(options || {}),
        ...(typeof cols === 'function' ? { cols } : {}),
        ...(onItemClick ? { onItemClick } : {}),
        ...(onItemRemove ? { onItemRemove } : {}),
      };
      if (Object.keys(patch).length) el.updateOptions(patch);
    }, [options, cols, onItemClick, onItemRemove]);

    // Wire DOM events (works even if you don't supply callbacks in options)
    useEffect(() => {
      const el = elRef.current;
      if (!el) return;

      const handleClick = (e: any) => onItemClick?.(e.detail);
      const handleRemoved = (e: any) => onItemRemove?.(e.detail);

      // core uses camelCase; you might also re-emit dash-case in the element
      el.addEventListener('itemClick', handleClick);
      el.addEventListener('itemRemoved', handleRemoved);
      el.addEventListener('item-click', handleClick);
      el.addEventListener('item-removed', handleRemoved);

      return () => {
        el.removeEventListener('itemClick', handleClick);
        el.removeEventListener('itemRemoved', handleRemoved);
        el.removeEventListener('item-click', handleClick);
        el.removeEventListener('item-removed', handleRemoved);
      };
    }, [onItemClick, onItemRemove]);

    // Imperative API
    useImperativeHandle(ref, () => ({
      element: elRef.current,
      replaceItems: (its) => elRef.current?.replaceItems(its),
      addItem: (it) => elRef.current?.addItem(it),
      updateItemAt: (i, p) => elRef.current?.updateItemAt(i, p),
      removeItemAt: (i) => elRef.current?.removeItemAt(i),
      relayout: () => elRef.current?.relayout(),
      refresh: () => elRef.current?.refresh(),
      updateOptions: (p) => elRef.current?.updateOptions(p),
    }), []);

    return (
      <quilted-gallery
        ref={elRef}
        className={className}
        style={style}
        {...rest}
      >
        {children /* optional: <img> children as fallback */}
      </quilted-gallery>
    );
  }
);

// Named + default export for convenience
export default QuiltedGallery;

// TSX: teach JSX about the tag so TS stops complaining
// at the bottom of src/react.tsx or in src/types/jsx-quilted.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'quilted-gallery': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'items-json'?: string;
        'cols'?: number | string;
        'row-height'?: number | string;
        'gap'?: number | string;
        'auto-resize'?: '' | 'true' | 'false';
        'inject-default-css'?: '' | 'true' | 'false';
      };
    }
  }
}

