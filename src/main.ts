import './style.css';
import { createIcons, Search, BookOpen, Funnel, Layers, Maximize, Sun, Sunset, Moon, Contrast, Info, X, Spline, CalendarRange, Palette, Tags, Crosshair, Volume2, Download } from 'lucide';
import { loadTree, stressTree, ancestors, KINDS, DAYS, type Tree, type Tech, type Kind } from './model';
import { computeLayout, Grid, CARD_W, CARD_H } from './layout';
import { Renderer, type RectSet, type EdgeSet, type View } from './renderer';
import { periods, NOW } from './periods';
import { t, lang, num, formatYear, monthName } from './i18n';
import { aboutContent } from './about';

declare const __VERSION__: string;
const icons = { Search, BookOpen, Funnel, Layers, Maximize, Sun, Sunset, Moon, Contrast, Info, X, Spline, CalendarRange, Palette, Tags, Crosshair, Volume2, Download };
const icon = (name: string) => `<i data-lucide="${name}"></i>`;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const base = import.meta.env.BASE_URL, params = new URLSearchParams(location.search);
document.documentElement.lang = lang;

// ───────── Tema ─────────
type Appearance = 'morning' | 'afternoon' | 'night' | 'auto';
const appearances: Appearance[] = ['morning', 'afternoon', 'night', 'auto'], appearanceIcons = { morning: 'sun', afternoon: 'sunset', night: 'moon', auto: 'contrast' };
let appearance: Appearance = (() => { try { const v = localStorage.getItem('techtree-appearance') as Appearance; return appearances.includes(v) ? v : 'auto'; } catch { return 'auto'; } })();
const resolveAppearance = () => { if (appearance !== 'auto') return appearance; const h = new Date().getHours(); return h >= 7 && h < 13 ? 'morning' : h >= 13 && h < 20 ? 'afternoon' : 'night'; };
const rgb = (hex: string): [number, number, number] => { const n = parseInt(hex.trim().slice(1, 7), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const theme = { card: [0, 0, 0] as [number, number, number], text: '#fff', muted: '#999', gold: '#d3be8f', background: '#000', dock: '#000', light: false };
function applyAppearance() {
  const resolved = resolveAppearance(); document.documentElement.dataset.appearance = resolved;
  const css = getComputedStyle(document.documentElement), v = (n: string) => css.getPropertyValue(n).trim();
  theme.card = rgb(v('--card')); theme.text = v('--text'); theme.muted = v('--muted'); theme.gold = v('--gold'); theme.background = v('--background'); theme.dock = v('--dock'); theme.light = resolved === 'morning';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme.background);
}

let progressive = (() => { try { return localStorage.getItem('techtree-progressive') !== 'off'; } catch { return true; } })();
// ───────── Estructura ─────────
const tool = (id: string, name: string, label: string, extra = '') => `<button id="${id}" class="icon-button" title="${label}" aria-label="${label}" ${extra}>${icon(name)}</button>`;
const popover = (id: string, title: string, body: string) => `<section id="${id}" class="popover" role="dialog" aria-label="${title}" hidden><div class="popover-head"><h2>${title}</h2><button class="icon-button" data-close aria-label="${t('close')}">${icon('x')}</button></div><div class="popover-body">${body}</div></section>`;
const toggle = (id: string, lead: string, title: string, help: string, on = true) => `<button id="${id}" class="layer-button" aria-pressed="${on}">${lead}<span><strong>${title}</strong>${help ? `<small>${help}</small>` : ''}</span><span class="layer-indicator"></span></button>`;
$('#app').innerHTML = `
<main class="tree">
  <canvas id="gl" aria-label="Techtree"></canvas><canvas id="labels"></canvas>
  <nav class="toolbar">
    ${tool('search-button', 'search', t('search'), 'aria-expanded="false"')}${tool('encyclopedia-button', 'book-open', t('encyclopedia'))}
    ${tool('filters-button', 'funnel', t('filters'), 'aria-expanded="false"')}${tool('layers-button', 'layers', t('layers'), 'aria-expanded="false"')}
    ${tool('fullscreen-button', 'maximize', t('fullscreen'))}${tool('appearance-button', 'contrast', t('theme'), 'aria-expanded="false"')}${tool('about-button', 'info', t('about'))}
  </nav>
  ${popover('search-panel', t('search'), `<input id="search-input" type="search" placeholder="${t('searchPlaceholder')}" autocomplete="off"><div id="search-results" class="results"></div>`)}
  ${popover('filters-panel', t('kindsTitle'), KINDS.map(k => toggle('kind-' + k, `<span class="swatch" style="background:var(--muted);opacity:${k === 'via-muerta' ? .45 : .9}"></span>`, t('k.' + k), '')).join(''))}
  ${popover('layers-panel', t('layers'), toggle('layer-links', icon('spline'), t('links'), t('linksHelp')) + toggle('layer-stages', icon('calendar-range'), t('stages'), t('stagesHelp')) + toggle('layer-stage-colors', icon('palette'), t('stageColors'), '') + toggle('layer-names', icon('tags'), t('laneNames'), t('laneNamesHelp')) + toggle('layer-progressive', icon('download'), t('progressive'), t('progressiveHelp'), progressive))}
  <section id="appearance-panel" class="popover appearance-popover" hidden>${appearances.map(a => `<button class="icon-button" data-appearance="${a}" title="${t(a)}" aria-label="${t(a)}">${icon(appearanceIcons[a])}</button>`).join('')}</section>
  <aside id="card" class="tech-card" hidden></aside>
  <section class="time-dock"><canvas id="ruler"></canvas><div class="fixed-cursor"><div class="cursor-line"></div></div><div id="year" class="time-focus"></div></section>
  <dialog id="about" class="about-dialog"><button class="icon-button dialog-close" data-close-dialog aria-label="${t('close')}">${icon('x')}</button><div id="about-body"></div></dialog>
  <dialog id="encyclopedia" class="encyclopedia"><div class="enc-head"><h2>${t('encyclopedia')} · Techtree</h2><button id="read-button" class="text-button">${icon('volume-2')}<span>${t('readAloud')}</span></button><button class="icon-button" data-close-dialog aria-label="${t('close')}">${icon('x')}</button></div><nav id="enc-index" class="enc-index" aria-label="${t('index')}"></nav><article id="article" class="article"></article></dialog>
  <div id="toast" role="status">${t('loading')}</div>
</main>`;
const refreshIcons = () => createIcons({ icons });
refreshIcons(); applyAppearance();

const glCanvas = $<HTMLCanvasElement>('#gl'), labelCanvas = $<HTMLCanvasElement>('#labels'), rulerCanvas = $<HTMLCanvasElement>('#ruler');
const ctx = labelCanvas.getContext('2d')!, rctx = rulerCanvas.getContext('2d')!, toast = $('#toast');
const renderer = new Renderer(glCanvas);
const DOCK = 112;

// ───────── Datos y disposición ─────────
let tree: Tree = await loadTree(base, lang);
const stress = Math.min(3_000_000, Number(params.get('stress')) || 0);
if (stress > 0) tree = stressTree(tree, stress);
const layout = computeLayout(tree), grid = new Grid(layout), N = tree.nodes.length;
const domainRgb = tree.domains.map(d => rgb(d.color).map(c => Math.round(c * 255)));
const edgeFrom: number[] = [], edgeTo: number[] = [];
for (const n of tree.nodes) for (const r of n.req) { edgeFrom.push(r); edgeTo.push(n.i); }
const E = edgeFrom.length;

const view: View = { scale: 1, stretch: 1, x: 0, y: 0, width: innerWidth, height: innerHeight, dpr: Math.min(2, devicePixelRatio || 1) };
const hiddenKinds = new Set<Kind>(); let showLinks = true, showStages = true, stageColors = true, showNames = true;
let selected = -1, highlight: Set<number> | null = null;

// Capas estáticas
const laneRect = new Float32Array(layout.lanes.length * 4), laneColor = new Uint8Array(layout.lanes.length * 4), laneKind = new Float32Array(layout.lanes.length).fill(-1);
layout.lanes.forEach((l, i) => { laneRect.set([-4000, l.y, layout.width + 8000, l.h], i * 4); laneColor.set([...domainRgb[l.domain], i % 2 ? 20 : 11], i * 4); });
const laneSet = renderer.rects(laneRect, laneColor, laneKind);
const nodeRect = new Float32Array(N * 4), nodeColor = new Uint8Array(N * 4), nodeKind = new Float32Array(N);
for (const n of tree.nodes) { nodeRect.set([layout.x[n.i], layout.y[n.i], CARD_W, CARD_H], n.i * 4); nodeKind[n.i] = KINDS.indexOf(n.kind); }
/** Extremos de un enlace: de lado a lado; si la sucesora empieza antes de que acabe su requisito, de borde a borde en vertical. */
function link(a: number, b: number): [number, number, number, number, number] {
  const { x, y } = layout; if (x[b] >= x[a] + CARD_W + 6 || y[a] === y[b]) return [x[a], y[a] + CARD_H / 2, x[b], y[b] + CARD_H / 2, 0];
  const down = y[b] > y[a]; return [x[a], y[a] + (down ? CARD_H : 0), x[b], y[b] + (down ? 0 : CARD_H), 1]; // el sombreador añade el ancho de tarjeta
}
const edgeEnds = new Float32Array(E * 4), edgeColor = new Uint8Array(E * 4), edgeMode = new Float32Array(E);
for (let e = 0; e < E; e++) { const l = link(edgeFrom[e], edgeTo[e]); edgeEnds.set(l.slice(0, 4), e * 4); edgeMode[e] = l[4]; }
const visible = (i: number) => !hiddenKinds.has(tree.nodes[i].kind);
function fillColors() {
  for (const n of tree.nodes) nodeColor.set([...domainRgb[n.domainIndex], visible(n.i) ? 255 : 0], n.i * 4);
  for (let e = 0; e < E; e++) edgeColor.set([...domainRgb[tree.nodes[edgeFrom[e]].domainIndex], visible(edgeFrom[e]) && visible(edgeTo[e]) ? 255 : 0], e * 4);
}
fillColors();
const nodeSet = renderer.rects(nodeRect, nodeColor, nodeKind), edgeSet = renderer.edges(edgeEnds, edgeColor, edgeMode, E < 150_000);
let hiNodes: RectSet | undefined, hiEdges: EdgeSet | undefined, ring: RectSet | undefined;

// ───────── Cámara ─────────
let fitScale = 1, dirty = true;
const invalidate = () => { dirty = true; };
const hx = () => view.scale * view.stretch, MAX_STRETCH = 64;
function fitView() { const s = Math.min((view.width - 40) / layout.width, (view.height - DOCK - 70) / layout.height); return { scale: s, stretch: 1, x: (view.width - layout.width * s) / 2, y: 58 + Math.max(0, (view.height - DOCK - 70 - layout.height * s) / 2) }; }
/** Vista inicial: todos los ámbitos a lo alto de la pantalla, empezando por el principio del tiempo. */
function homeView() { const f = fitView(), s = Math.max(f.scale, (view.height - DOCK - 76) / layout.height); return { scale: s, stretch: 1, x: s > f.scale ? 150 : f.x, y: 62 }; }
function clampView() {
  view.scale = Math.max(fitScale * .7, Math.min(2.6, view.scale)); view.stretch = Math.max(1, Math.min(MAX_STRETCH, view.stretch));
  const w = layout.width * hx(), h = layout.height * view.scale, mx = view.width * .5, my = (view.height - DOCK) * .5;
  view.x = Math.max(mx - w, Math.min(mx, view.x)); view.y = Math.max(my - h, Math.min(my, view.y));
}
function zoomAt(px: number, py: number, factor: number) {
  const wx = (px - view.x) / hx(), wy = (py - view.y) / view.scale; view.scale *= factor; clampView();
  view.x = px - wx * hx(); view.y = py - wy * view.scale; clampView(); invalidate();
}
/** Estira solo el tiempo: las tarjetas conservan su tamaño y la regla llega a meses, semanas y días. */
function stretchAt(px: number, factor: number) {
  const wx = (px - view.x) / hx(); view.stretch *= factor; clampView(); view.x = px - wx * hx(); clampView(); invalidate();
}
let flight = 0;
function flyTo(target: { scale: number; x: number; y: number; stretch?: number }, duration = 520) {
  const from = { scale: view.scale, x: view.x, y: view.y, stretch: view.stretch }, st1 = target.stretch ?? view.stretch, start = performance.now(), id = ++flight;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) duration = 0;
  // Se interpola el centro del mundo y el logaritmo de la escala para que el viaje sea uniforme.
  const cx = view.width / 2, cy = (view.height - DOCK) / 2, w0 = [(cx - from.x) / (from.scale * from.stretch), (cy - from.y) / from.scale], w1 = [(cx - target.x) / (target.scale * st1), (cy - target.y) / target.scale];
  const step = (now: number) => {
    if (id !== flight) return; const u = duration ? Math.min(1, (now - start) / duration) : 1, k = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    view.scale = Math.exp(Math.log(from.scale) + (Math.log(target.scale) - Math.log(from.scale)) * k);
    view.stretch = Math.exp(Math.log(from.stretch) + (Math.log(st1) - Math.log(from.stretch)) * k);
    view.x = cx - (w0[0] + (w1[0] - w0[0]) * k) * hx(); view.y = cy - (w0[1] + (w1[1] - w0[1]) * k) * view.scale; invalidate();
    if (u < 1) requestAnimationFrame(step); else { clampView(); invalidate(); }
  };
  requestAnimationFrame(step);
}
/** Destino de cámara que centra una tarjeta (o, con i < 0, una posición del eje temporal). */
const targetFor = (i: number, scale: number, wx = 0) => i >= 0 ? { scale, x: view.width / 2 - layout.x[i] * scale * view.stretch - CARD_W / 2 * scale, y: (view.height - DOCK) / 2 - (layout.y[i] + CARD_H / 2) * scale } : { scale, x: view.width / 2 - wx * scale * view.stretch, y: view.y };
function resize() {
  view.width = innerWidth; view.height = innerHeight; view.dpr = Math.min(2, devicePixelRatio || 1);
  for (const c of [labelCanvas, rulerCanvas]) { const h = c === rulerCanvas ? DOCK : view.height; c.width = Math.round(view.width * view.dpr); c.height = Math.round(h * view.dpr); }
  fitScale = fitView().scale; clampView(); invalidate();
}

