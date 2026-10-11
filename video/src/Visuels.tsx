// Miniature YouTube (1280 × 720) et couvertures 9:16 (1080 × 1920), sur l'histoire
// « même produit, deux noms » : chaque paire de noms vient des données du site.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import data from './generated/data.json';
import { couleurs, polices, styleDesPolices } from './theme';
import { Grain } from './components/kit';

const njansang = data.histoire.njansang;
const soumbala = data.histoire.soumbala;
const trouver = (p: typeof njansang, iso: string, nom: string) =>
  p.parPays.find((n) => n.iso === iso && n.nom.toLowerCase() === nom)!;

const Ombre: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, #000000d0 100%)' }} />
);
const Paire: React.FC<{ a: { nom: string; pays: string }; b: { nom: string; pays: string }; taille: number }> = ({ a, b, taille }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: taille * 0.25, justifyContent: 'center' }}>
    {[a, b].map((n, i) => (
      <React.Fragment key={n.nom}>
        {i === 1 && <span style={{ fontSize: taille * 0.9, color: couleurs.ocre }}>=</span>}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: taille, color: i ? couleurs.or : couleurs.creme, lineHeight: 1 }}>{n.nom.toUpperCase()}</div>
          <div style={{ fontFamily: polices.texte, fontWeight: 500, fontSize: taille * 0.3, color: couleurs.creme, letterSpacing: '0.15em', marginTop: 8 }}>{n.pays.toUpperCase()}</div>
        </div>
      </React.Fragment>
    ))}
  </div>
);

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ background: couleurs.noir }}>
    <style>{styleDesPolices}</style>
    <Img src={staticFile(`images/${njansang.photo.fichier}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.2) brightness(0.45)' }} />
    <Ombre />
    <Grain graine={3} opacite={0.07} />
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: polices.titre, fontWeight: 900 }}>
      <div style={{ fontSize: 40, color: couleurs.ocre }}>✳ AfroAtlas.</div>
      <div style={{ fontSize: 92, color: couleurs.creme, margin: '18px 0 34px', letterSpacing: '-0.02em' }}>MÊME PRODUIT, DEUX NOMS</div>
      <Paire a={trouver(njansang, 'CMR', 'njangsang')} b={trouver(njansang, 'CIV', 'akpi')} taille={96} />
    </div>
    <div style={{ position: 'absolute', right: 16, bottom: 12, fontFamily: polices.texte, fontSize: 14, color: '#ffffffa0' }}>Photo : {njansang.photo.credit}</div>
  </AbsoluteFill>
);

// Couvertures : texte entre 250 px du haut et 400 px du bas, à 120 px des bords.
export const Couverture: React.FC<{ variante: 'tiktok' | 'reels' }> = ({ variante }) => {
  const produit = variante === 'tiktok' ? njansang : soumbala;
  const paire =
    variante === 'tiktok'
      ? [trouver(njansang, 'CMR', 'njangsang'), trouver(njansang, 'CIV', 'akpi')]
      : [trouver(soumbala, 'MLI', 'soumbala'), trouver(soumbala, 'SEN', 'nététou')];
  const titre = variante === 'tiktok' ? ['DANS UNE', 'AFROSHOP ?'] : ['UN CONDIMENT.', 'DEUX PAYS.'];
  return (
    <AbsoluteFill style={{ background: couleurs.noir }}>
      <style>{styleDesPolices}</style>
      <Img src={staticFile(`images/${produit.photo.fichier}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.15) brightness(0.45)' }} />
      <Ombre />
      <Grain graine={5} opacite={0.07} />
      <div style={{ position: 'absolute', left: 120, right: 120, top: 330, textAlign: 'center', fontFamily: polices.titre, fontWeight: 900 }}>
        <div style={{ fontSize: 56, color: couleurs.ocre }}>✳ AfroAtlas.</div>
        <div style={{ fontSize: 112, lineHeight: 1, color: couleurs.creme, margin: '50px 0 90px', letterSpacing: '-0.02em' }}>
          {titre[0]}
          <br />
          <span style={{ color: couleurs.or }}>{titre[1]}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center' }}>
          {paire.map((n, i) => (
            <div key={n.nom} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 110, color: i ? couleurs.or : couleurs.creme, lineHeight: 1 }}>{n.nom.toUpperCase()}</div>
              <div style={{ fontFamily: polices.texte, fontWeight: 500, fontSize: 38, color: couleurs.creme, letterSpacing: '0.2em', marginTop: 10 }}>{n.pays.toUpperCase()}</div>
              {i === 0 && <div style={{ fontSize: 80, color: couleurs.ocre, marginTop: 20 }}>=</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', right: 130, bottom: 420, fontFamily: polices.texte, fontSize: 22, color: '#ffffffa0' }}>Photo : {produit.photo.credit}</div>
    </AbsoluteFill>
  );
};
