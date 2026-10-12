# Pack vidéo AfroAtlas

Trois vidéos rendues par code avec Remotion (React/TypeScript) et ffmpeg, à partir des données réelles du site.

| Fichier (dans `out/`) | Format | Durée |
|---|---|---|
| `afroathlas_youtube_16x9.mp4` | 1920 × 1080, 30 i/s | ≈ 62 s |
| `afroathlas_tiktok_9x16.mp4` | 1080 × 1920, 30 i/s | ≈ 21 s |
| `afroathlas_reels_9x16.mp4` | 1080 × 1920, 30 i/s | ≈ 31 s |

Chaque vidéo est accompagnée de sous-titres `.fr.srt` et `.en.srt`. Miniature, couvertures et textes de publication sont dans `publish/`.

## Commandes

```sh
cd video
npm ci
npm run render:all                         # tout : données, alignement, rendu, -14 LUFS, visuels
npm run render:all -- --only=tiktok        # un seul format
npm run render:all -- --compte=@afroatlas  # afficher le nom de compte dans l'appel à l'action
npm run render:all -- --adresse=afroatlas.org
npm run studio                             # prévisualiser et ajuster dans le navigateur
node scripts/preview.mjs reels 2,10,20     # images de contrôle à des instants donnés
```

Prérequis : Node.js 22, Python 3, ffmpeg. Remotion télécharge son navigateur au premier rendu (ou définir `REMOTION_CHROME`).

## Remplacer la voix off par la vôtre

1. Enregistrer exactement les textes de `voiceover/<format>.fr.txt`, en MP3, sous `voiceover/<format>.mp3` (`youtube`, `tiktok`, `reels`).
2. Lancer `npm run render:all`. Les pauses de plus de 0,7 s sont raccourcies (option `--brut` pour garder la prise telle quelle), puis le texte est réaligné sur votre voix (`scripts/align.py`). Montage, sous-titres mot par mot et `.srt` se recalent automatiquement.

L'alignement est local (pauses de la voix et syllabes du texte), sans modèle à télécharger. Avec Whisper installé, on peut l'affiner : l'entrée et la sortie (`*.words.json`) restent les mêmes.

## Organisation

- `scripts/extract-data.mjs` : chiffres, noms par pays, sources et cartes lus dans `src/data/published/` du site.
- `src/Video.tsx` : montage des trois formats ; chaque plan démarre sur un mot réel de la voix.
- `src/scenes/` : scènes (trajet, afroshop, deux noms, recherche, fiche, source, carte vendeur, Afrique, chiffres, appel à l'action).
- `src/formats.ts` : tailles et zones sûres (9:16 : ≥ 250 px du haut, ≥ 400 px du bas, ≥ 120 px des bords).
- `public/` : voix montées, musique, effets sonores synthétisés (`scripts/make-sfx.sh`), photos du catalogue, police Inter (OFL).

## Droits

- **Photos** : Wikimedia Commons, auteur et licence affichés à l'écran.
- **Cartes** : Natural Earth (domaine public) et geoBoundaries (CC BY 3.0).
- **Voix off et musique** : générées avec vidIQ (voix « Brian », musique originale).
- **Effets sonores** : synthétisés par ffmpeg.
- Aucun logo ni visuel de tiers.
