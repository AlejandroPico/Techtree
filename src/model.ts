export type Kind = 'descubrimiento' | 'invento' | 'tecnica' | 'material' | 'herramienta' | 'teoria' | 'sistema' | 'via-muerta';
export const KINDS: Kind[] = ['descubrimiento', 'invento', 'tecnica', 'material', 'herramienta', 'teoria', 'sistema', 'via-muerta'];
export interface Domain { id: string; name: string; color: string }
export interface Subdomain { id: string; domain: string; name: string }
export interface Tech {
  id: string; name: string; year: number; /** fecha exacta opcional: AAAA-MM o AAAA-MM-DD */ date?: string; /** posición temporal en años decimales */ t: number; approx: boolean; kind: Kind; domain: string; sub: string;
  summary: string; people: string; requires: string[];
  /** índices resueltos */ i: number; req: number[]; enables: number[]; subIndex: number; domainIndex: number;
}
export interface Tree { domains: Domain[]; subs: Subdomain[]; nodes: Tech[]; byId: Map<string, Tech>; presentYear: number; /** asegura que el resumen del avance está cargado */ detail(n: Tech): Promise<void>; /** descarga todos los resúmenes de una vez */ detailAll(): Promise<unknown> }

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** Fracción de año de una fecha AAAA-MM(-DD): los meses ocupan doceavos iguales, como en la regla. */
export function dateFraction(date?: string) { if (!date) return 0; const [, m, d] = date.split('-').map(Number); return ((m - 1) + ((d || 1) - 1) / DAYS[m - 1]) / 12; }
export { DAYS };
/**
 * Carga progresiva: primero la estructura (sin textos), después los nombres del idioma y,
 * solo al abrir una ficha, los resúmenes del ámbito correspondiente.
 */
export async function loadTree(base: string, lang: string): Promise<Tree> {
  const idx = await (await fetch(base + 'data/indice.json')).json(), content: string = idx.langs.includes(lang) ? lang : 'es';
  const text = await (await fetch(`${base}data/textos/${content}/nombres.json`)).json(), approx = new Set<number>(idx.approx);
  const domains: Domain[] = idx.domains.map((d: Domain, i: number) => ({ id: d.id, color: d.color, name: text.domains[i] }));
  const subs: Subdomain[] = idx.subs.map((s: { id: string; domain: number }, i: number) => ({ id: s.id, domain: domains[s.domain].id, name: text.subs[i] }));
  const nodes = (idx.id as string[]).map((id, i) => ({ id, name: text.names[i], year: idx.year[i], date: idx.date[i] ?? '', approx: approx.has(i), kind: idx.kinds[idx.kind[i]],
    sub: subs[idx.sub[i]].id, domain: subs[idx.sub[i]].domain, summary: '', people: idx.people[i] ?? '', requires: (idx.req[i] as number[]).map(r => idx.id[r]) })) as unknown as Tech[];
  const tree = link(domains, subs, nodes), pending = new Map<number, Promise<void>>();
  tree.detail = n => {
    if (n.summary) return Promise.resolve(); let p = pending.get(n.domainIndex);
    if (!p) { p = fetch(`${base}data/textos/${content}/detalle-${n.domain}.json`).then(r => r.json()).then((t: Record<string, string>) => { for (const k in t) nodes[Number(k)].summary = t[k]; }); pending.set(n.domainIndex, p); }
    return p;
  };
  tree.detailAll = () => { const one = new Map<number, Tech>(); for (const n of nodes) if (!one.has(n.domainIndex)) one.set(n.domainIndex, n); return Promise.all([...one.values()].map(n => tree.detail(n))); };
  return tree;
}
export function link(domains: Domain[], subs: Subdomain[], nodes: Tech[]): Tree {
  const byId = new Map<string, Tech>(), subIndex = new Map(subs.map((s, i) => [s.id, i])), domIndex = new Map(domains.map((d, i) => [d.id, i]));
  nodes.forEach((n, i) => { n.i = i; n.t = n.year + dateFraction(n.date); n.req = []; n.enables = []; n.subIndex = subIndex.get(n.sub)!; n.domainIndex = domIndex.get(n.domain)!; byId.set(n.id, n); });
  for (const n of nodes) for (const r of n.requires) { const p = byId.get(r); if (p) { n.req.push(p.i); p.enables.push(n.i); } }
  return { domains, subs, nodes, byId, presentYear: new Date().getFullYear(), detail: () => Promise.resolve(), detailAll: () => Promise.resolve() };
}
/** Todos los precedentes (transitivos) de un avance. */
export function ancestors(tree: Tree, start: number): Set<number> {
  const seen = new Set<number>(), stack = [...tree.nodes[start].req];
  while (stack.length) { const i = stack.pop()!; if (seen.has(i)) continue; seen.add(i); for (const r of tree.nodes[i].req) stack.push(r); }
  return seen;
}
/** Árbol sintético para probar el motor con millones de elementos (?stress=N). */
export function stressTree(real: Tree, count: number): Tree {
  let s = 12345; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const subs = real.subs, nodes: Tech[] = [];
  const kinds = KINDS;
  for (let i = 0; i < count; i++) {
    const u = rnd(), year = Math.round(u < .02 ? -3300000 * rnd() : u < .1 ? -10000 + 10000 * rnd() : u < .3 ? 1500 * rnd() : 1500 + 526 * Math.sqrt(rnd()));
    const sub = subs[(rnd() * subs.length) | 0];
    nodes.push({ id: 's' + i, name: 'Avance sintético ' + i, year, approx: false, kind: kinds[(rnd() * 8) | 0], domain: sub.domain, sub: sub.id, summary: 'Elemento de prueba de carga.', people: '', requires: [] } as unknown as Tech);
  }
  nodes.sort((a, b) => a.year - b.year);
  for (let i = 1; i < count; i++) { const k = 1 + ((rnd() * 2) | 0); for (let j = 0; j < k; j++) { const p = Math.max(0, i - 1 - ((rnd() * Math.min(i, 4000)) | 0)); if (nodes[p].year <= nodes[i].year) nodes[i].requires.push(nodes[p].id); } }
  return link(real.domains, subs, nodes);
}
