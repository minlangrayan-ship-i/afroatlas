// Briques visuelles réutilisées par toutes les scènes.
import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { couleurs, polices } from '../theme';

/** Fond noir profond, halo or très doux, vignettage et grain de pellicule animé. */
export const Fond: React.FC<{ teinte?: string }> = ({ teinte = couleurs.or }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const derive = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ background: couleurs.noir }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${50 + derive / 20}% ${42 + derive / 30}%, ${teinte}26 0%, transparent 55%)`,
        }}
      />
      <Grain graine={frame % 6} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${width * 0.75}px ${height * 0.75}px at 50% 50%, transparent 40%, #000000cc 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Grain de pellicule (bruit SVG), régénéré quelques fois par seconde. */
export const Grain: React.FC<{ graine: number; opacite?: number }> = ({ graine, opacite = 0.09 }) => (
  <AbsoluteFill style={{ opacity: opacite, mixBlendMode: 'screen' }}>
    <svg width="100%" height="100%">
      <filter id={`grain-${graine}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={graine} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${graine})`} />
    </svg>
  </AbsoluteFill>
);

/** Entrée « punch » : léger zoom arrière et fondu sur les premières images d'un plan. */
export function usePunch(debut = 0, force = 0.12) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - debut, fps, config: { damping: 18, stiffness: 180, mass: 0.6 } });
  return {
    transform: `scale(${1 + force * (1 - s)})`,
    opacity: interpolate(frame - debut, [0, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  };
}

/** Éclair blanc-or très bref pour marquer une coupe. */
export const Eclair: React.FC<{ a: number; duree?: number }> = ({ a, duree = 5 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [a, a + 1, a + duree], [0, 0.32, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ background: couleurs.or, opacity: o, mixBlendMode: 'screen' }} />;
};

/** Photo plein cadre avec mouvement lent (Ken Burns), étalonnage sombre et crédit obligatoire. */
export const Photo: React.FC<{
  fichier: string;
  credit: string;
  depart?: number;
  zoom?: [number, number];
  decalage?: [number, number];
  sombre?: number;
  creditY?: number;
}> = ({ fichier, credit, depart = 0, zoom = [1.08, 1.22], decalage = [0, -2], sombre = 0.55, creditY }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, height } = useVideoConfig();
  const t = interpolate(frame - depart, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const echelle = zoom[0] + (zoom[1] - zoom[0]) * t;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(`images/${fichier}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${echelle}) translate(${decalage[0] * t}%, ${decalage[1] * t}%)`,
          filter: 'contrast(1.12) saturate(0.9)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, #0B0B0A${Math.round(sombre * 200).toString(16).padStart(2, '0')} 0%, #0B0B0A${Math.round(sombre * 255).toString(16).padStart(2, '0')} 100%)`,
        }}
      />
      <Credit texte={`Photo : ${credit}`} y={creditY ?? height - 40} />
    </AbsoluteFill>
  );
};

/** Crédit discret (licences CC BY / BY-SA : l'auteur et la licence doivent être visibles). */
export const Credit: React.FC<{ texte: string; y: number }> = ({ texte, y }) => {
  const { width } = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: y - 22,
        right: width > 1500 ? 40 : 130,
        fontFamily: polices.texte,
        fontSize: 18,
        color: '#ffffffb0',
        textShadow: '0 1px 3px #000',
      }}
    >
      {texte}
    </div>
  );
};

/** Titre cinétique : apparition mot à mot avec ressort. */
export const TitreCinetique: React.FC<{
  texte: string;
  a: number;
  taille: number;
  couleur?: string;
  accent?: string[];
  pas?: number;
  style?: React.CSSProperties;
}> = ({ texte, a, taille, couleur = couleurs.creme, accent = [], pas = 3, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily: polices.titre,
        fontWeight: 900,
        fontSize: taille,
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
        color: couleur,
        textAlign: 'center',
        ...style,
      }}
    >
      {texte.split(' ').map((mot, i) => {
        const s = spring({ frame: frame - a - i * pas, fps, config: { damping: 14, stiffness: 160 } });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: '0.25em',
              opacity: s,
              transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + 0.1 * s})`,
              color: accent.includes(mot) ? couleurs.or : undefined,
            }}
          >
            {mot}
          </span>
        );
      })}
    </div>
  );
};

/** Compteur animé jusqu'à une valeur réelle. */
export const Compteur: React.FC<{ valeur: number; a: number; libelle: string; taille: number }> = ({
  valeur,
  a,
  libelle,
  taille,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [a, a + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const n = Math.round(valeur * t).toLocaleString('fr-FR');
  return (
    <div style={{ textAlign: 'center', opacity: interpolate(frame, [a, a + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: taille, color: couleurs.or, lineHeight: 1 }}>
        {n}
      </div>
      <div
        style={{
          fontFamily: polices.texte,
          fontSize: taille * 0.26,
          color: couleurs.creme,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginTop: 12,
        }}
      >
        {libelle}
      </div>
    </div>
  );
};

/** Logo AfroAtlas (astérisque et point, identité du site). */
export const Logo: React.FC<{ taille: number; a?: number }> = ({ taille, a = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - a, fps, config: { damping: 12, stiffness: 120 } });
  const rotation = interpolate(frame - a, [0, 30], [-90, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        fontFamily: polices.titre,
        fontWeight: 900,
        fontSize: taille,
        color: couleurs.creme,
        display: 'flex',
        alignItems: 'center',
        gap: taille * 0.2,
        opacity: s,
        transform: `scale(${0.85 + 0.15 * s})`,
      }}
    >
      <span style={{ color: couleurs.ocre, display: 'inline-block', transform: `rotate(${rotation}deg)` }}>✳</span>
      <span>
        AfroAtlas<span style={{ color: couleurs.ocre }}>.</span>
      </span>
    </div>
  );
};

/** Badge de statut réel des appellations : « Documenté · Source ↗ ». */
export const BadgeSource: React.FC<{ taille: number }> = ({ taille }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: taille * 0.4,
      padding: `${taille * 0.35}px ${taille * 0.7}px`,
      borderRadius: 999,
      border: `2px solid ${couleurs.or}`,
      background: '#DFAE4318',
      fontFamily: polices.texte,
      fontSize: taille,
      color: couleurs.or,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ width: taille * 0.55, height: taille * 0.55, borderRadius: 99, background: couleurs.vertVif }} />
    Documenté · Source ↗
  </span>
);
