import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';

/** favicon.svg vive en la raíz (lo lee el portfolio); se copia tal cual a la compilación. */
function rootFavicon(): Plugin {
  return { name: 'techtree-root-favicon', generateBundle() { this.emitFile({ type: 'asset', fileName: 'favicon.svg', source: readFileSync('favicon.svg') }); } };
}
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
export default defineConfig({ base: './', plugins: [rootFavicon()], define: { __VERSION__: JSON.stringify(version) }, build: { target: 'es2022' } });