// ───────── Selección ─────────
function select(i: number, fly = false) {
  selected = i; highlight = null;
  if (i >= 0) {
    const n = tree.nodes[i], anc = ancestors(tree, i); highlight = new Set([i, ...anc, ...n.enables]);
    const ids = [...highlight].filter(visible), rect = new Float32Array(ids.length * 4), color = new Uint8Array(ids.length * 4), kind = new Float32Array(ids.length);
    ids.forEach((id, k) => { rect.set(nodeRect.subarray(id * 4, id * 4 + 4), k * 4); color.set([...domainRgb[tree.nodes[id].domainIndex], 255], k * 4); kind[k] = nodeKind[id]; });
    hiNodes = renderer.rects(rect, color, kind, hiNodes);
    const gold = rgb(theme.gold).map(c => Math.round(c * 255)), ink = rgb(theme.text).map(c => Math.round(c * 255)), ends: number[] = [], cols: number[] = [], modes: number[] = [];
    const push = (a: number, b: number, c: number[], alpha: number) => { if (!visible(a) || !visible(b)) return; const l = link(a, b); ends.push(l[0], l[1], l[2], l[3]); modes.push(l[4]); cols.push(...c, alpha); };
    for (const a of anc) for (const r of tree.nodes[a].req) push(r, a, gold, 95);
    for (const r of n.req) push(r, i, gold, 255);
    for (const d of n.enables) push(i, d, ink, 215);
    hiEdges = renderer.edges(new Float32Array(ends), new Uint8Array(cols), new Float32Array(modes), true, hiEdges);
    ring = renderer.rects(nodeRect.slice(i * 4, i * 4 + 4), new Uint8Array([...gold, 255]), new Float32Array([0]), ring);
    void openCard(n);
    if (fly) flyTo(targetFor(i, Math.max(view.scale, .9)));
    history.replaceState(null, '', '#t=' + n.id);
  } else { $('#card').hidden = true; history.replaceState(null, '', location.pathname + location.search); }
  invalidate();
}
function pick(px: number, py: number) {
  if (CARD_W * view.scale < 5) return -1; const wx = (px - view.x) / hx(), wy = (py - view.y) / view.scale; let hit = -1;
  grid.query(wx, wy, wx, wy, 50, i => { if (visible(i)) hit = i; }, CARD_W / view.stretch); return hit;
}

