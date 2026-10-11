// Montage des trois formats. Chaque plan démarre sur un mot réel de la voix off :
// changer la voix (ou le texte) puis relancer `npm run render:all` recale tout.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';
import data from './generated/data.json';
import { formats, FPS, type NomFormat } from './formats';
import { styleDesPolices } from './theme';
import { piste, repere, repereExact, dureeTotale } from './timing';
import { SousTitres } from './components/SousTitres';
import {
  SceneAfrique, SceneAppel, SceneCarte, SceneChiffres, SceneFiche, SceneLangues, SceneLogo,
  SceneMarche, SceneRafale, SceneRecherche, SceneSansSource, SceneSource, SceneVendeur, safou,
} from './scenes/scenes';

export type VideoProps = {
  format: NomFormat;
  /** Gain de la musique en dB, calculé au rendu pour rester 12 à 15 dB sous la voix. */
  musiqueDb: number;
  adresse: string;
  /** Nom de compte (@…) affiché dans l'appel à l'action ; vide = masqué. */
  compte: string;
};

const demo = data.demo.njangsang;
const nomEn = (produit: typeof demo, langue: string) =>
  produit.noms.find((n) => n.langues.includes(langue))?.nom ?? '';
const detail = (produit: typeof demo, nom: string) =>
  produit.noms.find((n) => n.nom === nom)?.langues.join(' · ') ?? '';

type Plan = { de: number; contenu: (rel: (f: number) => number) => React.ReactNode; son?: 'whoosh' | 'impact' };
type Effet = { a: number; son: 'tick' | 'whoosh' | 'impact' };

