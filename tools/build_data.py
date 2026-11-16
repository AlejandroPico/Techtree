#!/usr/bin/env python3
"""Compila tecnologias/*.tt en los datos que consumen la web y otros proyectos.

Entrada
  tecnologias/*.tt          fuente canónica (estructura + texto en español), una tecnología por línea:
      @ id-ambito | Nombre del ámbito | #color
      @@ id-subambito | Nombre del subámbito
      id | año | tipo | Nombre | requisitos,inmediatos | Resumen | Personas
    Año: entero (negativo = a. C.) o fecha AAAA-MM / AAAA-MM-DD; prefijo ~ = fecha aproximada.
    Tipos: D descubrimiento · I invento · T técnica/proceso · M material · H herramienta
           C concepto/teoría · S sistema/infraestructura · X vía muerta, superada o pseudociencia
  i18n/<idioma>/ambitos.json, i18n/<idioma>/tecnologias/*.json   traducciones (opcionales salvo «es»)

Salida
  i18n/es/ambitos.json, i18n/es/tecnologias/*.json   texto español extraído, listo para copiar y traducir
  public/data/indice.json                            estructura de todo el árbol, sin textos (carga inicial)
  public/data/textos/<idioma>/nombres.json           nombres (segunda carga)
  public/data/textos/<idioma>/detalle-<ambito>.json  resúmenes, bajo demanda al abrir una ficha
  public/data/techtree.json, techtree.db             exportación completa en español (JSON y SQLite)

Valida: ids únicos, requisitos existentes, requisito no posterior al avance, ausencia de ciclos.
"""
import json, re, shutil, sqlite3, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, I18N, OUT = ROOT / 'tecnologias', ROOT / 'i18n', ROOT / 'public' / 'data'
KINDS = {'D': 'descubrimiento', 'I': 'invento', 'T': 'tecnica', 'M': 'material', 'H': 'herramienta',
         'C': 'teoria', 'S': 'sistema', 'X': 'via-muerta'}
KIND_ORDER = list(KINDS.values())


def parse():
    domains, subs, nodes, errors = [], [], [], []
    for path in sorted(SRC.glob('*.tt')):
        dom = sub = None
        for n, raw in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            line = raw.strip()
            if not line or line.startswith('#'): continue
            where = f'{path.name}:{n}'
            if line.startswith('@@'):
                p = [x.strip() for x in line[2:].split('|')]
                sid = f"{dom['id']}/{p[0]}"; sub = next((x for x in subs if x['id'] == sid), None)
                if sub is None: sub = {'id': sid, 'domain': dom['id'], 'name': p[1]}; subs.append(sub)
                continue
            if line.startswith('@'):
                p = [x.strip() for x in line[1:].split('|')]
                dom = next((x for x in domains if x['id'] == p[0]), None)  # un ámbito puede continuar en otro archivo
                if dom is None: dom = {'id': p[0], 'name': p[1], 'color': p[2]}; domains.append(dom)
                sub = None; continue
            p = [x.strip() for x in line.rstrip('| ').split('|')]
            while len(p) < 7: p.append('')
            if not p[5]: errors.append(f'{where}: faltan campos'); continue
            if sub is None: errors.append(f'{where}: tecnología fuera de subámbito'); continue
            ys = p[1]; approx = ys.startswith('~'); ys = ys.lstrip('~')
            m = re.fullmatch(r'(-?\d+)(?:-(\d\d)(?:-(\d\d))?)?', ys)
            if not m or (m.group(2) and not 1 <= int(m.group(2)) <= 12) or (m.group(3) and not 1 <= int(m.group(3)) <= 31): errors.append(f'{where}: fecha inválida {p[1]}'); continue
            if p[2] not in KINDS: errors.append(f'{where}: tipo inválido {p[2]}'); continue
            nodes.append({'id': p[0], 'year': int(m.group(1)), 'date': ys if m.group(2) else '', 'approx': approx, 'kind': KINDS[p[2]], 'name': p[3],
                          'requires': [r.strip() for r in p[4].split(',') if r.strip()], 'summary': p[5], 'people': p[6],
                          'domain': dom['id'], 'sub': sub['id'], '_w': where, '_f': path.stem})
    return domains, subs, nodes, errors


def validate(nodes, errors):
    by = {}
    for n in nodes:
        if n['id'] in by: errors.append(f"{n['_w']}: id duplicado {n['id']} (también en {by[n['id']]['_w']})")
        by[n['id']] = n
    for n in nodes:
        for r in n['requires']:
            if r not in by: errors.append(f"{n['_w']}: {n['id']} requiere '{r}', que no existe")
            elif (by[r]['year'], by[r]['date']) > (n['year'], n['date'] or '9'): errors.append(f"{n['_w']}: {n['id']} ({n['year']}) requiere {r} ({by[r]['year']}), posterior")
            elif r == n['id']: errors.append(f"{n['_w']}: {n['id']} se requiere a sí mismo")
    state = {}
    def visit(i, trail):
        if state.get(i) == 2 or i not in by: return
        if state.get(i) == 1: errors.append('ciclo: ' + ' -> '.join(trail + [i])); return
        state[i] = 1
        for r in by[i]['requires']: visit(r, trail + [i])
        state[i] = 2
    sys.setrecursionlimit(1000000)
    for n in nodes: visit(n['id'], [])


def dump(path, data, pretty=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=1) + '\n' if pretty else json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    if not path.exists() or path.read_text(encoding='utf-8') != text: path.write_text(text, encoding='utf-8', newline='\n')


def load(path):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}


