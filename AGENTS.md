# Entrada para agentes y colaboradores

Leer [README.md](README.md) (arquitectura y formato de datos) y [tareas.md](tareas.md) (fases pendientes) antes de trabajar.

- Los datos viven en `tecnologias/*.tt`; nunca editar `public/data/` ni `i18n/es/ambitos.json` e `i18n/es/tecnologias/` (se generan).
- Todo texto visible va en `i18n/`; nada de cadenas sueltas en el código.
- Los requisitos de un avance son solo los **inmediatos**. Toda fecha dudosa lleva `~`.
- Antes de entregar: `npm test` y `npm run build`.
- Al cerrar una fase: quitarla de `tareas.md`, anotarla en `CHANGELOG.md`, subir la versión en `package.json` y en el historial de `src/i18n.ts` / `src/about.ts`.
- La estética sigue la de Historicmap: menú único arriba a la derecha (el último botón es «Acerca de»), pantalla limpia, regla temporal abajo, sin cajetines ni líneas divisorias superfluas.
- `favicon.svg` debe permanecer en la raíz (lo lee el portfolio).