/** Construit la liste des plans et des effets sonores d'un format. */
function montage(f: NomFormat): { plans: Plan[]; effets: Effet[]; masques: [number, number][] } {
  const F = formats[f];
  const L = (ligne: number, mot = 0) => repere(f, ligne, mot);
  const M = (mot: string, ligne: number, n = 0) => repereExact(f, mot, ligne, n);
  const effets: Effet[] = [];
  const ticks = (...a: number[]) => a.forEach((x) => effets.push({ a: x, son: 'tick' }));

  if (f === 'youtube') {
    const noms = ['njangsang', 'essang', 'essessang', 'isangé'].map((nom, i) => ({ texte: nom, detail: detail(demo, nom), a: L(0, i) }));
    const langues = ['bassa', 'boulou', 'ewondo', 'bakossi'].map((l) => ({
      langue: l, nom: nomEn(demo, l[0].toUpperCase() + l.slice(1)), a: M(l, 1),
    }));
    const puces = ['bassa', 'douala', 'ewondo', 'fang', 'bakwéri'].map((l) => {
      const langue = l === 'bakwéri' ? 'Bakwéri' : l[0].toUpperCase() + l.slice(1);
      return { nom: nomEn(demo, langue), langue, a: M(l, 5) };
    });
    const etApres = M('et', 5);
    ticks(...noms.map((n) => n.a), ...langues.map((l) => l.a), ...puces.map((p) => p.a), ...data.ailleurs.map((e) => M(e.nom, 10)));
    effets.push({ a: L(0, 4), son: 'impact' }, { a: L(4), son: 'impact' }, { a: L(11), son: 'impact' });
    return {
      masques: [[0, L(1) / FPS]],
      effets,
      plans: [
        { de: 0, contenu: (r) => <SceneRafale format={F} noms={noms.map((n) => ({ ...n, a: r(n.a) }))} final={{ texte: 'QUATRE NOMS. UN SEUL PRODUIT.', a: r(L(0, 4)) }} photo={demo.photo} /> },
        { de: L(1), son: 'whoosh', contenu: (r) => <SceneLangues format={F} titre={{ texte: 'Un seul arbre. Plusieurs noms.', a: 2 }} langues={langues.map((l) => ({ ...l, a: r(l.a) }))} /> },
        { de: L(2), son: 'whoosh', contenu: (r) => <SceneMarche format={F} chute={r(M('on', 2))} /> },
        { de: L(3), son: 'whoosh', contenu: (r) => <SceneSansSource format={F} titre={r(M('sans', 3))} /> },
        { de: L(4), contenu: (r) => <SceneLogo format={F} promesse={8} appui={r(M('sources', 4))} /> },
        { de: L(5), son: 'whoosh', contenu: () => <SceneRecherche format={F} requete="essang" resultat={demo.titre} scientifique={demo.scientifique} /> },
        { de: etApres, son: 'whoosh', contenu: (r) => <SceneFiche format={F} produit={demo} noms={puces.map((p) => ({ ...p, a: r(p.a) }))} /> },
        { de: L(6), son: 'whoosh', contenu: (r) => <SceneSource format={F} produit={demo} slogan={r(M('rien', 6))} /> },
        { de: L(7), son: 'whoosh', contenu: () => <SceneCarte format={F} /> },
        { de: L(8), son: 'whoosh', contenu: (r) => <SceneChiffres format={F} reperes={[r(M('quatre-vingt-quinze', 8)), r(M('mille', 8)), r(M('cent', 8))]} /> },
        { de: L(9), son: 'whoosh', contenu: () => <SceneVendeur format={F} produit={demo} /> },
        {
          de: L(10),
          son: 'whoosh',
          contenu: (r) => (
            <SceneAfrique
              format={F}
              exemples={data.ailleurs.map((e) => ({ ...e, a: r(M(e.nom, 10)) }))}
              compteur={r(M('treize', 10))}
            />
          ),
        },
        { de: L(11), contenu: () => null },
      ],
    };
  }

  if (f === 'tiktok') {
    // Hook en moins de 2 s : trois noms en rafale, toutes les 0,6 s.
    const noms = ['essang', 'njangsang', 'essessang'].map((nom, i) => ({ texte: `${nom} ?`, detail: detail(demo, nom), a: i * 18 }));
    const puces = ['bassa', 'douala', 'ewondo', 'bakwéri'].map((l) => {
      const langue = l === 'bakwéri' ? 'Bakwéri' : l[0].toUpperCase() + l.slice(1);
      return { nom: nomEn(demo, langue), langue, a: M(l, 3) };
    });
    ticks(...noms.map((n) => n.a), ...puces.map((p) => p.a));
    effets.push({ a: L(2), son: 'impact' }, { a: L(7), son: 'impact' });
    return {
      masques: [],
      effets,
      plans: [
        { de: 0, contenu: (r) => <SceneRafale format={F} noms={noms.map((n) => ({ ...n, a: r(n.a) }))} photo={demo.photo} /> },
        { de: L(1), son: 'whoosh', contenu: () => <SceneLangues format={F} titre={{ texte: 'Même produit. Autre nom.', a: 2 }} langues={[]} /> },
        { de: M('au', 1), son: 'whoosh', contenu: (r) => <SceneMarche format={F} chute={r(M('personne', 1))} /> },
        { de: L(2), contenu: () => <SceneLogo format={F} promesse={6} promesseTexte="Un même produit, plusieurs noms." /> },
        { de: L(3), son: 'whoosh', contenu: () => <SceneRecherche format={F} requete="essang" resultat={demo.titre} scientifique={demo.scientifique} /> },
        { de: M('tu', 3), son: 'whoosh', contenu: (r) => <SceneFiche format={F} produit={demo} noms={puces.map((p) => ({ ...p, a: r(p.a) }))} /> },
        { de: L(4), son: 'whoosh', contenu: () => <SceneSource format={F} produit={demo} slogan={100000} /> },
        { de: L(5), son: 'whoosh', contenu: (r) => <SceneChiffres format={F} reperes={[r(M('mille', 5)), r(M('cent', 5))]} valeurs={[{ valeur: data.chiffres.appellations, libelle: 'noms' }, { valeur: data.chiffres.sources, libelle: 'sources' }]} /> },
        { de: L(6), son: 'whoosh', contenu: () => <SceneAfrique format={F} /> },
        { de: L(7), son: 'whoosh', contenu: () => <SceneAfrique format={F} /> },
      { de: L(8), contenu: () => null },
      ],
    };
  }

  // Reels : plus esthétique, construit sur les noms du safou.
  const noms = ['sao', 'sah', 'assa', 'odou'].map((nom, i) => ({ texte: nom, detail: detail(safou, nom), a: L(0, i) }));
  const langues = ['douala', 'bassa', 'ewondo', 'fang', 'bamoun'].map((l) => ({
    langue: l, nom: nomEn(safou, l[0].toUpperCase() + l.slice(1)), a: M(l, 1),
  }));
  const debutFiche = L(4);
  const puces = safou.noms.slice(0, 5).map((n, i) => ({ nom: n.nom, langue: n.langues.join(' · '), a: debutFiche + 6 + i * 7 }));
  ticks(...noms.map((n) => n.a), ...langues.map((l) => l.a), ...puces.map((p) => p.a));
  effets.push({ a: L(0, 4), son: 'impact' }, { a: L(3), son: 'impact' }, { a: L(8), son: 'impact' });
  return {
    masques: [[0, L(0, 4) / FPS]],
    effets,
    plans: [
      { de: 0, contenu: (r) => <SceneRafale format={F} noms={noms.map((n) => ({ ...n, a: r(n.a) }))} final={{ texte: 'UN SEUL FRUIT : LE SAFOU.', a: r(L(0, 4)) }} photo={safou.photo} photoToujours /> },
      { de: L(1), son: 'whoosh', contenu: (r) => <SceneLangues format={F} titre={{ texte: 'Chaque langue a les siens.', a: 2 }} langues={langues.map((l) => ({ ...l, a: r(l.a) }))} photo={safou.photo} /> },
      { de: L(2), son: 'whoosh', contenu: (r) => <SceneSansSource format={F} titre={r(M('et', 2))} titreTexte="QUI LES A NOTÉS ?" /> },
      { de: L(3), contenu: (r) => <SceneLogo format={F} promesse={8} appui={r(M('sources', 3))} /> },
      { de: debutFiche, son: 'whoosh', contenu: (r) => <SceneFiche format={F} produit={safou} noms={puces.map((p) => ({ ...p, a: r(p.a) }))} badge={r(M("l'ouvrage", 4))} /> },
      { de: L(5), son: 'whoosh', contenu: () => <SceneCarte format={F} /> },
      { de: L(6), son: 'whoosh', contenu: () => <SceneVendeur format={F} produit={safou} /> },
      { de: L(7), contenu: () => null },
    ],
  };
}

