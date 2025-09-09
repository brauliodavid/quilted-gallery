import {planQuiltSpans, QuiltedGallery} from '../../src/index'
import type {QuiltedImage} from '../../src/index'
// import '../src/lib/style.css';

const items: QuiltedImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e',
    title: 'Breakfast',
    rows: 2,
    cols: 2,
  },
  {
    src: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d',
    title: 'Burger',
  },
  {
    src: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45',
    title: 'Camera',
  },
  {
    src: 'https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c',
    title: 'Coffee',
    cols: 2,
  },
  {
    src: 'https://images.unsplash.com/photo-1533827432537-70133748f5c8',
    title: 'Hats',
    cols: 2,
  },
  // {
  //   src: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62',
  //   title: 'Honey',
  //   rows: 2,
  //   cols: 2,
  // },
  {
    src: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6',
    title: 'Basketball',
  },
  {
    src: 'https://images.unsplash.com/photo-1518756131217-31eb79b20e8f',
    title: 'Fern',
  },
  // {
  //   src: 'https://images.unsplash.com/photo-1597645587822-e99fa5d45d25',
  //   rows: 2,
  //   cols: 2,
  // },
  // {
  //   src: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af',
  //   title: 'Tomato basil',
  // },
  // {
  //   src: 'https://images.unsplash.com/photo-1471357674240-e1a485acb3e1',
  //   title: 'Sea star',
  // },
  // {
  //   src: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6',
  //   title: 'Bike',
  //   cols: 2,
  // },
];

let itemsWithDims = [
  { src: "https://picsum.photos/id/1015/600/900", width: 600, height: 900, title: "Portrait 1" }, // portrait
  { src: "https://picsum.photos/id/1016/900/600", width: 900, height: 600, title: "Landscape 1" }, // landscape
  { src: "https://picsum.photos/id/1018/800/800", width: 800, height: 800, title: "Square 1" },   // square
  { src: "https://picsum.photos/id/1024/1200/800", width: 1200, height: 800, title: "Landscape 2" }, // landscape
  { src: "https://picsum.photos/id/1035/500/1000", width: 500, height: 1000, title: "Portrait 2" }, // portrait
  { src: "https://picsum.photos/id/1042/1024/1024", width: 1024, height: 1024, title: "Square 2" }, // square
  { src: "https://picsum.photos/id/1043/700/1050", width: 700, height: 1050, title: "Portrait 3" }, // portrait
  { src: "https://picsum.photos/id/1050/1400/933", width: 1400, height: 933, title: "Landscape 3" }, // landscape
];

const images = planQuiltSpans(itemsWithDims, 3)

// console.log(images)

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
