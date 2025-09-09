import React, { useRef, useState } from 'react';
import { QuiltedGallery, type QuiltedGalleryRef } from 'quilted-gallery/react';

export default function App() {
  const ref = useRef<QuiltedGalleryRef>(null);
  const [items, setItems] = useState([
    { src: '/img/a.jpg', width: 1200, height: 800, title: 'A' },
    { src: '/img/b.jpg', width: 900,  height: 1200, title: 'B' }
  ]);

  return (
    <div style={{ padding: 16 }}>
      <QuiltedGallery
        ref={ref}
        items={items}
        cols={4}
        rowHeight={160}
        gap={4}
        autoResize
        onItemClick={({ index }) => console.log('click', index)}
        onItemRemove={({ index }) => console.log('removed', index)}
        style={{ width: '100%', border: '1px solid #eee' }}
      />

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={() => ref.current?.addItem({ src: '/img/c.jpg', width: 1000, height: 1000, title: 'C' })}>
          Append
        </button>
        <button onClick={() => ref.current?.removeItemAt(0)}>Remove #0</button>
        <button onClick={() => ref.current?.relayout()}>Relayout</button>
        <button onClick={() => ref.current?.refresh()}>Full refresh</button>
        <button onClick={() => ref.current?.updateOptions({ cols: w => (w < 600 ? 2 : 4) })}>
          Responsive cols
        </button>
      </div>
    </div>
  );
}
