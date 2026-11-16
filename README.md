# Techtree

Árbol tecnológico enciclopédico de la humanidad: cada descubrimiento, técnica, material, herramienta e invento colocado en su fecha y unido a sus **requisitos inmediatos** y a lo que hizo posible. Eje horizontal: tiempo (desde las primeras piedras talladas, hace 3,3 Ma). Eje vertical: ámbitos y subámbitos.

Forma parte del mismo ecosistema que [Historicmap](https://github.com/AlejandroPico/Historicmap) y está pensado para servir de base de datos a otros proyectos (entre ellos, un futuro videojuego).

## Estado (0.3.0)

| | |
|---|---|
| Avances | 3.779 |
| Requisitos | 5.441 |
| Ámbitos / subámbitos | 22 / 116 |
| Motor | probado con 1.000.000 de elementos sintéticos (`?stress=1000000`) |

El objetivo es crecer por fases hasta decenas de miles de avances; ver [tareas.md](tareas.md).

## Estructura

```
tecnologias/*.tt         TODAS las tecnologías: fuente canónica (estructura + texto en español), una por línea
i18n/<idioma>/           todo lo traducible, por idioma
  interfaz.json            textos de la aplicación (ya en es, ca, en, fr, de, pt, it)
  periodos.json            edades y periodos de la regla
  ambitos.json             nombres de ámbitos y subámbitos
  tecnologias/*.json       nombre y resumen de cada tecnología, un archivo por cada .tt
tools/build_data.py      valida y compila
public/data/ (generado)  indice.json · textos/<idioma>/… · techtree.json · techtree.db (SQLite)
src/                     aplicación TypeScript + WebGL2 (Vite)
tests/test_data.py       garantías de la base de datos
```

### Cómo traducir

`i18n/es/` lo genera el compilador a partir de `tecnologias/` (no se edita a mano, salvo `interfaz.json` y `periodos.json`). Para añadir un idioma:

1. Copiar `i18n/es/` a `i18n/<código>/` (por ejemplo `i18n/it/`).
2. Traducir los valores de los JSON; las claves no se tocan. Se puede hacer archivo a archivo: lo que falte se muestra en español.
3. `npm run data` (o `npm run dev`). La aplicación elige el idioma del sistema si existe su carpeta.

### Carga progresiva

La web descarga primero `indice.json` (estructura sin textos), luego los nombres del idioma y, solo al abrir una ficha, los resúmenes de su ámbito. Se puede desactivar en «Capas» para descargarlo todo al inicio.

**Por qué así.** El valor que se reutiliza entre proyectos son los *datos*: por eso la fuente es texto plano y se compila con Python a **SQLite**, que Unity, Godot, C#, Python o Java leen sin servidor. El dibujo usa WebGL2 instanciado, que es lo que permite mover millones de elementos.

### Formato de datos (`tecnologias/*.tt`)

```
@ id-ambito | Nombre del ámbito | #color
@@ id-subambito | Nombre del subámbito
id | año | tipo | Nombre | requisitos,inmediatos | Resumen | Personas
```

- **año**: entero, negativo = a. C., o fecha `AAAA-MM` / `AAAA-MM-DD`; prefijo `~` = fecha aproximada.
- Un ámbito o subámbito puede continuar en otro archivo repitiendo su cabecera `@` / `@@`.
- **tipo**: `D` descubrimiento · `I` invento · `T` técnica/proceso · `M` material · `H` herramienta · `C` concepto/teoría · `S` sistema/infraestructura · `X` vía muerta, superada o pseudociencia.
- **requisitos**: solo los inmediatos. La bombilla requiere la bomba de Sprengel, no el fuego.

El compilador rechaza ids duplicados, requisitos inexistentes, requisitos posteriores al avance y ciclos.

### Esquema SQLite

`domain(id,name,color,position)` · `subdomain(id,domain_id,name,position)` · `technology(id,name,year,date,approximate,kind,domain_id,subdomain_id,summary,people)` · `requirement(technology_id,requires_id)`

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

- El contenido (nombres y resúmenes) está solo en español, preparado para traducir en `i18n/`; la interfaz, en siete idiomas.
- Las fichas aún no llevan imagen ni referencias bibliográficas por avance.
- La periodización de la regla es la convencional de Próximo Oriente y Europa; las edades de los metales no fueron simultáneas en el mundo.
- La enciclopedia es una primera versión: una página breve por avance.
- Unos 730 resúmenes son todavía demasiado breves (menos de 24 caracteres).
