// src/index.ts (add this near the bottom, outside the class)

// make sure we only inject once
let cssInjected = false;

export function injectCSS() {
  if (cssInjected) return;
  const css = `
.qg-root { display:grid; grid-auto-flow:dense; }
.qg-item { position:relative; overflow:hidden; }
.qg-item > img { width:100%; height:100%; display:block; object-fit:cover; }
  `.trim();

  const style = document.createElement('style');
  style.setAttribute('data-quilted-gallery', 'true');
  style.textContent = css;
  document.head.appendChild(style);
  cssInjected = true;
}
