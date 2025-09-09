// src/index.ts (add this near the bottom, outside the class)

// make sure we only inject once
let cssInjected = false;

export function injectCSS() {
  if (cssInjected) return;
  const css = `
    .qg-root { display:grid; grid-auto-flow:dense; }
    .qg-item { position:relative; overflow:hidden;
      transition: transform .28s ease, opacity .28s ease, box-shadow .28s ease;
      will-change: transform, opacity;
    }
    .qg-item > img { width:100%; height:100%; display:block; object-fit:cover;
      transition: opacity .25s ease, filter .35s ease, transform .35s ease;
      will-change: opacity, filter, transform;
    }

    /* image swap (when src changes) */
    .qg-item > img.is-swapping { opacity:0; filter: blur(6px) saturate(.95); }

    /* enter anim (on append) */
    .qg-item.qg-enter { transform: scale(.96); opacity:0; }
    .qg-item.qg-enter-active { transform:none; opacity:1; }

    /* optional hover micro-anim */
    .qg-item.qg-hover { transform: translateZ(0) scale(1.015); box-shadow: 0 8px 28px rgba(0,0,0,.25); }

    /* respect prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .qg-item, .qg-item > img { transition: none !important; }
    }
  `.trim();

  const style = document.createElement('style');
  style.setAttribute('data-quilted-gallery', 'true');
  style.textContent = css;
  document.head.appendChild(style);
  cssInjected = true;
}
