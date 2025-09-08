/** Deterministic 0..1 rng from string */
export function stableRand01(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i); // h*33 + c
  return ((h >>> 0) % 100000) / 100000;
}

/** Generate a srcset string for responsive images */
export function srcset(url: string, base: number, rows = 1, cols = 1): string {
  const w = Math.round(base * cols);
  const h = Math.round(base * rows);
  const sep = url.includes('?') ? '&' : '?';
  const base1x = `${url}${sep}w=${w}&h=${h}&fit=crop&auto=format`;
  const base2x = `${url}${sep}w=${w * 2}&h=${h * 2}&fit=crop&auto=format`;
  return `${base1x}, ${base2x} 2x`;
}

/** Generate a single src URL */
export function srcUrl(url: string, base: number, rows = 1, cols = 1): string {
  const w = Math.round(base * cols);
  const h = Math.round(base * rows);
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}w=${w}&h=${h}&fit=crop&auto=format`;
}
