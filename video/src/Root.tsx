// Déclare les compositions : les trois vidéos et les visuels de publication.
import React from 'react';
import { Composition, Still } from 'remotion';
import { Video, type VideoProps } from './Video';
import { Miniature, Couverture } from './Visuels';
import { formats, FPS, type NomFormat } from './formats';
import { dureeTotale } from './timing';

const parDefaut = (format: NomFormat): VideoProps => ({
  format,
  musiqueDb: -20,
  adresse: 'minlangrayan-ship-i.github.io/afroatlas',
  compte: '',
});

export const Racine: React.FC = () => (
  <>
    {(['youtube', 'tiktok', 'reels'] as const).map((format) => (
      <Composition
        key={format}
        id={format}
        component={Video}
        width={formats[format].largeur}
        height={formats[format].hauteur}
        fps={FPS}
        durationInFrames={dureeTotale(format)}
        defaultProps={parDefaut(format)}
      />
    ))}
    <Still id="miniature-youtube" component={Miniature} width={1280} height={720} />
    <Still id="couverture-tiktok" component={Couverture} width={1080} height={1920} defaultProps={{ variante: 'tiktok' as const }} />
    <Still id="couverture-reels" component={Couverture} width={1080} height={1920} defaultProps={{ variante: 'reels' as const }} />
  </>
);
