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
  SceneAfrique, SceneAppel, SceneChiffres, SceneFiche, SceneLogo, SceneRecherche, SceneSansSource,
  SceneSource, SceneVendeur,
} from './scenes/scenes';
import { SceneAfroshop, SceneDeuxNoms, SceneTrajet } from './scenes/histoire';

export type VideoProps = {
  format: NomFormat;
  /** Gain de la musique en dB, calculé au rendu pour rester 12 à 15 dB sous la voix. */
  musiqueDb: number;
  adresse: string;
  /** Nom de compte (@…) affiché dans l'appel à l'action ; vide = masqué. */
  compte: string;
};

// Produits de l'histoire et leurs noms par pays (données du site, vérifiées à l'extraction).
const njansang = data.histoire.njansang;
const soumbala = data.histoire.soumbala;
const nomPays = (produit: typeof njansang, iso: string, nom: string) => {
  const n = produit.parPays.find((x) => x.iso === iso && x.nom.toLowerCase() === nom.toLowerCase());
  if (!n) throw new Error(`${nom} (${iso}) absent des données`);
  return n;
};
const affiche = (produit: typeof njansang) => ({ titre: produit.titre, scientifique: produit.scientifique, photo: produit.photo });

type Plan = { de: number; contenu: (rel: (f: number) => number) => React.ReactNode; son?: 'whoosh' | 'impact' };
type Effet = { a: number; son: 'tick' | 'whoosh' | 'impact' };

