#!/usr/bin/env python3
"""Importa el árbol tecnológico de Blue Marble Crisis a tecnologias/40-bmc-*.tt.

    python tools/importar_bmc.py RUTA/A/tech_tree.json

Se traen las líneas de desarrollo (generaciones nombradas), las aplicaciones que cruzan familias y las
acciones de gobierno. NO se traen las «mejoras» (seguridad, custodia, rendimiento…): son variantes de juego,
no avances distintos. Tampoco los nodos posteriores al año actual. Las fechas son las del juego: orientativas (~).
Cada familia que en el juego no tenía requisito se ancla a un avance ya existente en Techtree.
"""
import json, sys, datetime, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOMAINS = {  # categoría del juego -> (id de ámbito, nombre, color)
    'tierra': ('guerra-terrestre', 'Guerra terrestre', '#9c6b4f'), 'mar': ('guerra-naval', 'Guerra naval', '#4f7fa8'),
    'aire': ('guerra-aerea', 'Guerra aérea', '#7fa6c9'), 'espacio': ('cohetes-espacio', 'Cohetería y espacio', '#8f86c9'),
    'nuclear': ('fisica-nuclear', 'Física nuclear', '#c9b24f'), 'nbq': ('defensa-nbq', 'Defensa NBQ', '#8fb04f'),
    'electronica': ('sensores', 'Electrónica y sensores', '#4fb0b8'), 'informatica': ('guerra-digital', 'Informática y guerra digital', '#5f8fd3'),
    'industria': ('industria', 'Industria', '#b8804f'), 'economia': ('economia', 'Economía', '#b0a04f'),
    'sociedad': ('sociedad-civil', 'Sociedad', '#c98fa0'), 'medicina': ('sanidad', 'Medicina y sanidad', '#d0707f'),
    'doctrina_tierra': ('doctrinas', 'Doctrinas militares', '#a08070'), 'doctrina_mar': ('doctrinas', 'Doctrinas militares', '#a08070'),
    'doctrina_aire': ('doctrinas', 'Doctrinas militares', '#a08070'), 'doctrina_espacio': ('doctrinas', 'Doctrinas militares', '#a08070'),
    'inteligencia': ('inteligencia', 'Inteligencia y espionaje', '#7f7fa0'), 'contrainteligencia': ('contrainteligencia', 'Contrainteligencia', '#8f7f90'),
    'politica': ('politica', 'Política y gobierno', '#a07f5f')}
ANCHOR = {  # categoría -> avance de Techtree del que cuelgan las familias sin requisito
    'tierra': 'fusil-lebel', 'mar': 'casco-acero', 'aire': 'planeador', 'espacio': 'ecuacion-cohete', 'nuclear': 'fision', 'nbq': 'gas-cloro',
    'electronica': 'radiotelegrafia', 'informatica': 'tabuladora', 'industria': 'convertidor-bessemer', 'economia': 'banco-central',
    'sociedad': 'enciclopedia-diderot', 'medicina': 'antisepsia', 'doctrina_tierra': 'contramarcha', 'doctrina_mar': 'navio-linea',
    'doctrina_aire': 'globo', 'doctrina_espacio': 'ecuacion-cohete', 'inteligencia': 'telegrafo-electrico', 'contrainteligencia': 'telegrafo-electrico', 'politica': 'codigo-leyes'}
SPECIFIC = {'ind_siderurgia': 'siemens-martin', 'ele_radio': 'radiotelegrafia', 'inf_criptografia': 'maquina-enigma', 'tie_logistica': 'ferrocarril-publico',
            'tie_ingenieria': 'alambre-espino', 'mar_minas': 'torpedo', 'air_as': 'avion', 'soc_educacion': 'universidad', 'soc_sanidad': 'alcantarillado-londres',
            'soc_medios': 'rotativa', 'med_cirugia': 'anestesia', 'med_farmacos': 'aspirina', 'med_epidemias': 'teoria-germinal', 'eco_banca': 'banca-deposito',
            'ele_optica': 'vidrio-optico', 'inf_datos': 'tabuladora', 'mar_logistica': 'barco-vapor', 'int_fotografia': 'pelicula-rollo', 'soc_urbanismo': 'alcantarillado-londres',
            'pol_diplomacia': 'telegrafo-electrico', 'eco_industrial': 'riqueza-naciones', 'soc_servicios': 'cooperativa', 'nbq_proteccion': 'gas-cloro'}
KIND = {'linea': 'I', 'aplicacion': 'S', 'accion': 'S'}

def main():
    src = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')); now = datetime.date.today().year
    keep = {n['id']: n for n in src if n['kind'] != 'mejora' and n['year'] <= now}
    fam_name = {n['family']: n['familyName'] for n in src}
    tid = lambda i: 'bmc-' + i.replace('_', '-').lower()
    files = collections.OrderedDict(); stats = collections.Counter()
    for n in keep.values():
        cat = n['categories'][0]; dom = DOMAINS[cat]
        reqs = [r for r in n['prerequisites'] if r in keep and keep[r]['year'] <= n['year']]
        ids = [tid(r) for r in reqs][:8]
        if not ids: ids = [SPECIFIC.get(n['family'], ANCHOR[cat])]; stats['anclados'] += 1
        if n['kind'] == 'linea': text = f"Generación {n['generation'] + 1} de la línea «{n['familyName']}». Fecha orientativa, tomada de Blue Marble Crisis."
        elif n['kind'] == 'aplicacion': text = 'Aplicación que combina ' + ', '.join(sorted({fam_name[keep[r]['family']].lower() for r in reqs})) + '. Fecha orientativa, tomada de Blue Marble Crisis.'
        else: text = f"Medida de gobierno de «{n['familyName']}»: no se descubre, se adopta. Fecha orientativa, tomada de Blue Marble Crisis."
        name = n['name'].replace('|', '/').strip()
        files.setdefault(dom, collections.OrderedDict()).setdefault((n['family'], n['familyName']), []).append(
            f"{tid(n['id'])} | ~{n['year']} | {KIND[n['kind']]} | {name} | {', '.join(ids)} | {text} |")
        stats[n['kind']] += 1
    for k, (dom, subs) in enumerate(files.items()):
        out = ['# Importado de Blue Marble Crisis con tools/importar_bmc.py. Fechas de juego, sin contrastar; nombres originales del autor.',
               f'@ {dom[0]} | {dom[1]} | {dom[2]}']
        for (fam, fname), lines in subs.items(): out += [f"@@ {fam.replace('_', '-')} | {fname}"] + sorted(lines, key=lambda l: int(l.split(' | ')[1][1:]))
        (ROOT / 'tecnologias' / f'40-bmc-{dom[0]}.tt').write_text('\n'.join(out) + '\n', encoding='utf-8', newline='\n')
    print(dict(stats), len(files), 'ámbitos')

if __name__ == '__main__': main()
