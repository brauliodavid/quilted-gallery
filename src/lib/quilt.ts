// src/quilt.ts
import type { PackOptions, QuiltedItem } from './types';
import { stableRand01 } from './utils';

type ViewItem = Required<Pick<QuiltedItem, 'src' | 'title' | 'alt' | 'rows' | 'cols'>>;

// ----------------- Algorithms -----------------
export function packGreedy(
  items: QuiltedItem[],
  colsPerRow: number,
  opts: PackOptions
) {
  type Place = { idx: number; rows: number; cols: number; x: number; y: number; hero?: boolean };
  const out: ViewItem[] = [];

  const maxC = Math.max(1, Math.min(colsPerRow, opts.maxColsPerItem, opts.heroColsMax));
  const maxR = Math.max(1, Math.min(opts.maxRowsPerItem, opts.heroRowsMax));

  const aspect: number[] = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    const w = items[i].width as number, h = items[i].height as number;
    aspect[i] = (w > 0 && h > 0) ? (w / h) : 1;
  }

  const H = new Array(colsPerRow).fill(0);
  const clampRows = (r: number) => Math.max(1, Math.min(r, maxR));
  const clampCols = (c: number) => Math.max(1, Math.min(c, maxC));

  const computeBestSlots = (): { x: number; y: number }[] => {
    const slots: { x: number; y: number }[] = new Array(maxC + 1);
    for (let w = 1; w <= maxC; w++) {
      let bestX = 0, bestY = Number.POSITIVE_INFINITY;
      for (let x = 0; x + w <= colsPerRow; x++) {
        let y = 0;
        for (let k = 0; k < w; k++) if (H[x + k] > y) y = H[x + k];
        if (y < bestY) { bestY = y; bestX = x; }
      }
      slots[w] = { x: bestX, y: bestY === Number.POSITIVE_INFINITY ? 0 : bestY };
    }
    return slots;
  };

  const candidatesFor = (i: number, widthLimit: number): Array<{ rows: number; cols: number; hero?: boolean }> => {
    const it = items[i], a = aspect[i];
    const cands: Array<{ rows: number; cols: number; hero?: boolean }> = [];

    if (opts.respectExplicitSpans && it.cols && it.rows) {
      cands.push({ rows: clampRows(it.rows), cols: clampCols(Math.min(it.cols, widthLimit)) });
      return cands;
    }

    let cols1 = clampCols(Math.min(Math.max(1, Math.round(a * 1)), widthLimit));
    cands.push({ rows: 1, cols: cols1 });
    if (cols1 > 1) cands.push({ rows: 1, cols: cols1 - 1 });

    if (stableRand01((it.src || '') + '|hero-lite') < Math.min(0.08, opts.highlightProb)) {
      if (a >= 1) {
        const r = clampRows(Math.min(2, maxR));
        let c = clampCols(Math.min(Math.max(2, Math.round(a * r)), widthLimit));
        if (c > cols1) cands.push({ rows: r, cols: c, hero: true });
      } else {
        let c = clampCols(Math.min(Math.max(2, Math.round(1 / Math.max(a, 1e-6))), widthLimit));
        const r = clampRows(Math.max(1, Math.round(c / Math.max(a, 1e-6))));
        if (c > cols1) cands.push({ rows: r, cols: c, hero: true });
      }
    }

    const seen = new Set<string>();
    return cands.filter(c => {
      const k = c.rows + 'x' + c.cols + (c.hero ? 'h' : '');
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  };

  const q: number[] = items.map((_, i) => i);
  const placed: Place[] = [];
  let heroesPlaced = 0;

  while (q.length) {
    const window = opts.allowReorder ? Math.min(opts.lookahead, q.length) : 1;
    const slots = computeBestSlots();

    let best = { qi: -1, rows: 1, cols: 1, x: 0, y: 0, hero: false, score: Number.POSITIVE_INFINITY };

    let minY = Math.min(...H), run = 0, bestRun = 1;
    for (let c = 0; c < colsPerRow; c++) {
      if (H[c] === minY) { run++; if (run > bestRun) bestRun = run; }
      else run = 0;
    }
    const widthLimit = clampCols(bestRun);

    for (let k = 0; k < window; k++) {
      const qi = q[k];
      const a = aspect[qi];
      const cands = candidatesFor(qi, widthLimit);
      for (const c of cands) {
        const sl = slots[c.cols]; if (!sl) continue;
        const err = Math.abs((c.cols / c.rows) - a) + (c.hero ? -0.01 : 0);
        const score = err * 1e-3 + sl.y * 1e-6 + sl.x * 1e-7;
        if (score < best.score) {
          best = { qi: k, rows: c.rows, cols: c.cols, x: sl.x, y: sl.y, hero: !!c.hero, score };
        }
      }
    }

    if (best.qi === -1) {
      const idx0 = opts.allowReorder ? q.splice(0, 1)[0] : q.shift()!;
      const sl = slots[1] || { x: 0, y: 0 };
      const a = aspect[idx0];
      const r = Math.max(1, Math.min(Math.max(1, Math.round(1 / Math.max(a, 1e-6))), maxR));
      const newH = sl.y + r;
      H[sl.x] = newH;
      placed.push({ idx: idx0, rows: r, cols: 1, x: sl.x, y: sl.y });
      continue;
    }

    const idx = opts.allowReorder ? q.splice(best.qi, 1)[0] : q.shift()!;
    const newH = best.y + best.rows;
    for (let k = 0; k < best.cols; k++) H[best.x + k] = newH;
    placed.push({ idx, rows: best.rows, cols: best.cols, x: best.x, y: best.y, hero: best.hero });
    if (best.hero) heroesPlaced++;
  }

  // Guarantee min total heroes
  if (heroesPlaced < opts.minTotalHeroes) {
    const need = opts.minTotalHeroes - heroesPlaced;
    let upgraded = 0;
    for (let p of placed) {
      if (upgraded >= need) break;
      if (p.hero) continue;
      const a = aspect[p.idx];
      if (a > 1 && p.rows < maxR) {
        p.rows = Math.max(1, Math.min(p.rows + 1, maxR));
        p.hero = true; upgraded++;
      } else if (a < 1 && p.cols < maxC) {
        p.cols = Math.max(1, Math.min(p.cols + 1, maxC));
        p.hero = true; upgraded++;
      } else if (Math.abs(a - 1) < 0.1 && p.rows < 2 && p.cols < 2) {
        p.rows = Math.min(2, maxR); p.cols = Math.min(2, maxC);
        p.hero = true; upgraded++;
      }
    }
  }

  for (const p of placed) {
    const it = items[p.idx];
    out.push({
      ...it,
      src: it.src,
      title: it.title ?? '',
      alt: it.alt ?? '',
      rows: p.rows,
      cols: p.cols
    });
  }
  return out;
}

export function packGreedyV2(
  items: QuiltedItem[],
  colsPerRow: number,
  opts: PackOptions
) {
  type Placed = { idx: number; rows: number; cols: number; hero?: boolean };
  const out: ViewItem[] = [];
  const placed: Placed[] = [];

  const maxC = Math.max(1, Math.min(colsPerRow, opts.maxColsPerItem, opts.heroColsMax));
  const maxR = Math.max(1, Math.min(opts.maxRowsPerItem, opts.heroRowsMax));

  const aspect: number[] = new Array(items.length);
  for (let i = 0; i < items.length; i++) {
    const w = items[i].width as number, h = items[i].height as number;
    aspect[i] = (w > 0 && h > 0) ? (w / h) : 1;
  }

  const q: number[] = items.map((_, i) => i);

  const rand01 = (s: string): number => {
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
    return ((h >>> 0) % 100000) / 100000;
  };

  let totalHeroesPlaced = 0;
  let rowIndex = 0;

  while (q.length) {
    let colsLeft = Math.max(1, colsPerRow);
    const rowStart = placed.length;
    let heroesThisRow = 0;

    while (q.length && colsLeft > 0) {
      let chosenIdxInQ = -1, chosenCols = 1, chosenRows = 1, chosenHero = false, bestErr = Number.POSITIVE_INFINITY;
      const window = opts.allowReorder ? Math.min(opts.lookahead, q.length) : 1;

      for (let k = 0; k < window; k++) {
        const qi = q[k];
        const it = items[qi];
        const a = aspect[qi];
        const isSquare = Math.abs(a - 1) < 0.1;
        const isLand = a > 1 && !isSquare;
        const isPort = a < 1 && !isSquare;

        const consider = (rows: number, cols: number, hero = false) => {
          rows = Math.max(1, Math.min(rows, maxR));
          cols = Math.max(1, Math.min(cols, maxC));
          if (cols > colsLeft) return;
          if (hero && heroesThisRow >= opts.maxHighlightsPerRow) return;
          const err = Math.abs((cols / rows) - a);
          if (err < bestErr) { bestErr = err; chosenIdxInQ = k; chosenCols = cols; chosenRows = rows; chosenHero = hero; }
        };

        if (opts.respectExplicitSpans && it.cols && it.rows) {
          consider(it.rows, it.cols, false);
          continue;
        }

        const baseMaxRows = Math.min(maxR, 2);
        for (let rows = 1; rows <= baseMaxRows; rows++) {
          let cols = Math.max(1, Math.round(a * rows));
          cols = Math.min(cols, maxC);
          consider(rows, cols, false);
        }

        let wantHero = rand01((it.src || '') + '|hero') < opts.highlightProb;
        if (opts.forceHeroOnFirstRow && rowIndex === 0 && totalHeroesPlaced < opts.minTotalHeroes) {
          wantHero = true;
        }

        if (wantHero && heroesThisRow < opts.maxHighlightsPerRow) {
          if (isLand) {
            for (let rows = Math.min(opts.heroRowsMax, maxR); rows >= 2; rows--) {
              const cols = Math.max(1, Math.round(a * rows));
              consider(rows, cols, true);
            }
          } else if (isPort) {
            const maxColsTry = Math.min(opts.heroColsMax, maxC, colsLeft);
            for (let cols = maxColsTry; cols >= 2; cols--) {
              const rows = Math.max(1, Math.round(cols / a));
              consider(rows, cols, true);
            }
          } else {
            const s = Math.min(2, maxC, maxR, colsLeft);
            if (s > 1) consider(s, s, true);
          }
        }
      }

      if (chosenIdxInQ === -1) {
        if (placed.length > rowStart && colsLeft > 0) {
          const last = placed[placed.length - 1];
          const a = aspect[last.idx];
          last.cols = Math.min(last.cols + colsLeft, maxC);
          colsLeft = 0;
          const targetRows = Math.min(maxR, Math.max(1, Math.round(last.cols / a)));
          last.rows = Math.max(last.rows, targetRows);
        }
        break;
      }

      const idx = opts.allowReorder ? q.splice(chosenIdxInQ, 1)[0] : q.shift()!;
      placed.push({ idx, rows: chosenRows, cols: chosenCols, hero: chosenHero });
      if (chosenHero) { heroesThisRow++; totalHeroesPlaced++; }
      colsLeft -= chosenCols;
    }

    if (rowIndex === 0 && opts.forceHeroOnFirstRow && totalHeroesPlaced < opts.minTotalHeroes) {
      const rowSlice = placed.slice(rowStart);
      if (rowSlice.length) {
        let bestIdx = -1, bestGain = -1;
        for (let i = 0; i < rowSlice.length; i++) {
          const p = rowSlice[i];
          const a = aspect[p.idx];
          let gain = 0;
          if (a > 1) {
            const targetRows = Math.min(maxR, Math.max(p.rows + 1, Math.round(p.cols / a)));
            gain = targetRows - p.rows;
          } else if (a < 1) {
            const targetCols = Math.min(maxC, Math.max(p.cols + 1, Math.round(a * p.rows)));
            gain = targetCols - p.cols;
          } else {
            const s = Math.min(2, maxC, maxR);
            gain = Math.max(s - p.cols, s - p.rows);
          }
          if (gain > bestGain) { bestGain = gain; bestIdx = i; }
        }
        if (bestIdx !== -1 && bestGain > 0) {
          const p = placed[rowStart + bestIdx];
          const a = aspect[p.idx];
          if (a > 1) {
            p.rows = Math.min(maxR, Math.max(p.rows + 1, Math.round(p.cols / a)));
          } else if (a < 1) {
            p.cols = Math.min(maxC, Math.max(p.cols + 1, Math.round(a * p.rows)));
          } else {
            const s = Math.min(2, maxC, maxR);
            p.rows = Math.max(p.rows, s);
            p.cols = Math.max(p.cols, s);
          }
          totalHeroesPlaced++;
        }
      }
    }

    rowIndex++;
  }

  for (const p of placed) {
    const it = items[p.idx];
    out.push({ ...it, src: it.src, title: it.title ?? '', alt: it.alt ?? '', rows: p.rows, cols: p.cols });
  }
  return out;
}