// ───────── Dibujo ─────────
const fitCache = new Map<string, string>();
function fitText(c: CanvasRenderingContext2D, text: string, max: number, key: string) {
  const k = key + '|' + Math.round(max / 4); let out = fitCache.get(k); if (out !== undefined) return out;
  out = text; if (c.measureText(text).width > max) { let lo = 0, hi = text.length; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (c.measureText(text.slice(0, m) + '…').width <= max) lo = m; else hi = m - 1; } out = lo > 1 ? text.slice(0, lo).trimEnd() + '…' : ''; }
  if (fitCache.size > 30000) fitCache.clear(); fitCache.set(k, out); return out;
}
const period = (year: number, row: number) => periods.find(p => p.row === row && year >= p.from && year < p.to);
function draw() {
  renderer.begin(view);
  const sel = highlight !== null, opt = { base: theme.card, tint: theme.light ? .16 : .2 };
  renderer.drawRects(laneSet, view, { ...opt, alpha: theme.light ? 1.7 : 1, minPx: 0 });
  const far = Math.min(1, Math.max(0, (view.scale - fitScale) / (.35 - fitScale)));
  if (showLinks) renderer.drawEdges(edgeSet, view, sel ? .07 : .16 + .3 * far, 1);
  renderer.drawRects(nodeSet, view, { ...opt, alpha: sel ? .26 : 1, minPx: 1.6 });
  if (sel) {
    renderer.drawEdges(hiEdges!, view, 1, 1.5);
    renderer.drawRects(ring!, view, { base: theme.card, tint: 1, alpha: 1, minPx: 3, grow: 3 });
    renderer.drawRects(hiNodes!, view, { ...opt, alpha: 1, minPx: 3 });
  }
  drawLabels(); drawRuler();
}
function drawLabels() {
  const d = view.dpr, s = view.scale, w = view.width, h = view.height; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
  const cardPx = CARD_W * s;
  if (cardPx >= 56) {
    const fs = Math.max(9, Math.min(13.5, 13.5 * s)), two = cardPx >= 104, pad = Math.max(7, 12 * s); ctx.textBaseline = 'middle';
    const sx = hx(); grid.query(-view.x / sx, -view.y / s, (w - view.x) / sx, (h - view.y) / s, 1400, i => {
      if (!visible(i)) return; const n = tree.nodes[i], x = layout.x[i] * sx + view.x, y = layout.y[i] * s + view.y, ch = CARD_H * s;
      ctx.globalAlpha = highlight && !highlight.has(i) ? .3 : 1; ctx.fillStyle = theme.text; ctx.font = `500 ${fs}px "DM Sans",system-ui,sans-serif`;
      ctx.fillText(fitText(ctx, n.name, cardPx - pad * 1.6, i + 'n' + fs.toFixed(1)), x + pad, y + ch * (two ? .34 : .5));
      if (two) { ctx.fillStyle = theme.muted; ctx.font = `${fs * .82}px "DM Sans",system-ui,sans-serif`; ctx.fillText(fitText(ctx, when(n) + ' · ' + t('k.' + n.kind), cardPx - pad * 1.6, i + 'y' + fs.toFixed(1)), x + pad, y + ch * .7); }
    });
    ctx.globalAlpha = 1;
  }
  if (!showNames) return;
  const fade = ctx.createLinearGradient(0, 0, 230, 0); fade.addColorStop(0, theme.background); fade.addColorStop(.45, theme.background + 'cc'); fade.addColorStop(1, theme.background + '00');
  ctx.fillStyle = fade; ctx.fillRect(0, 0, 230, h - DOCK + 30); ctx.textBaseline = 'top';
  for (const b of layout.bands) {
    const top = b.y * s + view.y, bottom = top + b.h * s; if (bottom < 0 || top > h - DOCK || bottom - top < 11) continue;
    const dom = tree.domains[b.domain], y = Math.min(Math.max(top + 4, 60), bottom - 14);
    ctx.font = '600 10.5px "DM Sans",system-ui,sans-serif'; ctx.fillStyle = dom.color; ctx.fillRect(14, y + 1, 3, 10); ctx.fillStyle = theme.text;
    ctx.fillText(dom.name.toUpperCase(), 23, y, 200);
  }
  ctx.font = '10.5px "DM Sans",system-ui,sans-serif'; ctx.fillStyle = theme.muted;
  for (const l of layout.lanes) {
    const top = l.y * s + view.y, hh = l.h * s; if (hh < 34 || top + hh < 50 || top > h - DOCK) continue;
    ctx.fillText(tree.subs[l.sub].name, 23, Math.max(top + 19, 60 + 15), 190);
  }
}
const STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6];
const ink = (color: string) => { const n = parseInt(color.slice(1), 16); return .2126 * (n >> 16) + .7152 * ((n >> 8) & 255) + .0722 * (n & 255) > 140 ? '#14242c' : '#ffffff'; };
function drawRuler() {
  const d = view.dpr, w = view.width; rctx.setTransform(d, 0, 0, d, 0, 0); rctx.clearRect(0, 0, w, DOCK);
  const sx = (year: number) => layout.yearToX(year) * hx() + view.x; let top = 26;
  if (showStages) {
    rctx.font = '500 9.5px "DM Sans",system-ui,sans-serif'; rctx.textBaseline = 'middle';
    for (const p of periods) {
      const x0 = Math.max(-2, sx(p.from)), x1 = Math.min(w + 2, sx(p.to === NOW ? tree.presentYear + 1 : p.to)); if (x1 - x0 < 1.5) continue;
      const y = top + p.row * 15, color = stageColors ? p.color : theme.light ? '#9aa5a4' : '#46555f';
      rctx.fillStyle = color; rctx.globalAlpha = stageColors ? .92 : .7; rctx.fillRect(x0, y, x1 - x0 - 1, 13); rctx.globalAlpha = 1;
      const tw = rctx.measureText(p.name).width; if (x1 - x0 > tw + 12) { rctx.fillStyle = ink(color); rctx.fillText(p.name, Math.min(Math.max(x0 + 6, (x0 + x1 - tw) / 2), x1 - tw - 6), y + 7); }
    }
    top += 47;
  } else top += 14;
  rctx.strokeStyle = theme.muted; rctx.fillStyle = theme.muted; rctx.font = '11.5px Georgia,serif'; rctx.textBaseline = 'top'; rctx.textAlign = 'center'; rctx.lineWidth = 1;
  const placed: number[] = [], { years, xs } = layout;
  for (let b = 0; b < years.length - 1; b++) {
    const x0 = xs[b] * hx() + view.x, x1 = xs[b + 1] * hx() + view.x; if (x1 < -40 || x0 > w + 40) continue;
    const ppy = (x1 - x0) / (years[b + 1] - years[b]);
    const tick = (x: number, label: string | null, strong: boolean) => {
      const isMajor = label !== null && Math.abs(x - w / 2) > 78 && !placed.some(c => Math.abs(c - x) < 78);
      rctx.globalAlpha = isMajor ? .75 : strong ? .5 : .3; rctx.beginPath(); rctx.moveTo(Math.round(x) + .5, top); rctx.lineTo(Math.round(x) + .5, top + (isMajor ? 12 : strong ? 9 : 6)); rctx.stroke();
      if (isMajor) { placed.push(x); rctx.globalAlpha = .95; rctx.fillText(label!, x, top + 16); }
    };
    if (ppy >= 84 && years[b] >= 1000) { // meses, semanas y días
      const from = Math.max(years[b], years[b] + (-60 - x0) / ppy), to = Math.min(years[b + 1], years[b] + (w + 60 - x0) / ppy), days = ppy / 365 >= 7, dayLabels = ppy / 365 >= 78, weekLabels = ppy * 7 / 365 >= 78, monthLabels = ppy / 12 >= 78;
      for (let m = Math.floor(from * 12); m / 12 < to; m++) {
        const yr = Math.floor(m / 12), mo = m - yr * 12, xm = x0 + (m / 12 - years[b]) * ppy;
        if (m / 12 >= years[b]) tick(xm, mo === 0 ? String(yr) : monthLabels ? `${monthName(mo)} ${yr}` : null, true);
        if (days) for (let d = 2; d <= DAYS[mo]; d++) { const xd = xm + (d - 1) / DAYS[mo] / 12 * ppy; if (xd > -60 && xd < w + 60) tick(xd, dayLabels || (weekLabels && d % 7 === 1 && d < 28) ? `${d} ${monthName(mo)} ${yr}` : null, false); }
      }
      continue;
    }
    const major = STEPS.find(v => v * ppy >= 78) ?? 1e6, minor = STEPS.find(v => v * ppy >= 7) ?? 1e6;
    for (let y = Math.ceil(years[b] / minor) * minor; y < years[b + 1]; y += minor) {
      const x = x0 + (y - years[b]) * ppy; if (x < -40 || x > w + 40) continue;
      tick(x, y % major === 0 && y !== 0 ? formatYear(y) : null, false);
    }
  }
  rctx.globalAlpha = 1; rctx.textAlign = 'left';
  const exact = layout.xToYear((w / 2 - view.x) / hx()), mag = Math.abs(exact), local = (layout.yearToX(exact + .5) - layout.yearToX(exact - .5)) * hx();
  if (local >= 84 && exact >= 1000) { const yr = Math.floor(exact), mo = Math.min(11, Math.floor((exact - yr) * 12)), day = 1 + Math.floor(((exact - yr) * 12 - mo) * DAYS[mo]); $('#year').textContent = local / 365 >= 7 ? `${day} ${monthName(mo)} ${yr}` : `${monthName(mo)} ${yr}`; }
  else { const year = mag > 2e5 ? Math.round(exact / 1e4) * 1e4 : mag > 2e4 ? Math.round(exact / 1000) * 1000 : mag > 5000 ? Math.round(exact / 100) * 100 : Math.floor(exact); $('#year').textContent = formatYear(Math.min(tree.presentYear, year)); }
}
let frames = 0, fpsAt = performance.now();
function loop(now: number) {
  if (dirty) { dirty = false; draw(); }
  if (stress) { frames++; if (now - fpsAt > 1000) { toast.textContent = t('stress', { n: num(N) }) + ` · ${num(E)} ↔ · ${Math.round(frames * 1000 / (now - fpsAt))} fps`; frames = 0; fpsAt = now; } dirty = true; }
  requestAnimationFrame(loop);
}

