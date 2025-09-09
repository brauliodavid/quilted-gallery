import {planQuiltSpans, QuiltedGallery} from '../../src/index'
import type {QuiltedImage} from '../../src/index'
import images from '../dummy.json'
// import '../src/lib/style.css';
// const images = planQuiltSpans(itemsWithDims, 3)

const el = document.getElementById('app')!;
const btn = document.getElementById('btn')!;
const btn2 = document.getElementById('btn2')!;
const btn3 = document.getElementById('btn3')!;
const btn4 = document.getElementById('btn4')!;
const g = new QuiltedGallery(el, images, {
  cols: 3,
  rowHeight: 140,
  gap: 4,
  onItemClick: ({ item, index, event }) => {
    console.log('clicked via callback', item, index, event);
  }
});

btn.addEventListener('click', () => {
  g.animate(() => {
    g.items[0].applyItem({ rows: 1, cols: 1 });
  });
});

btn2.addEventListener('click', () => {
  g.addItem({
      src: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6',
      title: 'Bike',
      cols: 2,
    }, {index: 0, animate: true})
});

btn3.addEventListener('click', () => {
  g.destroy()
  g.render()
});

btn4.addEventListener('click', () => {
  g.removeItemAt(4)
});

(window as any).g = g; // for quick tinkering in console
