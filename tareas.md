# Tareas de Techtree

Pizarra de trabajo. Las fases terminadas se eliminan de aquí y quedan en [CHANGELOG.md](CHANGELOG.md).

## Fases pendientes

- **F1 · Densificación del corpus (repetible por ámbito).** Subir cada ámbito a miles de avances con cadenas completas paso a paso. Orden propuesto: metalurgia y electricidad (cadena cobre → hilo → bombilla con todos sus pasos intermedios: tostación, mata, ánodos, hileras, recocidos, aislantes) · materiales (cadena completa del lápiz: madera, sierras, colas, lacas, virola) · química industrial · medicina · informática · transporte · resto.
- **F2 · Fichas completas.** Imagen por avance (Wikimedia Commons, con licencia y autor), referencias por avance, rango de incertidumbre de las fechas, lugar, e invenciones independientes en varias regiones (hoy cada avance tiene una sola fecha).
- **F3 · Enciclopedia.** Artículos largos por avance, con diagramas interactivos y animaciones; páginas de ámbito, de periodo y de persona; lectura en voz alta ya disponible.
- **F4 · Escala.** Datos en teselas por tiempo y ámbito con carga progresiva, índice de búsqueda precompilado y disposición calculada en la compilación. Importación asistida desde Wikidata, marcada como «sin revisar» hasta su verificación.
- **F5 · Idiomas del contenido.** Nombres y resúmenes en catalán, inglés, francés, alemán, portugués e italiano; después chino, japonés, hindi, ruso y árabe.
- **F6 · Enlace con Historicmap.** Botón en cada proyecto que abre el otro en la misma fecha (`#y=`), y regla temporal compartida.
- **F7 · Base para el videojuego.** Ampliar el esquema SQLite con eras jugables, costes, efectos y agrupación de avances en «tecnologías» investigables.

## Comprobaciones pendientes

- Medir fotogramas por segundo en una GPU real con `?stress=1000000` (en el entorno de desarrollo solo había WebGL por software).
- Revisar en móvil el gesto de pellizco y la ficha flotante.
- Revisión de fechas del corpus contra fuentes, ámbito por ámbito (F2).
