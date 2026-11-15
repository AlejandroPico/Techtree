/** Periodización de referencia (Próximo Oriente y Europa). Las edades de los metales no fueron simultáneas en el mundo. */
export interface Period { name: string; from: number; to: number; row: 0 | 1 | 2; color: string }
const P = (row: 0 | 1 | 2, name: string, from: number, to: number, color: string): Period => ({ row, name, from, to, color });
export const NOW = 9999;
export const periods: Period[] = [
  P(0, 'Prehistoria', -3400000, -3300, '#7d6f5d'), P(0, 'Edad Antigua', -3300, 476, '#a5814f'), P(0, 'Edad Media', 476, 1492, '#6d7f8f'),
  P(0, 'Edad Moderna', 1492, 1789, '#8a6c9a'), P(0, 'Edad Contemporánea', 1789, NOW, '#4f8c86'),
  P(1, 'Paleolítico inferior', -3400000, -300000, '#8c7a66'), P(1, 'Paleolítico medio', -300000, -50000, '#99836a'), P(1, 'Paleolítico superior', -50000, -12000, '#a68d6d'),
  P(1, 'Epipaleolítico', -12000, -10000, '#9c9a70'), P(1, 'Neolítico', -10000, -4500, '#86a06c'), P(1, 'Calcolítico', -4500, -3300, '#c08a5a'),
  P(1, 'Edad del Bronce', -3300, -1200, '#b9853f'), P(1, 'Edad del Hierro', -1200, -500, '#7f8790'), P(1, 'Antigüedad clásica', -500, 284, '#b59a62'),
  P(1, 'Antigüedad tardía', 284, 476, '#a08a72'), P(1, 'Alta Edad Media', 476, 1000, '#667a8c'), P(1, 'Plena Edad Media', 1000, 1300, '#748aa0'),
  P(1, 'Baja Edad Media', 1300, 1492, '#8298ad'), P(1, 'Exploraciones oceánicas', 1492, 1600, '#8f6fa0'), P(1, 'Barroco', 1600, 1715, '#9c7aa6'),
  P(1, 'Ilustración', 1715, 1789, '#a987ad'), P(1, 'Era de las revoluciones', 1789, 1848, '#4c8f8a'), P(1, 'Era industrial e imperios', 1848, 1914, '#5a9a8c'),
  P(1, 'Guerras mundiales', 1914, 1945, '#7b8f86'), P(1, 'Guerra Fría', 1945, 1991, '#5f93a8'), P(1, 'Globalización', 1991, NOW, '#5aa0b8'),
  P(2, 'Modo 1 · Olduvayense', -2600000, -1760000, '#857564'), P(2, 'Modo 2 · Achelense', -1760000, -300000, '#917f69'), P(2, 'Modo 3 · Musteriense', -300000, -50000, '#9d896d'),
  P(2, 'Modo 4 · láminas', -50000, -12000, '#aa9370'), P(2, 'Revolución neolítica', -10000, -6000, '#7fa262'), P(2, 'Revolución urbana', -3800, -3000, '#c3924c'),
  P(2, 'Revolución científica', 1543, 1687, '#9a7fc0'), P(2, '1.ª Revolución Industrial', 1760, 1840, '#c9714a'), P(2, '2.ª Revolución Industrial', 1870, 1914, '#d39a3e'),
  P(2, 'Era atómica y espacial', 1945, 1969, '#c66a78'), P(2, '3.ª Rev. Industrial · digitalización', 1969, 2011, '#4f9fd0'), P(2, '4.ª Rev. Industrial', 2011, NOW, '#58b7c0'),
];
