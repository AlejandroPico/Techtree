# Techtree

Árbol tecnológico enciclopédico de la humanidad: cada descubrimiento, técnica, material, herramienta e invento colocado en su fecha y unido a sus **requisitos inmediatos** y a lo que hizo posible. Eje horizontal: tiempo (desde las primeras piedras talladas, hace 3,3 Ma). Eje vertical: ámbitos y subámbitos.

Forma parte del mismo ecosistema que [Historicmap](https://github.com/AlejandroPico/Historicmap) y está pensado para servir de base de datos a otros proyectos (entre ellos, un futuro videojuego).

## Estado (0.1.0)

| | |
|---|---|
| Avances | 890 |
| Requisitos | 1.466 |
| Ámbitos / subámbitos | 16 / 74 |
| Motor | probado con 1.000.000 de elementos sintéticos (`?stress=1000000`) |

El objetivo es crecer por fases hasta cientos de miles de avances; ver [tareas.md](tareas.md).

## Arquitectura

```
data/*.tt                fuente canónica, legible y revisable en git (una línea por avance)
tools/build_data.py      valida y compila  →  public/data/techtree.json  (web)
                                           →  public/data/techtree.db    (SQLite: videojuego y otros proyectos)
src/                     aplicación TypeScript + WebGL2 (Vite)
  model.ts               carga y grafo (requisitos, sucesores, precedentes)
  layout.ts              eje temporal elástico, carriles por ámbito, rejilla espacial
  renderer.ts            tarjetas y enlaces instanciados en GPU (un draw call por capa)
  periods.ts             edades, periodos y revoluciones de la regla
  main.ts                interfaz: menú, ficha flotante, regla, búsqueda, enciclopedia
tests/test_data.py       garantías de la base de datos
```

**Por qué así.** El valor que se reutiliza entre proyectos son los *datos*, no el visor: por eso la fuente es texto plano y se compila con Python a **SQLite**, que Unity, Godot, C#, Python o Java leen sin servidor. El visor usa TypeScript + Vite, igual que Historicmap, para compartir estética y poder enlazarse; el dibujo no pasa por el DOM ni por un framework de componentes, sino por WebGL2 instanciado, que es lo que permite mover millones de elementos.

### Formato de datos (`data/*.tt`)

```
@ id-ambito | Nombre del ámbito | #color
@@ id-subambito | Nombre del subámbito
id | año | tipo | Nombre | requisitos,inmediatos | Resumen | Personas
```

- **año**: entero, negativo = a. C.; prefijo `~` = fecha aproximada.
- **tipo**: `D` descubrimiento · `I` invento · `T` técnica/proceso · `M` material · `H` herramienta · `C` concepto/teoría · `S` sistema/infraestructura · `X` vía muerta, superada o pseudociencia.
- **requisitos**: solo los inmediatos. La bombilla requiere la bomba de Sprengel, no el fuego.

El compilador rechaza ids duplicados, requisitos inexistentes, requisitos posteriores al avance y ciclos.

### Esquema SQLite

`domain(id,name,color,position)` · `subdomain(id,domain_id,name,position)` · `technology(id,name,year,approximate,kind,domain_id,subdomain_id,summary,people)` · `requirement(technology_id,requires_id)`

### Enlaces desde otros proyectos

- `…/Techtree/#t=<id>` abre un avance (p. ej. `#t=imprenta`).
- `…/Techtree/#y=<año>` centra una fecha (p. ej. `#y=-3300`).
- `?lang=es|ca|en|fr|de|pt|it` fuerza el idioma (por defecto, el del sistema).
- `?stress=1000000` sustituye los datos por un árbol sintético para medir el motor.

## Uso

```
npm install
npm run dev        # compila datos y arranca en http://127.0.0.1:5173
npm test           # valida la base de datos
npm run build      # datos + comprobación de tipos + dist/
```

Requiere Node y Python 3 (solo biblioteca estándar). La publicación en GitHub Pages la hace `.github/workflows/pages.yml` en cada push a `main` (en *Settings → Pages*, la fuente debe ser **GitHub Actions**).

## Límites conocidos

- El contenido (nombres y resúmenes) está en español; la interfaz, en siete idiomas.
- Las fichas aún no llevan imagen ni referencias bibliográficas por avance.
- La periodización de la regla es la convencional de Próximo Oriente y Europa; las edades de los metales no fueron simultáneas en el mundo.
- La enciclopedia es una primera versión: una página breve por avance.
