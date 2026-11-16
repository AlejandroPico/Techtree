# Tareas de Techtree

Pizarra de trabajo. Las fases terminadas se eliminan de aquí y quedan en [CHANGELOG.md](CHANGELOG.md).

## Fases pendientes

Objetivo declarado por el propietario: entre 80 y 200 veces el tamaño de la 0.1.0 (70.000–180.000 avances). Estado: 4.745 (×5,3). Ritmo realista de redacción revisada: 1.500–2.500 avances por sesión de trabajo.

- **F1 · Densificación del corpus (repetible por ámbito).** Subir cada ámbito a miles de avances con cadenas completas paso a paso. Orden propuesto: metalurgia y electricidad (cadena cobre → hilo → bombilla con todos sus pasos intermedios: tostación, mata, ánodos, hileras, recocidos, aislantes) · materiales (cadena completa del lápiz: madera, sierras, colas, lacas, virola) · química industrial · medicina · informática · transporte · resto.
- **F1a · Integrar lo importado de Blue Marble Crisis.** (1) Fusionar duplicados con el árbol propio (fusil de cerrojo, submarino nuclear, radar…). (2) Sustituir el resumen genérico por uno real y contrastar fechas. (3) Extender cada familia hacia atrás, milenio a milenio (doctrinas, guerra naval, industria, economía, política, medicina desde la Antigüedad). (4) Revisar `game/data/units/unit_tree.json` del juego: tipos de buque, carro y avión que deben figurar como avances.
- **F1b · Capa importada de Wikidata (opcional, pendiente de decisión).** Sondeo del 15-11-2026: 3.097 elementos con descubridor/inventor y fecha (sin cuerpos celestes), 8.079 exoplanetas fechados y unos 38.000 objetos de la clase «herramienta» con fecha de creación. Entrarían sin requisitos y marcados «sin revisar».
- **F2 · Fichas completas.** Imagen por avance (Wikimedia Commons, con licencia y autor), referencias por avance, rango de incertidumbre de las fechas, lugar, e invenciones independientes en varias regiones (hoy cada avance tiene una sola fecha).
- **F3 · Enciclopedia.** Artículos largos por avance, con diagramas interactivos y animaciones; páginas de ámbito, de periodo y de persona; lectura en voz alta ya disponible.
- **F4 · Escala (segunda parte).** Hecha la carga progresiva de textos. Falta: Datos en teselas por tiempo y ámbito con carga progresiva, índice de búsqueda precompilado y disposición calculada en la compilación. Importación asistida desde Wikidata, marcada como «sin revisar» hasta su verificación.
- **F5 · Idiomas del contenido.** Estructura `i18n/` lista; falta traducir. Nombres y resúmenes en catalán, inglés, francés, alemán, portugués e italiano; después chino, japonés, hindi, ruso y árabe.
- **F6 · Enlace con Historicmap.** Botón en cada proyecto que abre el otro en la misma fecha (`#y=`), y regla temporal compartida.
- **F7 · Base para el videojuego.** Ampliar el esquema SQLite con eras jugables, costes, efectos y agrupación de avances en «tecnologías» investigables.

## Comprobaciones pendientes

- Ampliar los resúmenes demasiado breves (unos 730 de menos de 24 caracteres).

- Medir fotogramas por segundo en una GPU real con `?stress=1000000` (en el entorno de desarrollo solo había WebGL por software).
- Revisar en móvil el gesto de pellizco y la ficha flotante.
- Revisión de fechas del corpus contra fuentes, ámbito por ámbito (F2).