// ───────── Ficha flotante ─────────
const when = (n: Tech) => { if (!n.date) return formatYear(n.year, n.approx); const [y, m, d] = n.date.split('-').map(Number); return `${d ? d + ' ' : ''}${monthName(m - 1)} ${y}`; };
const techLink = (n: Tech) => `<button class="tech-link" data-go="${n.i}"><i style="background:${tree.domains[n.domainIndex].color}"></i><strong>${esc(n.name)}</strong><span>${when(n)}</span></button>`;
const techList = (ids: number[]) => ids.length ? `<div class="tech-list">${ids.map(i => tree.nodes[i]).sort((a, b) => a.t - b.t).map(techLink).join('')}</div>` : `<p class="empty">${t('none')}</p>`;
const eyebrow = (n: Tech) => `${t('k.' + n.kind)} · ${esc(tree.domains[n.domainIndex].name)} › ${esc(tree.subs[n.subIndex].name)}`;
const dateLine = (n: Tech) => { const p = period(n.year, 1); return `${when(n)}${p ? ` <span>· ${p.name}</span>` : ''}`; };
let cardPlaced = false;
async function openCard(n: Tech) {
  await tree.detail(n); if (selected !== n.i) return;
  const card = $('#card'), anc = ancestors(tree, n.i);
  card.innerHTML = `<header><div><span class="eyebrow">${eyebrow(n)}</span><h2>${esc(n.name)}</h2></div><button class="icon-button" data-close-card aria-label="${t('close')}">${icon('x')}</button></header>
  <div class="body"><p class="tech-date">${dateLine(n)}</p><p>${esc(n.summary)}</p>${n.people ? `<p class="tech-people">${esc(n.people)}</p>` : ''}
  <div class="tech-actions"><button class="text-button" data-enc="${n.i}">${icon('book-open')}${t('openEncyclopedia')}</button><button class="text-button" data-go="${n.i}">${icon('crosshair')}${t('showInTree')}</button></div>
  <details open><summary>${t('requires')} <b>${n.req.length}</b></summary>${techList(n.req)}</details>
  <details ${n.enables.length <= 12 ? 'open' : ''}><summary>${t('enables')} <b>${n.enables.length}</b></summary>${techList(n.enables)}</details>
  <details><summary>${t('lineage')} <b>${num(anc.size)}</b></summary>${techList([...anc])}</details></div>`;
  card.hidden = false; if (!cardPlaced) { card.style.left = '16px'; card.style.top = '16px'; }
  refreshIcons();
}
{ // arrastre de la ficha
  const card = $('#card'); let drag: { x: number; y: number } | null = null;
  card.addEventListener('pointerdown', e => { const head = (e.target as HTMLElement).closest('header'); if (!head || (e.target as HTMLElement).closest('button')) return; const r = card.getBoundingClientRect(); drag = { x: e.clientX - r.left, y: e.clientY - r.top }; head.setPointerCapture(e.pointerId); });
  card.addEventListener('pointermove', e => { if (!drag) return; cardPlaced = true; card.style.left = Math.max(0, Math.min(innerWidth - 120, e.clientX - drag.x)) + 'px'; card.style.top = Math.max(0, Math.min(innerHeight - DOCK - 60, e.clientY - drag.y)) + 'px'; });
  card.addEventListener('pointerup', () => { drag = null; });
}
document.addEventListener('click', e => {
  const el = e.target as HTMLElement, go = el.closest<HTMLElement>('[data-go]'), enc = el.closest<HTMLElement>('[data-enc]');
  if (go) { $<HTMLDialogElement>('#encyclopedia').close(); closePopovers(); select(Number(go.dataset.go), true); }
  else if (enc) openEncyclopedia(Number(enc.dataset.enc));
  else if (el.closest('[data-close-card]')) select(-1);
  else if (el.closest('[data-close]')) closePopovers();
  else if (el.closest('[data-close-dialog]')) el.closest('dialog')!.close();
});

