import type { Tree } from './model';

export const CARD_W = 184, CARD_H = 46, GAP_X = 22, GAP_Y = 10, LANE_PAD = 14, DOMAIN_GAP = 34, START_YEAR = -3400000;
export interface Lane { sub: number; domain: number; y: number; h: number }
export interface Band { domain: number; y: number; h: number }
export interface Layout {
  x: Float32Array; y: Float32Array; lanes: Lane[]; bands: Band[]; width: number; height: number;
  years: Float64Array; xs: Float64Array; yearToX(year: number): number; xToYear(x: number): number;
}
function breaks(end: number) {
  const out: number[] = [];
  const span = (a: number, b: number, step: number) => { for (let y = a; y < b; y += step) out.push(y); };
  span(START_YEAR, -1e6, 2e5); span(-1e6, -1e5, 1e5); span(-1e5, -2e4, 1e4); span(-2e4, -1e4, 2000); span(-1e4, -4000, 500);
  span(-4000, -1000, 250); span(-1000, 1000, 100); span(1000, 1500, 50); span(1500, 1750, 25); span(1750, 1900, 10); span(1900, end, 5); out.push(end);
  return out;
}
/**
 * Eje temporal elástico: cada tramo recibe anchura según la densidad de avances de su carril más poblado,
 * de modo que las tarjetas nunca se amontonan y las épocas vacías no desperdician pantalla.
 */
export function computeLayout(tree: Tree): Layout {
  const { nodes, subs } = tree, n = nodes.length, br = breaks(tree.presentYear + 1), bins = br.length - 1;
  const binOf = (year: number) => { let lo = 0, hi = bins - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (br[m] <= year) lo = m; else hi = m - 1; } return lo; };
  const count = new Uint32Array(bins * subs.length), nodeBin = new Int32Array(n);
  for (const t of nodes) { const b = binOf(Math.max(START_YEAR, Math.min(tree.presentYear, t.year))); nodeBin[t.i] = b; count[b * subs.length + t.subIndex]++; }
  const years = Float64Array.from(br), xs = new Float64Array(br.length);
  for (let b = 0; b < bins; b++) {
    let max = 0; for (let s = 0; s < subs.length; s++) max = Math.max(max, count[b * subs.length + s]);
    xs[b + 1] = xs[b] + Math.max(44, Math.ceil(max / 3) * (CARD_W + GAP_X));
  }
  const span = (b: number) => xs[b + 1] - xs[b];
  const rawX = (year: number) => { const y = Math.max(years[0], Math.min(years[bins], year)), b = Math.min(bins - 1, binOf(y)); return xs[b] + (y - years[b]) / (years[b + 1] - years[b]) * span(b); };
  // Un avance debe quedar a la derecha de lo que requiere: se ensanchan los tramos donde una tarjeta taparía a su sucesora.
  if (n < 200000) for (let pass = 0; pass < 2; pass++) for (const t of nodes) for (const r of t.req) {
    const a = nodes[r]; if (a.year >= t.year) continue; const gap = rawX(t.year) - rawX(a.year), need = CARD_W + GAP_X; if (gap >= need) continue;
    const b0 = nodeBin[r], b1 = nodeBin[t.i], k = Math.min(3, need / gap), w: number[] = []; for (let b = 0; b < bins; b++) w.push(span(b) * (b >= b0 && b <= b1 ? k : 1));
    for (let b = 0; b < bins; b++) xs[b + 1] = xs[b] + w[b];
  }
  const yearToX = (year: number) => { const y = Math.max(years[0], Math.min(years[bins], year)), b = Math.min(bins - 1, binOf(y)); return xs[b] + (y - years[b]) / (years[b + 1] - years[b]) * (xs[b + 1] - xs[b]); };
  const xToYear = (x: number) => { const v = Math.max(0, Math.min(xs[bins], x)); let lo = 0, hi = bins - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (xs[m] <= v) lo = m; else hi = m - 1; } return years[lo] + (v - xs[lo]) / (xs[lo + 1] - xs[lo]) * (years[lo + 1] - years[lo]); };
  const x = new Float32Array(n), y = new Float32Array(n);
  for (const t of nodes) x[t.i] = yearToX(t.year);
  const perSub: number[][] = subs.map(() => []);
  for (const t of nodes) perSub[t.subIndex].push(t.i);
  const lanes: Lane[] = [], bands: Band[] = []; let cursor = 0, lastDomain = -1;
  subs.forEach((sub, s) => {
    const domain = tree.domains.findIndex(d => d.id === sub.domain);
    if (domain !== lastDomain) { if (lastDomain >= 0) cursor += DOMAIN_GAP; bands.push({ domain, y: cursor, h: 0 }); lastDomain = domain; }
    const ids = perSub[s].sort((a, b) => x[a] - x[b] || a - b), rowEnd: number[] = [];
    for (const i of ids) {
      let row = rowEnd.findIndex(end => end + GAP_X <= x[i]); if (row < 0) { row = rowEnd.length; rowEnd.push(0); }
      rowEnd[row] = x[i] + CARD_W; y[i] = cursor + LANE_PAD + row * (CARD_H + GAP_Y);
    }
    const h = LANE_PAD * 2 + Math.max(1, rowEnd.length) * (CARD_H + GAP_Y) - GAP_Y;
    lanes.push({ sub: s, domain, y: cursor, h }); cursor += h; bands[bands.length - 1].h = cursor - bands[bands.length - 1].y;
  });
  return { x, y, lanes, bands, width: xs[bins] + CARD_W, height: cursor, years, xs, yearToX, xToYear };
}
/** Rejilla espacial para consultar qué tarjetas hay en pantalla o bajo el puntero sin recorrerlas todas. */
export class Grid {
  private start = new Map<number, number>(); private order: Int32Array; private keys: Float64Array;
  constructor(private layout: Layout, private cell = 512) {
    const n = layout.x.length; this.order = new Int32Array(n); this.keys = new Float64Array(n);
    for (let i = 0; i < n; i++) { this.order[i] = i; this.keys[i] = this.key(Math.floor(layout.x[i] / cell), Math.floor(layout.y[i] / cell)); }
    this.order.sort((a, b) => this.keys[a] - this.keys[b]);
    for (let p = n - 1; p >= 0; p--) this.start.set(this.keys[this.order[p]], p);
  }
  private key(cx: number, cy: number) { return cx * 100003 + cy; }
  /** Recorre las tarjetas que tocan el rectángulo; devuelve false si se alcanzó el límite. */
  query(x0: number, y0: number, x1: number, y1: number, limit: number, visit: (i: number) => void) {
    const c = this.cell, { x, y } = this.layout; let seen = 0;
    for (let cx = Math.floor((x0 - CARD_W) / c); cx <= Math.floor(x1 / c); cx++) for (let cy = Math.floor((y0 - CARD_H) / c); cy <= Math.floor(y1 / c); cy++) {
      const k = this.key(cx, cy); let p = this.start.get(k); if (p === undefined) continue;
      for (; p < this.order.length && this.keys[this.order[p]] === k; p++) {
        const i = this.order[p]; if (x[i] > x1 || x[i] + CARD_W < x0 || y[i] > y1 || y[i] + CARD_H < y0) continue;
        if (++seen > limit) return false; visit(i);
      }
    }
    return true;
  }
}
