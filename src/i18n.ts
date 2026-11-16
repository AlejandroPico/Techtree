export type Lang = 'es' | 'ca' | 'en' | 'fr' | 'de' | 'pt' | 'it';
// Todos los textos de la interfaz viven en i18n/<idioma>/interfaz.json; añadir un idioma es añadir una carpeta.
const files = import.meta.glob<Record<string, string>>('../i18n/*/interfaz.json', { eager: true, import: 'default' });
const tables: Record<string, Record<string, string>> = {};
for (const [path, table] of Object.entries(files)) tables[path.split('/').at(-2)!] = table;
export const uiLangs = Object.keys(tables);

export function detectLang(): Lang {
  const forced = new URLSearchParams(location.search).get('lang');
  for (const candidate of [forced, ...navigator.languages]) { const code = candidate?.slice(0, 2).toLowerCase() as Lang; if (code && tables[code]) return code; }
  return 'en';
}
export const lang = detectLang();
export function t(key: string, vars?: Record<string, string | number>) {
  let s = tables[lang]?.[key] ?? tables.es[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', String(v));
  return s;
}
const nf = new Intl.NumberFormat(lang);
export const num = (n: number) => nf.format(n);
export function formatYear(year: number, approx = false) {
  const y = Math.round(year), c = approx ? t('circa') + ' ' : '';
  if (y <= -1000000) return c + nf.format(Math.round(-y / 10000) / 100) + ' Ma';
  if (y < 0) return c + (y <= -10000 ? nf.format(-y) : String(-y)) + ' ' + t('bc');
  return c + String(y);
}
const months = Array.from({ length: 12 }, (_, m) => new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2001, m, 15))).replace('.', ''));
export const monthName = (m: number) => months[m];
