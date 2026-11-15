export type Kind = 'descubrimiento' | 'invento' | 'tecnica' | 'material' | 'herramienta' | 'teoria' | 'sistema' | 'via-muerta';
export const KINDS: Kind[] = ['descubrimiento', 'invento', 'tecnica', 'material', 'herramienta', 'teoria', 'sistema', 'via-muerta'];
export interface Domain { id: string; name: string; color: string }
export interface Subdomain { id: string; domain: string; name: string }
export interface Tech {
  id: string; name: string; year: number; approx: boolean; kind: Kind; domain: string; sub: string;
  summary: string; people: string; requires: string[];
  /** índices resueltos */ i: number; req: number[]; enables: number[]; subIndex: number; domainIndex: number;
}
export interface Tree { domains: Domain[]; subs: Subdomain[]; nodes: Tech[]; byId: Map<string, Tech>; presentYear: number }

export async function loadTree(base: string): Promise<Tree> {
  const raw = await (await fetch(base + 'data/techtree.json')).json();
  return link(raw.domains, raw.subdomains, raw.nodes);
}
export function link(domains: Domain[], subs: Subdomain[], nodes: Tech[]): Tree {
  const byId = new Map<string, Tech>(), subIndex = new Map(subs.map((s, i) => [s.id, i])), domIndex = new Map(domains.map((d, i) => [d.id, i]));
  nodes.forEach((n, i) => { n.i = i; n.req = []; n.enables = []; n.subIndex = subIndex.get(n.sub)!; n.domainIndex = domIndex.get(n.domain)!; byId.set(n.id, n); });
  for (const n of nodes) for (const r of n.requires) { const p = byId.get(r); if (p) { n.req.push(p.i); p.enables.push(n.i); } }
  return { domains, subs, nodes, byId, presentYear: new Date().getFullYear() };
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
