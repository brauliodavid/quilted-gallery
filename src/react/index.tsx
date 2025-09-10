import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { QuiltedGallery as QG } from '../index';
import type { QuiltedImage, Options } from '../index';

export type QuiltedGalleryRef = {
  /** Live handle to the underlying QuiltedGallery instance */
  readonly gallery: QG | null;
};

export type QuiltedGalleryProps = {
  images: QuiltedImage[];
  options?: Partial<Options>;
  className?: string;
  style?: React.CSSProperties;
};

export const QuiltedGallery = forwardRef<QuiltedGalleryRef, QuiltedGalleryProps>(
  ({ images, options, className, style }, ref) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const galleryRef = useRef<QG | null>(null);

    // create once
    useEffect(() => {
      if (!mountRef.current) return;
      galleryRef.current = new QG(mountRef.current, images ?? [], options ?? {});
      return () => {
        galleryRef.current?.destroy?.();
        galleryRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // create only on mount

    // keep items in sync
    useEffect(() => {
      galleryRef.current?.setImages(images ?? []);
    }, [images]);

    // keep options in sync (only when provided)
    useEffect(() => {
      if (options) galleryRef.current?.patchOptions(options);
    }, [options]);

    // expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        get gallery() {
          return galleryRef.current;
        },
      }),
      []
    );

    return <div ref={mountRef} className={className} style={style} />;
  }
);

export default QuiltedGallery;
