// Contrôle rapide : rend des images fixes à des instants donnés (sans calculer la vidéo).
// Usage : node scripts/preview.mjs youtube 2,10,30 [dossier]
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
const [format, secondes, dossier = 'out/apercu'] = process.argv.slice(2);
// Chromium « headless shell » local s'il existe (environnement sans téléchargement), sinon Remotion télécharge le sien.
const SHELL_LOCAL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const navigateur = process.env.REMOTION_CHROME || (existsSync(SHELL_LOCAL) ? SHELL_LOCAL : null);
mkdirSync(dossier, { recursive: true });
const servi = await bundle({ entryPoint: path.resolve('src/index.ts') });
const props = { format, musiqueDb: -20, adresse: 'minlangrayan-ship-i.github.io/afroatlas', compte: '' };
const composition = await selectComposition({ serveUrl: servi, id: format, inputProps: props, browserExecutable: navigateur });
for (const s of secondes.split(',').map(Number)) {
  const sortie = path.join(dossier, `${format}-${String(s).padStart(5, '0')}.png`);
  await renderStill({ composition, serveUrl: servi, frame: Math.round(s * 30), output: sortie, inputProps: props, browserExecutable: navigateur });
  console.log(sortie);
}
