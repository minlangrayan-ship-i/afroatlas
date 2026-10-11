// Commande unique : npm run render:all
// 1. extrait chiffres, exemples et cartes des données du site ;
// 2. resserre les pauses de la voix off puis l'aligne sur son texte
//    (sous-titres mot par mot + .srt FR/EN) ;
// 3. règle la musique 13,5 dB sous la voix ;
// 4. rend les trois vidéos (H.264 + AAC, 30 i/s) puis normalise le son à -14 LUFS ;
// 5. rend la miniature YouTube et les couvertures 9:16.
// Options : --only=youtube,tiktok  --compte=@moncompte  --adresse=afroatlas.org  --brut
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFile, mkdir, rm, existsSync } from 'node:fs';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const copier = promisify(copyFile);
const dossier = path.dirname(fileURLToPath(import.meta.url));
const video = path.resolve(dossier, '..');
const racine = path.resolve(video, '..');
const voix = path.join(racine, 'voiceover');
const sortie = path.join(racine, 'out');
const publication = path.join(racine, 'publish');
const option = (nom, defaut) =>
  process.argv.find((a) => a.startsWith(`--${nom}=`))?.split('=').slice(1).join('=') ?? defaut;

const tous = ['youtube', 'tiktok', 'reels'];
const choisis = option('only', tous.join(',')).split(',');
const noms = {
  youtube: 'afroathlas_youtube_16x9.mp4',
  tiktok: 'afroathlas_tiktok_9x16.mp4',
  reels: 'afroathlas_reels_9x16.mp4',
};
const adresse = option('adresse', 'minlangrayan-ship-i.github.io/afroatlas');
const compte = option('compte', '');
// Chromium « headless shell » local s'il existe (environnement sans téléchargement), sinon Remotion télécharge le sien.
const SHELL_LOCAL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const navigateur = process.env.REMOTION_CHROME || (existsSync(SHELL_LOCAL) ? SHELL_LOCAL : null);

const lancer = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });

/** Sonie intégrée (LUFS) d'un fichier, mesurée par ffmpeg (EBU R128, écrite sur stderr). */
function mesurerSonie(fichier) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', fichier, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...r.stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)];
  return Number(m[m.length - 1][1]);
}

await promisify(mkdir)(sortie, { recursive: true });
await promisify(mkdir)(publication, { recursive: true });

console.log('\n▶ Données du site');
lancer('node', [path.join(dossier, 'extract-data.mjs')]);

console.log('\n▶ Resserrement des pauses et alignement des voix off');
// --brut : garder la voix telle quelle (par exemple votre propre enregistrement déjà monté).
const brutVoix = process.argv.includes('--brut');
for (const f of tous) {
  const monte = path.join(voix, `${f}.monte.mp3`);
  if (brutVoix) await copier(path.join(voix, `${f}.mp3`), monte);
  // Seules les pauses de plus de 0,7 s sont raccourcies : la voix garde son rythme posé.
  else lancer('python3', [path.join(dossier, 'resserrer.py'), path.join(voix, `${f}.mp3`), monte, '0.7']);
  lancer('python3', [
    path.join(dossier, 'align.py'),
    monte,
    path.join(voix, `${f}.fr.txt`),
    path.join(voix, `${f}.en.txt`),
    path.join(voix, f),
  ]);
  await copier(path.join(voix, `${f}.words.json`), path.join(video, 'src/generated', `${f}.words.json`));
  await copier(monte, path.join(video, 'public/voiceover', `${f}.mp3`));
}

console.log('\n▶ Bundle Remotion');
const servi = await bundle({ entryPoint: path.join(video, 'src/index.ts') });
const musique = mesurerSonie(path.join(video, 'public/audio/music.mp3'));

for (const f of choisis) {
  const voixLufs = mesurerSonie(path.join(voix, `${f}.monte.mp3`));
  // Musique 13,5 dB sous la voix (cible 12 à 15 dB).
  const musiqueDb = Math.round((voixLufs - 13.5 - musique) * 10) / 10;
  const props = { format: f, musiqueDb, adresse, compte };
  console.log(`\n▶ Rendu ${f} (voix ${voixLufs} LUFS, musique ${musique} LUFS → gain ${musiqueDb} dB)`);
  const composition = await selectComposition({ serveUrl: servi, id: f, inputProps: props, browserExecutable: navigateur });
  const brut = path.join(sortie, `.${f}-brut.mp4`);
  await renderMedia({
    composition,
    serveUrl: servi,
    codec: 'h264',
    audioCodec: 'aac',
    crf: 18,
    pixelFormat: 'yuv420p',
    outputLocation: brut,
    inputProps: props,
    browserExecutable: navigateur,
    concurrency: Math.min(os.cpus().length, Number(process.env.CONCURRENCE || os.cpus().length)),
    onProgress: ({ progress }) => process.stdout.write(`\r  ${Math.round(progress * 100)} %`),
  });
  // Normalisation en deux passes à -14 LUFS (pic vrai -1,5 dBTP), vidéo copiée sans perte.
  const mesure = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', brut, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const j = JSON.parse(mesure.slice(mesure.lastIndexOf('{'), mesure.lastIndexOf('}') + 1));
  const filtre = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const final = path.join(sortie, noms[f]);
  lancer('ffmpeg', ['-v', 'error', '-y', '-i', brut, '-c:v', 'copy', '-af', filtre, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final]);
  await promisify(rm)(brut);
  for (const langue of ['fr', 'en'])
    await copier(path.join(voix, `${f}.${langue}.srt`), path.join(sortie, noms[f].replace('.mp4', `.${langue}.srt`)));
  console.log(`\n  ✓ ${final}`);
}

console.log('\n▶ Miniature et couvertures');
for (const [id, fichier] of [
  ['miniature-youtube', 'miniature_youtube_1280x720.png'],
  ['couverture-tiktok', 'couverture_tiktok_1080x1920.png'],
  ['couverture-reels', 'couverture_reels_1080x1920.png'],
]) {
  const composition = await selectComposition({ serveUrl: servi, id, browserExecutable: navigateur });
  await renderStill({ composition, serveUrl: servi, output: path.join(publication, fichier), browserExecutable: navigateur });
  console.log(`  ✓ publish/${fichier}`);
}
console.log('\nTerminé.');