// ───────── Interacción con el lienzo ─────────
{
  const pointers = new Map<number, { x: number; y: number }>(); let moved = 0, pinch = 0, lastRight = 0;
  glCanvas.addEventListener('pointerdown', e => { if (e.button !== 0) return; glCanvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; flight++; closePopovers(); if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
  glCanvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) { glCanvas.classList.toggle('pointing', pick(e.clientX, e.clientY) >= 0); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    if (pointers.size === 2) { const [a, b] = [...pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y); if (pinch > 0) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinch); pinch = dist; }
    else { glCanvas.classList.add('dragging'); view.x += dx; view.y += dy; clampView(); invalidate(); }
  });
  const end = (e: PointerEvent) => { if (!pointers.delete(e.pointerId)) return; glCanvas.classList.remove('dragging'); if (moved < 5 && e.type === 'pointerup') { const hit = pick(e.clientX, e.clientY); if (hit >= 0 || selected >= 0) select(hit); } };
  glCanvas.addEventListener('pointerup', end); glCanvas.addEventListener('pointercancel', end);
  glCanvas.addEventListener('wheel', e => { e.preventDefault(); flight++; if (e.shiftKey) stretchAt(e.clientX, Math.exp(-(e.deltaY || e.deltaX) * .0022)); else zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016))); }, { passive: false });
  // Doble clic derecho: volver a la vista completa (equivalente al «norte arriba» de los proyectos de mapas).
  glCanvas.addEventListener('contextmenu', e => { e.preventDefault(); const now = performance.now(); if (now - lastRight < 450) flyTo(fitView()); lastRight = now; });
  let rulerDrag: number | null = null;
  rulerCanvas.addEventListener('pointerdown', e => { rulerDrag = e.clientX; rulerCanvas.setPointerCapture(e.pointerId); rulerCanvas.classList.add('dragging'); flight++; });
  rulerCanvas.addEventListener('pointermove', e => { if (rulerDrag === null) return; view.x += e.clientX - rulerDrag; rulerDrag = e.clientX; clampView(); invalidate(); });
  const rulerEnd = () => { rulerDrag = null; rulerCanvas.classList.remove('dragging'); };
  rulerCanvas.addEventListener('pointerup', rulerEnd); rulerCanvas.addEventListener('pointercancel', rulerEnd);
  // La rueda sobre la regla estira o encoge solo el tiempo, con la fecha central fija; al llegar al mínimo, aleja toda la vista.
  rulerCanvas.addEventListener('wheel', e => { e.preventDefault(); flight++; const f = Math.exp(-e.deltaY * .0022); if (f < 1 && view.stretch <= 1.0001) zoomAt(view.width / 2, (view.height - DOCK) / 2, f); else stretchAt(view.width / 2, f); }, { passive: false });
  addEventListener('keydown', e => {
    if ((e.target as HTMLElement).matches('input') || document.querySelector('dialog[open]')) { return; }
    const cx = view.width / 2, cy = (view.height - DOCK) / 2, pan = 90;
    if (e.key === '+' || e.key === '=') zoomAt(cx, cy, 1.3); else if (e.key === '-') zoomAt(cx, cy, 1 / 1.3);
    else if (e.key === 'ArrowLeft') view.x += pan; else if (e.key === 'ArrowRight') view.x -= pan; else if (e.key === 'ArrowUp') view.y += pan; else if (e.key === 'ArrowDown') view.y -= pan;
    else if (e.key === 'Escape') { closePopovers(); if (selected >= 0) select(-1); } else if (e.key === '/') { e.preventDefault(); openPopover('search'); } else return;
    clampView(); invalidate();
  });
}

