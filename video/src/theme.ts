// Identité visuelle : sombre, cinématique, palette or / ocre / vert d'AfroAtlas.
import { staticFile } from 'remotion';

export const couleurs = {
  noir: '#0B0B0A',
  noirDoux: '#151512',
  vert: '#193D30',
  vertVif: '#2F7A57',
  or: '#DFAE43',
  ocre: '#B94C35',
  creme: '#FAF7EF',
  gris: '#8A8F86',
};

export const polices = {
  titre: 'AfroDisplay, Inter, Arial, sans-serif',
  texte: 'AfroText, Inter, Arial, sans-serif',
  serif: 'Georgia, "Liberation Serif", serif',
};

// Polices Inter (licence OFL, voir public/fonts/LICENSE-Inter.txt) chargées depuis public/.
export const styleDesPolices = `
@font-face { font-family: AfroDisplay; font-weight: 900; src: url(${staticFile('fonts/InterDisplay-Black.otf')}); }
@font-face { font-family: AfroDisplay; font-weight: 700; src: url(${staticFile('fonts/InterDisplay-Bold.otf')}); }
@font-face { font-family: AfroText; font-weight: 500; src: url(${staticFile('fonts/Inter-Medium.otf')}); }
`;
