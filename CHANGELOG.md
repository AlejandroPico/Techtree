# Historial

## 0.4.0 · 16 de noviembre de 2026

- Importado el árbol tecnológico de Blue Marble Crisis (1900–2026): 966 avances en 16 ámbitos nuevos y 152 subámbitos (uno por familia de desarrollo). Total: 4.745 avances y 7.393 requisitos.
- Ámbitos nuevos: guerra terrestre, naval y aérea, cohetería y espacio, física nuclear, defensa NBQ, electrónica y sensores, informática y guerra digital, industria, economía, sociedad, medicina y sanidad, doctrinas militares, inteligencia, contrainteligencia, política y gobierno.
- Se traen las generaciones de cada línea, las aplicaciones entre familias y las acciones de gobierno; no las 2.480 «mejoras» (seguridad, custodia, rendimiento…) ni los 38 nodos posteriores a 2026.
- `tools/importar_bmc.py` repite la importación cuando cambie el juego.

## 0.3.0 · 16 de noviembre de 2026

- De 2.351 a 3.779 avances y de 3.593 a 5.441 requisitos; 116 subámbitos.
- Densificación: materiales naturales y prehistóricos, carpintería, cales y hormigones, cerámica y vidrio; óptica y acústica; componentes eléctricos y medida; energía nuclear y fusión; semiconductores y chips célebres; metalurgia paso a paso; mecanismos antiguos y medievales; relojería e instrumentos; química de laboratorio, orgánica e industrial; anatomía, diagnóstico, salud pública y especialidades médicas; telecomunicación, radio y televisión; software; transporte terrestre, naval, aéreo y espacial; combustibles, vapor y renovables; alimentación, ganadería, textil y arquitectura.
- La carpeta `data/` pasa a llamarse `tecnologias/`.
- Nueva carpeta `i18n/` con todo lo traducible por idioma: interfaz, periodos, ámbitos y tecnologías (en español; listo para copiar y traducir).
- Carga progresiva (F4, primera parte): índice sin textos, nombres y resúmenes por ámbito bajo demanda; interruptor en «Capas».
- Ficha flotante sin barra de desplazamiento visible y con texto seleccionable.

## 0.2.0 · 15 de noviembre de 2026

- La base de datos pasa de 890 a 2.351 avances y de 1.466 a 3.593 requisitos; de 16 a 22 ámbitos y de 74 a 102 subámbitos.
- Ámbitos nuevos: astronomía y cosmos, biología, ciencias de la Tierra, cartografía y exploración, música y sonido, economía y organización.
- Subámbitos nuevos: elementos químicos (todos los descubiertos desde 1669, con su método), isótopos y radioquímica, procesadores, fabricación de chips, memorias y almacenamiento, gráficos y aceleradores, buses y periféricos, sistemas operativos, lenguajes y algoritmos, videojuegos, arcos y ballestas, armaduras, fortificación, ciencia de materiales, electricidad doméstica y otros.
- Fechas exactas (`AAAA-MM-DD`) y regla temporal estirable hasta meses, semanas y días (rueda sobre la regla o Mayús + rueda).
- El compilador admite que un ámbito continúe en varios archivos.

## 0.1.0 · 15 de noviembre de 2026

- Base de datos inicial: 890 avances, 1.466 requisitos inmediatos, 16 ámbitos y 74 subámbitos, de la talla lítica (3,3 Ma) a 2022. Incluye vías muertas y pseudociencias (flogisto, calórico, éter, humores, rayos N, fusión fría…).
- Compilador Python con validación (ids, requisitos, orden temporal, ciclos) que genera JSON para la web y SQLite para otros proyectos.
- Visor WebGL2: lienzo con zoom y desplazamiento, carriles por ámbito, eje temporal elástico, regla inferior con edades, periodos y revoluciones.
- Ficha flotante de cada avance con requisitos, sucesores y cadena completa de precedentes; resaltado de la genealogía en el árbol.
- Búsqueda, filtros por tipo, capas, pantalla completa, temas mañana/tarde/noche/automático, interfaz en siete idiomas, «Acerca de» e instalación como aplicación.
- Enciclopedia (primera versión) con lectura en voz alta.
- Publicación automática en GitHub Pages.