// ───────── Menú ─────────
const panels = ['search', 'filters', 'layers', 'appearance'];
function closePopovers() { for (const p of panels) { $('#' + p + '-panel').hidden = true; $('#' + p + '-button').setAttribute('aria-expanded', 'false'); } }
function openPopover(name: string) { const was = !$('#' + name + '-panel').hidden; closePopovers(); if (was) return; $('#' + name + '-panel').hidden = false; $('#' + name + '-button').setAttribute('aria-expanded', 'true'); if (name === 'search') $<HTMLInputElement>('#search-input').focus(); }
for (const p of panels) $('#' + p + '-button').addEventListener('click', () => openPopover(p));
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const folded = tree.nodes.map(n => fold(n.name)), foldedPeople = tree.nodes.map(n => fold(n.people));
$('#search-input').addEventListener('input', e => {
  const q = fold((e.target as HTMLInputElement).value.trim()), box = $('#search-results'); if (q.length < 2) { box.innerHTML = ''; return; }
  const hits: [number, number][] = [];
  for (let i = 0; i < N && hits.length < 4000; i++) { const p = folded[i].indexOf(q); if (p >= 0) hits.push([i, p === 0 ? 0 : folded[i][p - 1] === ' ' ? 1 : 2]); else if (foldedPeople[i].includes(q)) hits.push([i, 3]); }
  hits.sort((a, b) => a[1] - b[1] || tree.nodes[a[0]].name.length - tree.nodes[b[0]].name.length);
  box.innerHTML = hits.length ? hits.slice(0, 40).map(([i]) => { const n = tree.nodes[i]; return `<button class="result" data-go="${i}"><strong>${esc(n.name)}</strong><span>${when(n)}</span><small>${esc(tree.domains[n.domainIndex].name)} › ${esc(tree.subs[n.subIndex].name)}${n.people ? ' · ' + esc(n.people) : ''}</small></button>`; }).join('') : `<p class="empty">${t('noResults')}</p>`;
});
const press = (id: string, fn: (on: boolean) => void) => $(id).addEventListener('click', e => { const b = e.currentTarget as HTMLElement, on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); fn(on); invalidate(); });
for (const k of KINDS) press('#kind-' + k, on => { if (on) hiddenKinds.delete(k); else hiddenKinds.add(k); fillColors(); renderer.setColors(nodeSet, nodeColor); renderer.setColors(edgeSet, edgeColor); if (selected >= 0) select(visible(selected) ? selected : -1); });
press('#layer-links', on => { showLinks = on; }); press('#layer-stages', on => { showStages = on; }); press('#layer-stage-colors', on => { stageColors = on; }); press('#layer-names', on => { showNames = on; });
press('#layer-progressive', on => { progressive = on; try { localStorage.setItem('techtree-progressive', on ? 'on' : 'off'); } catch { /* sin almacenamiento */ } if (!on) void tree.detailAll(); });
if (!progressive) void tree.detailAll();
$('#fullscreen-button').addEventListener('click', () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.(); });
function syncAppearance() {
  applyAppearance(); $('#appearance-button').innerHTML = icon(appearanceIcons[appearance]); $('#appearance-button').title = `${t('theme')}: ${t(appearance)}`;
  document.querySelectorAll<HTMLElement>('[data-appearance]').forEach(b => { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.appearance === appearance)); });
  refreshIcons(); if (selected >= 0) select(selected); invalidate();
}
$('#appearance-panel').addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-appearance]'); if (!b) return; appearance = b.dataset.appearance as Appearance; try { localStorage.setItem('techtree-appearance', appearance); } catch { /* sin almacenamiento */ } closePopovers(); syncAppearance(); });
setInterval(() => { if (appearance === 'auto' && document.documentElement.dataset.appearance !== resolveAppearance()) syncAppearance(); }, 60000);

