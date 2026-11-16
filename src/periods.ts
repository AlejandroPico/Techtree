import { lang } from './i18n';
/** Periodización de referencia (Próximo Oriente y Europa). Las edades de los metales no fueron simultáneas en el mundo. */
export interface Period { id: string; name: string; from: number; to: number; row: 0 | 1 | 2; color: string }
// Los nombres viven en i18n/<idioma>/periodos.json.
const files = import.meta.glob<Record<string, string>>('../i18n/*/periodos.json', { eager: true, import: 'default' });
const names: Record<string, Record<string, string>> = {}; for (const [path, table] of Object.entries(files)) names[path.split('/').at(-2)!] = table;
const P = (row: 0 | 1 | 2, id: string, from: number, to: number, color: string): Period => ({ row, id, name: names[lang]?.[id] ?? names.es[id] ?? id, from, to, color });
export const NOW = 9999;
export const periods: Period[] = [
  P(0, 'prehistoria', -3400000, -3300, '#7d6f5d'), P(0, 'edad-antigua', -3300, 476, '#a5814f'), P(0, 'edad-media', 476, 1492, '#6d7f8f'),
  P(0, 'edad-moderna', 1492, 1789, '#8a6c9a'), P(0, 'edad-contemporanea', 1789, NOW, '#4f8c86'),
  P(1, 'paleolitico-inferior', -3400000, -300000, '#8c7a66'), P(1, 'paleolitico-medio', -300000, -50000, '#99836a'), P(1, 'paleolitico-superior', -50000, -12000, '#a68d6d'),
  P(1, 'epipaleolitico', -12000, -10000, '#9c9a70'), P(1, 'neolitico', -10000, -4500, '#86a06c'), P(1, 'calcolitico', -4500, -3300, '#c08a5a'),
  P(1, 'edad-del-bronce', -3300, -1200, '#b9853f'), P(1, 'edad-del-hierro', -1200, -500, '#7f8790'), P(1, 'antiguedad-clasica', -500, 284, '#b59a62'),
  P(1, 'antiguedad-tardia', 284, 476, '#a08a72'), P(1, 'alta-edad-media', 476, 1000, '#667a8c'), P(1, 'plena-edad-media', 1000, 1300, '#748aa0'),
  P(1, 'baja-edad-media', 1300, 1492, '#8298ad'), P(1, 'exploraciones-oceanicas', 1492, 1600, '#8f6fa0'), P(1, 'barroco', 1600, 1715, '#9c7aa6'),
  P(1, 'ilustracion', 1715, 1789, '#a987ad'), P(1, 'era-de-las-revoluciones', 1789, 1848, '#4c8f8a'), P(1, 'era-industrial-e-imperios', 1848, 1914, '#5a9a8c'),
  P(1, 'guerras-mundiales', 1914, 1945, '#7b8f86'), P(1, 'guerra-fria', 1945, 1991, '#5f93a8'), P(1, 'globalizacion', 1991, NOW, '#5aa0b8'),
  P(2, 'modo-1-olduvayense', -2600000, -1760000, '#857564'), P(2, 'modo-2-achelense', -1760000, -300000, '#917f69'), P(2, 'modo-3-musteriense', -300000, -50000, '#9d896d'),
  P(2, 'modo-4-laminas', -50000, -12000, '#aa9370'), P(2, 'revolucion-neolitica', -10000, -6000, '#7fa262'), P(2, 'revolucion-urbana', -3800, -3000, '#c3924c'),
  P(2, 'revolucion-cientifica', 1543, 1687, '#9a7fc0'), P(2, '1-revolucion-industrial', 1760, 1840, '#c9714a'), P(2, '2-revolucion-industrial', 1870, 1914, '#d39a3e'),
  P(2, 'era-atomica-y-espacial', 1945, 1969, '#c66a78'), P(2, '3-rev-industrial-digitalizacion', 1969, 2011, '#4f9fd0'), P(2, '4-rev-industrial', 2011, NOW, '#58b7c0'),
];