export const Video: React.FC<VideoProps> = ({ format, musiqueDb, adresse, compte }) => {
  const { durationInFrames } = useVideoConfig();
  const F = formats[format];
  const { plans, effets, masques } = montage(format);
  const total = dureeTotale(format);
  const gain = Math.pow(10, musiqueDb / 20);
  return (
    <AbsoluteFill style={{ background: '#0B0B0A' }}>
      <style>{styleDesPolices}</style>
      {plans.map((p, i) => {
        const fin = i + 1 < plans.length ? plans[i + 1].de : total;
        const rel = (x: number) => x - p.de;
        const contenu =
          i === plans.length - 1 ? (
            <SceneAppel
              format={F}
              adresse={adresse}
              compte={compte || undefined}
              secondaire={format === 'reels' ? 'Enregistre & partage' : undefined}
            />
          ) : (
            p.contenu(rel)
          );
        return (
          <Sequence key={i} from={p.de} durationInFrames={Math.max(1, fin - p.de)} name={`Plan ${i + 1}`}>
            {contenu}
          </Sequence>
        );
      })}
      <SousTitres mots={piste(format).mots} format={F} masques={masques} />
      {/* Voix off (remplaçable : voiceover/<format>.mp3). */}
      <Audio src={staticFile(`voiceover/${format}.mp3`)} />
      {/* Musique originale générée (vidIQ), fondu d'entrée et de sortie. */}
      <Audio
        src={staticFile('audio/music.mp3')}
        volume={(f) =>
          gain *
          interpolate(f, [0, 12, durationInFrames - 45, durationInFrames], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
        startFrom={format === 'tiktok' ? 20 * FPS : 0}
      />
      {[...plans.filter((p) => p.son && p.de > 0).map((p) => ({ a: p.de, son: p.son! })), ...effets].map((e, i) => (
        <Sequence key={`sfx-${i}`} from={Math.max(0, e.a - (e.son === 'whoosh' ? 6 : 0))} durationInFrames={40}>
          <Audio src={staticFile(`sfx/${e.son}.wav`)} volume={e.son === 'tick' ? 0.5 : e.son === 'whoosh' ? 0.55 : 0.7} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