// ───────── Acerca de e instalación ─────────
let installPrompt: (Event & { prompt(): Promise<void> }) | null = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e as typeof installPrompt; });
$('#about-button').addEventListener('click', () => {
  closePopovers(); $('#about-body').innerHTML = aboutContent(__VERSION__, base, { nodes: N, edges: E, domains: tree.domains.length }); refreshIcons();
  const button = $('#install-button'); button.hidden = !installPrompt; $('#install-hint').hidden = !!installPrompt;
  button.addEventListener('click', () => { void installPrompt?.prompt(); installPrompt = null; button.hidden = true; });
  $<HTMLDialogElement>('#about').showModal();
});
if ('serviceWorker' in navigator && import.meta.env.PROD) void navigator.serviceWorker.register(base + 'sw.js');

// ───────── Enciclopedia (primera versión: una página por avance) ─────────
let indexBuilt = false;
function openEncyclopedia(i = selected) {
  closePopovers(); const dialog = $<HTMLDialogElement>('#encyclopedia');
  if (!indexBuilt) {
    indexBuilt = true; const bySub: Tech[][] = tree.subs.map(() => []); for (const n of tree.nodes) bySub[n.subIndex].push(n);
    $('#enc-index').innerHTML = tree.domains.map((d, di) => `<details><summary><i class="swatch" style="background:${d.color};width:9px;height:9px"></i>${esc(d.name)}</summary>${tree.subs.map((s, si) => s.domain !== d.id ? '' : `<details data-sub="${si}"><summary>${esc(s.name)} <b>${num(bySub[si].length)}</b></summary></details>`).join('')}</details>`).join('');
    // Los avances de cada subámbito se generan al desplegarlo: el índice no crece con el tamaño del árbol.
    $('#enc-index').addEventListener('toggle', e => { const el = e.target as HTMLDetailsElement; if (!el.open || el.dataset.sub === undefined || el.dataset.filled) return; el.dataset.filled = '1'; el.insertAdjacentHTML('beforeend', bySub[Number(el.dataset.sub)].sort((a, b) => a.t - b.t).slice(0, 5000).map(n => `<button class="tech-link" data-article="${n.i}"><strong>${esc(n.name)}</strong><span>${when(n)}</span></button>`).join('')); }, true);
    $('#enc-index').addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-article]'); if (b) showArticle(Number(b.dataset.article)); });
    $('#article').addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-article]'); if (b) showArticle(Number(b.dataset.article)); });
  }
  void showArticle(i); if (!dialog.open) dialog.showModal();
}
async function showArticle(i: number) {
  stopReading(); const article = $('#article');
  if (i < 0) { article.innerHTML = `<p class="lead">${t('encIntro')}</p>`; return; }
  await tree.detail(tree.nodes[i]);
  const n = tree.nodes[i], anc = [...ancestors(tree, i)], link = (ids: number[]) => ids.length ? `<div class="tech-list">${ids.map(k => tree.nodes[k]).sort((a, b) => a.t - b.t).map(m => `<button class="tech-link" data-article="${m.i}"><i style="background:${tree.domains[m.domainIndex].color}"></i><strong>${esc(m.name)}</strong><span>${when(m)}</span></button>`).join('')}</div>` : `<p class="empty">${t('none')}</p>`;
  article.innerHTML = `<span class="eyebrow">${eyebrow(n)}</span><h1>${esc(n.name)}</h1><p class="meta tech-date">${dateLine(n)}${n.people ? ` <span>· ${esc(n.people)}</span>` : ''}</p>
  <button class="text-button" data-go="${n.i}">${icon('crosshair')}${t('showInTree')}</button><p class="lead">${esc(n.summary)}</p>
  <h3>${t('requires')} · ${n.req.length}</h3>${link(n.req)}<h3>${t('enables')} · ${n.enables.length}</h3>${link(n.enables)}
  <details><summary>${t('lineage')} <b>${num(anc.length)}</b></summary>${link(anc)}</details>`;
  article.scrollTop = 0; refreshIcons();
}
$('#encyclopedia-button').addEventListener('click', () => openEncyclopedia());
let reading = false;
function stopReading() { if (!reading) return; reading = false; speechSynthesis.cancel(); $('#read-button span').textContent = t('readAloud'); }
$('#read-button').addEventListener('click', () => {
  if (reading) { stopReading(); return; } if (!('speechSynthesis' in window)) return;
  const article = $('#article'); let text = article.innerText; const selection = getSelection(), chosen = selection && article.contains(selection.anchorNode) ? selection.toString().trim() : '';
  if (chosen) { const at = text.indexOf(chosen.split('\n')[0]); if (at > 0) text = text.slice(at); } // desde el punto seleccionado
  const speech = new SpeechSynthesisUtterance(text); speech.lang = 'es-ES'; speech.onend = speech.onerror = () => { reading = false; $('#read-button span').textContent = t('readAloud'); };
  reading = true; $('#read-button span').textContent = t('stopReading'); speechSynthesis.speak(speech);
});
$('#encyclopedia').addEventListener('close', stopReading);