/** Construit la liste des plans et des effets sonores d'un format. */
function montage(f: NomFormat): { plans: Plan[]; effets: Effet[]; masques: [number, number][] } {
  const F = formats[f];
  const L = (ligne: number, mot = 0) => repere(f, ligne, mot);
  const M = (mot: string, ligne: number, n = 0) => repereExact(f, mot, ligne, n);
  const effets: Effet[] = [];
  const ticks = (...a: number[]) => a.forEach((x) => effets.push({ a: x, son: 'tick' }));
  const impacts = (...a: number[]) => a.forEach((x) => effets.push({ a: x, son: 'impact' }));
  const cm = nomPays(njansang, 'CMR', 'njangsang');
  const ci = nomPays(njansang, 'CIV', 'akpi');
  const ml = nomPays(soumbala, 'MLI', 'soumbala');
  const sn = nomPays(soumbala, 'SEN', 'nététou');
  const vendeurIvoirien = njansang.parPays.filter((n) => n.iso === 'CIV').map((n) => ({ nom: n.nom, detail: n.pays }));
  const vendeurSenegalais = soumbala.parPays.filter((n) => n.iso === 'SEN').map((n) => ({ nom: n.nom, detail: n.pays }));

  if (f === 'youtube') {
    const puces = [
      { ...cm, a: M('autres', 6) },
      { ...ci, a: M('pays', 6) },
      { ...nomPays(njansang, 'CIV', 'Kôlou'), a: M('pays', 6, 1) },
      { ...nomPays(njansang, 'CMR', 'ndjanssang'), a: M('langue', 6) },
    ];
    const exemples = data.ailleurs.map((e) => ({ ...e, a: M(e.nom, 9) }));
    const compteurs = [M('quatre-vingt-quinze', 10), M('mille', 10), M('cent', 10), M('treize', 10)];
    ticks(M('akpi', 3), ...puces.map((p) => p.a), ...exemples.map((e) => e.a), ...compteurs);
    impacts(L(4), L(5), L(11));
    return {
      masques: [],
      effets,
      plans: [
        { de: 0, contenu: (r) => <SceneTrajet format={F} depart="Douala" arrivee="Paris" aArrivee={r(M("aujourd'hui", 0))} /> },
        { de: L(1), son: 'whoosh', contenu: (r) => <SceneAfroshop format={F} photo={njansang.photo} demande={`Je cherche du ${cm.nom}.`} reponse={{ texte: 'Connais pas…', a: r(L(2)) }} etiquette={{ texte: ci.nom, a: r(M('pourtant', 2)) }} /> },
        { de: L(3), son: 'whoosh', contenu: (r) => <SceneDeuxNoms format={F} photo={njansang.photo} gauche={cm} droite={{ ...ci, a: r(M('akpi', 3)) }} final={{ texte: 'MÊME PRODUIT. DEUX NOMS.', a: r(L(4)) }} /> },
        { de: M('et', 4), son: 'whoosh', contenu: (r) => <SceneSansSource format={F} titre={r(M('lien', 4))} titreTexte="AUCUNE LISTE FIABLE ?" /> },
        { de: L(5), contenu: () => <SceneLogo format={F} promesse={8} /> },
        { de: L(6), son: 'whoosh', contenu: () => <SceneRecherche format={F} requete={cm.nom} resultat={njansang.titre} scientifique={njansang.scientifique ?? ''} /> },
        { de: M('et', 6), son: 'whoosh', contenu: (r) => <SceneFiche format={F} produit={affiche(njansang)} noms={puces.map((p) => ({ nom: p.nom, langue: p.pays, a: r(p.a) }))} badge={r(M('langue', 6, 1))} /> },
        { de: L(7), son: 'whoosh', contenu: (r) => <SceneSource format={F} source={ci.source} detail={{ libelle: 'Nom et pays', valeur: `${ci.nom} · ${ci.pays}` }} slogan={r(M('rien', 7))} /> },
        { de: L(8), son: 'whoosh', contenu: () => <SceneVendeur format={F} produit={affiche(njansang)} destination={ci.pays} noms={vendeurIvoirien} titre="Le nom qu’il connaît." /> },
        { de: L(9), son: 'whoosh', contenu: (r) => <SceneAfrique format={F} exemples={exemples.map((e) => ({ ...e, a: r(e.a) }))} compteur={100000} /> },
        {
          de: L(10),
          son: 'whoosh',
          contenu: (r) => (
            <SceneChiffres
              format={F}
              reperes={compteurs.map(r)}
              valeurs={[
                { valeur: data.chiffres.fiches, libelle: 'fiches' },
                { valeur: data.chiffres.appellations, libelle: 'appellations' },
                { valeur: data.chiffres.sources, libelle: 'sources' },
                { valeur: data.chiffres.pays, libelle: 'pays' },
              ]}
            />
          ),
        },
        { de: L(11), contenu: () => null },
      ],
    };
  }

  if (f === 'tiktok') {
    ticks(M('akpi', 2));
    impacts(L(3), L(4), L(6));
    return {
      masques: [],
      effets,
      plans: [
        // Hook immédiat : l'afroshop et la demande dès la première image.
        { de: 0, contenu: (r) => <SceneAfroshop format={F} photo={njansang.photo} demande={`Je cherche du ${cm.nom}.`} reponse={{ texte: 'Connais pas.', a: r(L(1)) }} etiquette={{ texte: ci.nom, a: r(L(2)) }} /> },
        { de: M('ça', 2), son: 'whoosh', contenu: (r) => <SceneDeuxNoms format={F} photo={njansang.photo} gauche={cm} droite={{ ...ci, a: r(M('akpi', 2)) }} final={{ texte: 'MÊME PRODUIT. AUTRE NOM.', a: r(L(3)) }} /> },
        { de: L(4), contenu: (r) => <SceneLogo format={F} promesse={6} appui={r(M('sources', 4))} /> },
        { de: L(5), son: 'whoosh', contenu: () => <SceneVendeur format={F} produit={affiche(njansang)} destination={ci.pays} noms={vendeurIvoirien} /> },
        { de: L(6), contenu: () => null },
      ],
    };
  }

  // Reels : version plus esthétique, construite sur soumbala / nététou.
  const puces = soumbala.parPays.map((n, i) => ({ nom: n.nom, langue: n.pays, a: M("d'un", 4) + 4 + i * 6 }));
  ticks(M('nététou', 0), ...puces.map((p) => p.a));
  impacts(M('un', 0), L(4), L(7));
  return {
    masques: [],
    effets,
    plans: [
      { de: 0, contenu: (r) => <SceneDeuxNoms format={F} photo={soumbala.photo} gauche={ml} droite={{ ...sn, a: r(M('nététou', 0)) }} final={{ texte: 'UN CONDIMENT. DEUX PAYS.', a: r(M('un', 0)) }} /> },
      { de: L(1), son: 'whoosh', contenu: (r) => <SceneTrajet format={F} depart="Bamako" arrivee="Bruxelles" aArrivee={r(M('tu', 1, 1))} /> },
      { de: L(2), son: 'whoosh', contenu: (r) => <SceneAfroshop format={F} photo={soumbala.photo} demande={`Je cherche du ${ml.nom}.`} reponse={{ texte: `Du ${sn.nom} ?`, a: r(M('pour', 3)) }} etiquette={{ texte: sn.nom, a: r(M('nététou', 3)) }} /> },
      { de: L(4), contenu: () => <SceneLogo format={F} promesse={6} /> },
      { de: M("d'un", 4), son: 'whoosh', contenu: (r) => <SceneFiche format={F} produit={affiche(soumbala)} noms={puces.map((p) => ({ ...p, a: r(p.a) }))} badge={r(M('sources', 4))} /> },
      { de: L(5), son: 'whoosh', contenu: () => <SceneVendeur format={F} produit={affiche(soumbala)} destination={sn.pays} noms={vendeurSenegalais} /> },
      { de: L(6), son: 'whoosh', contenu: () => <SceneAfrique format={F} /> },
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
