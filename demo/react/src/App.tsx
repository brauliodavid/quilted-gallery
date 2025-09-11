import { useEffect, useRef, useState } from 'react';
import { QuiltedGallery, type QuiltedGalleryRef } from 'quilted-gallery/react';
import { QuiltedGallery as QG, QuiltedImage } from 'quilted-gallery';
import items from '../../dummy.json'

const images: QuiltedImage[] = items

export default function App() {
  const ref = useRef<QuiltedGalleryRef>(null);
  const [gallery, setGallery] = useState<QG>(null);

  const add = () => gallery?.addItem(images[2]);
  const relayout = () => {
    gallery?.destroy()
    gallery?.render()
  };

  useEffect(() => {
    if(ref?.current){
      setGallery(ref.current.gallery as any)
    }
  }, [ref])

  return (
    <div style={{'width': '428px'}}>
      <button onClick={add}>Add</button>
      <button onClick={relayout}>Relayout</button>
      <QuiltedGallery
        ref={ref}
        images={images}
        options={{
          cols: (w) => (w < 600 ? 2 : 4),
          gap: 4,
          onImageClick: ({ index }) => console.log('click', index),
        }}
      />
    </div>
  );
}
