#!/usr/bin/env python3
"""Compila data/*.tt -> public/data/techtree.json + public/data/techtree.db (SQLite).

Formato .tt (una tecnología por línea, campos separados por ' | '):
  @ id-ambito | Nombre del ámbito | #color
  @@ id-subambito | Nombre del subámbito
  id | año | tipo | Nombre | requisitos,inmediatos | Resumen | Personas
Año: entero (negativo = a. C.); prefijo ~ = fecha aproximada.
Tipos: D descubrimiento · I invento · T técnica/proceso · M material · H herramienta
       C concepto/teoría · S sistema/infraestructura · X vía muerta, superada o pseudociencia
Valida: ids únicos, requisitos existentes, requisito no posterior al avance, ausencia de ciclos.
"""
import json, re, shutil, sqlite3, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KINDS = {'D': 'descubrimiento', 'I': 'invento', 'T': 'tecnica', 'M': 'material', 'H': 'herramienta',
         'C': 'teoria', 'S': 'sistema', 'X': 'via-muerta'}

def parse():
    domains, subs, nodes, errors = [], [], [], []
    for path in sorted((ROOT / 'data').glob('*.tt')):
        dom = sub = None
        for n, raw in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            line = raw.strip()
            if not line or line.startswith('#'): continue
            where = f'{path.name}:{n}'
            if line.startswith('@@'):
                p = [x.strip() for x in line[2:].split('|')]
                sub = {'id': f"{dom['id']}/{p[0]}", 'domain': dom['id'], 'name': p[1]}; subs.append(sub); continue
            if line.startswith('@'):
                p = [x.strip() for x in line[1:].split('|')]
                dom = {'id': p[0], 'name': p[1], 'color': p[2]}; domains.append(dom); sub = None; continue
            p = [x.strip() for x in line.rstrip('| ').split('|')]
            while len(p) < 7: p.append('')
            if not p[5]: errors.append(f'{where}: faltan campos'); continue
            if sub is None: errors.append(f'{where}: tecnología fuera de subámbito'); continue
            ys = p[1]; approx = ys.startswith('~'); ys = ys.lstrip('~')
            if not re.fullmatch(r'-?\d+', ys): errors.append(f'{where}: año inválido {p[1]}'); continue
            if p[2] not in KINDS: errors.append(f'{where}: tipo inválido {p[2]}'); continue
            nodes.append({'id': p[0], 'year': int(ys), 'approx': approx, 'kind': KINDS[p[2]], 'name': p[3],
                          'requires': [r.strip() for r in p[4].split(',') if r.strip()], 'summary': p[5],
                          'people': p[6] if len(p) > 6 else '', 'domain': dom['id'], 'sub': sub['id'], '_w': where})
    return domains, subs, nodes, errors

def validate(nodes, errors):
    by = {}
    for n in nodes:
        if n['id'] in by: errors.append(f"{n['_w']}: id duplicado {n['id']} (también en {by[n['id']]['_w']})")
        by[n['id']] = n
    for n in nodes:
        for r in n['requires']:
            if r not in by: errors.append(f"{n['_w']}: {n['id']} requiere '{r}', que no existe")
            elif by[r]['year'] > n['year']: errors.append(f"{n['_w']}: {n['id']} ({n['year']}) requiere {r} ({by[r]['year']}), posterior")
            elif r == n['id']: errors.append(f"{n['_w']}: {n['id']} se requiere a sí mismo")
    state = {}
    def visit(i, trail):
        if state.get(i) == 2 or i not in by: return
        if state.get(i) == 1: errors.append('ciclo: ' + ' -> '.join(trail + [i])); return
        state[i] = 1
        for r in by[i]['requires']: visit(r, trail + [i])
        state[i] = 2
    sys.setrecursionlimit(100000)
    for n in nodes: visit(n['id'], [])

def main():
    domains, subs, nodes, errors = parse(); validate(nodes, errors)
    if errors:
        print('\n'.join(errors)); print(f'\n{len(errors)} errores'); sys.exit(1)
    for n in nodes: del n['_w']
    out = ROOT / 'public' / 'data'; out.mkdir(parents=True, exist_ok=True)
    (out / 'techtree.json').write_text(json.dumps({'schema': 1, 'domains': domains, 'subdomains': subs, 'nodes': nodes},
                                                  ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    # Se construye en un directorio temporal y se copia: SQLite no siempre puede bloquear archivos en carpetas de red o sincronizadas.
    tmp = Path(tempfile.mkdtemp()) / 'techtree.db'; c = sqlite3.connect(tmp)
    c.executescript('''
      CREATE TABLE domain(id TEXT PRIMARY KEY,name TEXT NOT NULL,color TEXT NOT NULL,position INTEGER NOT NULL);
      CREATE TABLE subdomain(id TEXT PRIMARY KEY,domain_id TEXT NOT NULL REFERENCES domain(id),name TEXT NOT NULL,position INTEGER NOT NULL);
      CREATE TABLE technology(id TEXT PRIMARY KEY,name TEXT NOT NULL,year INTEGER NOT NULL,approximate INTEGER NOT NULL,
        kind TEXT NOT NULL,domain_id TEXT NOT NULL REFERENCES domain(id),subdomain_id TEXT NOT NULL REFERENCES subdomain(id),
        summary TEXT NOT NULL,people TEXT NOT NULL);
      CREATE TABLE requirement(technology_id TEXT NOT NULL REFERENCES technology(id),requires_id TEXT NOT NULL REFERENCES technology(id),
        PRIMARY KEY(technology_id,requires_id)) WITHOUT ROWID;
      CREATE INDEX technology_year ON technology(year); CREATE INDEX requirement_reverse ON requirement(requires_id);
    ''')
    c.executemany('INSERT INTO domain VALUES(?,?,?,?)', [(d['id'], d['name'], d['color'], i) for i, d in enumerate(domains)])
    c.executemany('INSERT INTO subdomain VALUES(?,?,?,?)', [(s['id'], s['domain'], s['name'], i) for i, s in enumerate(subs)])
    c.executemany('INSERT INTO technology VALUES(?,?,?,?,?,?,?,?,?)', [(n['id'], n['name'], n['year'], int(n['approx']), n['kind'], n['domain'], n['sub'], n['summary'], n['people']) for n in nodes])
    c.executemany('INSERT INTO requirement VALUES(?,?)', [(n['id'], r) for n in nodes for r in n['requires']])
    c.commit(); c.execute('VACUUM'); c.close(); (out / 'techtree.db').write_bytes(tmp.read_bytes()); shutil.rmtree(tmp.parent, ignore_errors=True)
    edges = sum(len(n['requires']) for n in nodes)
    print(f'{len(nodes)} tecnologías · {edges} requisitos · {len(subs)} subámbitos · {len(domains)} ámbitos')

if __name__ == '__main__': main()
