// Sous-titres mot par mot (style « Hormozi ») : groupes courts, gros, centrés,
// le mot prononcé passe en or et grossit légèrement.
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { couleurs, polices } from '../theme';
import type { Format } from '../formats';
import type { Mot } from '../timing';

/** Regroupe les mots par 3 au plus, en coupant à la ponctuation. */
function groupes(mots: Mot[]) {
  const sortie: Mot[][] = [];
  let courant: Mot[] = [];
  for (const mot of mots) {
    courant.push(mot);
    const fin = /[.,:;?!…]$/.test(mot.mot);
    if (courant.length >= 3 || fin) {
      sortie.push(courant);
      courant = [];
    }
  }
  if (courant.length) sortie.push(courant);
  return sortie;
}

export const SousTitres: React.FC<{
  mots: Mot[];
  format: Format;
  /** Intervalles (en secondes) où la scène affiche déjà le texte en grand. */
  masques?: [number, number][];
}> = ({ mots, format, masques = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (masques.some(([a, b]) => t >= a && t < b)) return null;
  const blocs = groupes(mots);
  const bloc = blocs.find((g, i) => {
    const suivant = blocs[i + 1];
    // Le groupe reste affiché jusqu'au suivant, sauf pendant une longue pause.
    return t >= g[0].debut && t < Math.min(suivant ? suivant[0].debut : Infinity, g[g.length - 1].fin + 0.5);
  });
  if (!bloc) return null;
  const taille = format.vertical ? 74 : 66;
  const apparition = spring({ frame: frame - Math.round(bloc[0].debut * fps), fps, config: { damping: 16, stiffness: 220 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: format.sur.gauche,
        right: format.sur.droite,
        top: format.sousTitresY - taille,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        // Écart généreux : le contour noir déborde de chaque mot.
        gap: `0 ${taille * 0.42}px`,
        fontFamily: polices.titre,
        fontWeight: 900,
        fontSize: taille,
        lineHeight: 1.15,
        textTransform: 'uppercase',
        transform: `scale(${0.92 + 0.08 * apparition})`,
      }}
    >
      {bloc.map((m, i) => {
        const actif = t >= m.debut && (t < m.fin || i === bloc.length - 1 || t < bloc[i + 1].debut);
        return (
          <span
            key={i}
            style={{
              color: actif ? couleurs.or : couleurs.creme,
              transform: `scale(${actif ? 1.08 : 1})`,
              display: 'inline-block',
              // Contour noir épais pour rester lisible sur n'importe quel plan.
              WebkitTextStroke: `${format.vertical ? 10 : 9}px #000`,
              paintOrder: 'stroke fill',
              textShadow: '0 6px 18px #000000aa',
            }}
          >
            {m.mot.replace(/ /g, ' ')}
          </span>
        );
      })}
    </div>
  );
};
