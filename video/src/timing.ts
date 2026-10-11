// Calage sur la voix off : chaque plan démarre sur un mot réel de la piste alignée
// (voiceover/*.words.json, produit par scripts/align.py). Remplacer la voix puis relancer
// `npm run render:all` recale automatiquement tout le montage.
import youtube from './generated/youtube.words.json';
import tiktok from './generated/tiktok.words.json';
import reels from './generated/reels.words.json';
import { FPS, type NomFormat } from './formats';

export type Mot = { mot: string; ligne: number; debut: number; fin: number };
export type Piste = { duree: number; mots: Mot[] };

const pistes: Record<NomFormat, Piste> = { youtube, tiktok, reels } as Record<NomFormat, Piste>;
export const piste = (format: NomFormat) => pistes[format];

/** Image (frame) où commence le n-ième mot d'une ligne du script. */
export function repere(format: NomFormat, ligne: number, motDansLigne = 0) {
  const mots = pistes[format].mots.filter((m) => m.ligne === ligne);
  const mot = mots[Math.min(motDansLigne, mots.length - 1)];
  return Math.round((mot ? mot.debut : 0) * FPS);
}

/** Image où commence le premier mot contenant `texte` à partir d'une ligne donnée. */
export function repereMot(format: NomFormat, texte: string, depuisLigne = 0) {
  const cible = texte.toLowerCase();
  const mot = pistes[format].mots.find(
    (m) => m.ligne >= depuisLigne && m.mot.toLowerCase().replace(/[^\p{L}\p{N}' -]/gu, '').includes(cible),
  );
  return Math.round((mot ? mot.debut : 0) * FPS);
}

/** Image où commence le mot exact `texte` (ponctuation ignorée) dans une ligne donnée. */
export function repereExact(format: NomFormat, texte: string, ligne: number, occurrence = 0) {
  const propre = (m: string) => m.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, '');
  const trouves = pistes[format].mots.filter((m) => m.ligne === ligne && propre(m.mot) === propre(texte));
  const mot = trouves[occurrence];
  if (!mot) throw new Error(`Mot « ${texte} » introuvable ligne ${ligne} (${format}) : vérifier le script.`);
  return Math.round(mot.debut * FPS);
}

/** Durée totale de la vidéo : voix + une tenue finale pour l'appel à l'action. */
export const dureeTotale = (format: NomFormat) =>
  Math.round((pistes[format].duree + (format === 'youtube' ? 2.2 : 1.6)) * FPS);