def main():
    domains, subs, nodes, errors = parse(); validate(nodes, errors)
    if errors:
        print('\n'.join(errors)); print(f'\n{len(errors)} errores'); sys.exit(1)
    order = {d['id']: i for i, d in enumerate(domains)}; subs.sort(key=lambda x: order[x['domain']])
    sub_index = {s['id']: i for i, s in enumerate(subs)}; node_index = {n['id']: i for i, n in enumerate(nodes)}

    # 1. Texto español extraído a i18n/es (punto de partida de cualquier traducción).
    dump(I18N / 'es' / 'ambitos.json', {**{d['id']: d['name'] for d in domains}, **{s['id']: s['name'] for s in subs}}, pretty=True)
    files = {}
    for n in nodes: files.setdefault(n['_f'], {})[n['id']] = {'nombre': n['name'], 'resumen': n['summary']}
    for stem, table in files.items(): dump(I18N / 'es' / 'tecnologias' / f'{stem}.json', table, pretty=True)

    # 2. Índice estructural, sin textos.
    dump(OUT / 'indice.json', {
        'schema': 2, 'langs': sorted(p.name for p in I18N.iterdir() if (p / 'ambitos.json').exists()), 'kinds': KIND_ORDER,
        'domains': [{'id': d['id'], 'color': d['color']} for d in domains], 'subs': [{'id': s['id'], 'domain': order[s['domain']]} for s in subs],
        'id': [n['id'] for n in nodes], 'year': [n['year'] for n in nodes], 'date': {str(i): n['date'] for i, n in enumerate(nodes) if n['date']},
        'approx': [i for i, n in enumerate(nodes) if n['approx']], 'kind': [KIND_ORDER.index(n['kind']) for n in nodes],
        'sub': [sub_index[n['sub']] for n in nodes], 'req': [[node_index[r] for r in n['requires']] for n in nodes], 'people': {str(i): n['people'] for i, n in enumerate(nodes) if n['people']}})

    # 3. Textos por idioma: nombres en un archivo, resúmenes por ámbito. Lo no traducido cae al español.
    for lang_dir in sorted(p for p in I18N.iterdir() if (p / 'ambitos.json').exists()):
        lang = lang_dir.name; areas = load(lang_dir / 'ambitos.json'); tr = {}
        for f in sorted((lang_dir / 'tecnologias').glob('*.json')): tr.update(load(f))
        name = lambda n: tr.get(n['id'], {}).get('nombre') or n['name']
        dump(OUT / 'textos' / lang / 'nombres.json', {'domains': [areas.get(d['id'], d['name']) for d in domains], 'subs': [areas.get(s['id'], s['name']) for s in subs], 'names': [name(n) for n in nodes]})
        for d in domains:
            dump(OUT / 'textos' / lang / f"detalle-{d['id']}.json", {str(i): tr.get(n['id'], {}).get('resumen') or n['summary'] for i, n in enumerate(nodes) if n['domain'] == d['id']})

    # 4. Exportación completa en español para otros proyectos.
    clean = [{k: v for k, v in n.items() if not k.startswith('_')} for n in nodes]
    dump(OUT / 'techtree.json', {'schema': 1, 'domains': domains, 'subdomains': subs, 'nodes': clean})
    # SQLite se construye en un directorio temporal y se copia: no siempre puede bloquear archivos en carpetas de red o sincronizadas.
    tmp = Path(tempfile.mkdtemp()) / 'techtree.db'; c = sqlite3.connect(tmp)
    c.executescript('''
      CREATE TABLE domain(id TEXT PRIMARY KEY,name TEXT NOT NULL,color TEXT NOT NULL,position INTEGER NOT NULL);
      CREATE TABLE subdomain(id TEXT PRIMARY KEY,domain_id TEXT NOT NULL REFERENCES domain(id),name TEXT NOT NULL,position INTEGER NOT NULL);
      CREATE TABLE technology(id TEXT PRIMARY KEY,name TEXT NOT NULL,year INTEGER NOT NULL,date TEXT NOT NULL,approximate INTEGER NOT NULL,
        kind TEXT NOT NULL,domain_id TEXT NOT NULL REFERENCES domain(id),subdomain_id TEXT NOT NULL REFERENCES subdomain(id),
        summary TEXT NOT NULL,people TEXT NOT NULL);
      CREATE TABLE requirement(technology_id TEXT NOT NULL REFERENCES technology(id),requires_id TEXT NOT NULL REFERENCES technology(id),
        PRIMARY KEY(technology_id,requires_id)) WITHOUT ROWID;
      CREATE INDEX technology_year ON technology(year); CREATE INDEX requirement_reverse ON requirement(requires_id);
    ''')
    c.executemany('INSERT INTO domain VALUES(?,?,?,?)', [(d['id'], d['name'], d['color'], i) for i, d in enumerate(domains)])
    c.executemany('INSERT INTO subdomain VALUES(?,?,?,?)', [(s['id'], s['domain'], s['name'], i) for i, s in enumerate(subs)])
    c.executemany('INSERT INTO technology VALUES(?,?,?,?,?,?,?,?,?,?)', [(n['id'], n['name'], n['year'], n['date'], int(n['approx']), n['kind'], n['domain'], n['sub'], n['summary'], n['people']) for n in nodes])
    c.executemany('INSERT INTO requirement VALUES(?,?)', [(n['id'], r) for n in nodes for r in n['requires']])
    c.commit(); c.execute('VACUUM'); c.close(); (OUT / 'techtree.db').write_bytes(tmp.read_bytes()); shutil.rmtree(tmp.parent, ignore_errors=True)
    print(f"{len(nodes)} tecnologías · {sum(len(n['requires']) for n in nodes)} requisitos · {len(subs)} subámbitos · {len(domains)} ámbitos")


if __name__ == '__main__': main()