// ───────── Arranque ─────────
/** Enlaces externos (p. ej. desde Historicmap): #t=<id> abre un avance; #y=<año> centra una fecha. */
function fromHash(animate: boolean) {
  const h = new URLSearchParams(location.hash.slice(1)), id = h.get('t'), y = h.get('y'); let target: ReturnType<typeof targetFor> | null = null;
  if (id && tree.byId.has(id)) { const i = tree.byId.get(id)!.i; select(i); target = targetFor(i, Math.max(.9, view.scale)); }
  else if (y && Number.isFinite(Number(y))) target = targetFor(-1, Math.max(view.scale, .35), layout.yearToX(Number(y)));
  if (!target) return; if (animate) flyTo(target); else { Object.assign(view, target); clampView(); }
}
addEventListener('resize', resize); addEventListener('hashchange', () => fromHash(true));
resize(); Object.assign(view, homeView()); clampView(); syncAppearance(); fromHash(false);
if (stress) { toast.textContent = t('stress', { n: num(N) }); console.info(`techtree: ${N} elementos preparados en ${Math.round(performance.now())} ms`); } else toast.hidden = true;
void document.fonts?.ready.then(() => { fitCache.clear(); invalidate(); });
requestAnimationFrame(loop);
/** Acceso programático para pruebas e integraciones con otros proyectos del ecosistema. */
(window as unknown as { techtree: unknown }).techtree = { tree, layout, view, select, flyTo, fitView };
