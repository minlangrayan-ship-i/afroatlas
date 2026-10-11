// Miniature YouTube (1280 × 720) et couvertures 9:16 (1080 × 1920).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import data from './generated/data.json';
import { couleurs, polices, styleDesPolices } from './theme';
import { Grain } from './components/kit';

const demo = data.demo.njangsang;
const safou = data.demo.safou;
// Nombre réel de noms en langues locales camerounaises pour ce produit (données du site).
const nomsLocaux = demo.noms.filter((n) => n.langues.some((l) => l && l !== 'Français' && l !== 'Anglais')).length;

const Ombre: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, #000000d0 100%)' }} />
);

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ background: couleurs.noir }}>
    <style>{styleDesPolices}</style>
    <Img src={staticFile(`images/${demo.photo.fichier}`)} style={{ position: 'absolute', right: 0, top: 0, width: 640, height: 720, objectFit: 'cover', filter: 'contrast(1.15) saturate(0.85) brightness(0.75)' }} />
    <AbsoluteFill style={{ background: `linear-gradient(90deg, ${couleurs.noir} 45%, transparent 85%)` }} />
    <Ombre />
    <Grain graine={3} opacite={0.07} />
    <div style={{ position: 'absolute', left: 70, top: 70, fontFamily: polices.titre, fontWeight: 900, color: couleurs.creme }}>
      <div style={{ fontSize: 46, color: couleurs.ocre }}>✳ AfroAtlas.</div>
      <div style={{ fontSize: 132, lineHeight: 0.95, marginTop: 24, letterSpacing: '-0.03em' }}>
        1 PRODUIT
        <br />
        <span style={{ color: couleurs.or }}>{nomsLocaux} NOMS</span>
      </div>
      <div style={{ marginTop: 34, display: 'flex', gap: 14, flexWrap: 'wrap', maxWidth: 640 }}>
        {demo.noms.slice(0, 4).map((n) => (
          <span key={n.nom} style={{ fontSize: 40, padding: '6px 18px', border: `3px solid ${couleurs.or}`, borderRadius: 12, color: couleurs.or }}>
            {n.nom}
          </span>
        ))}
      </div>
    </div>
    <div style={{ position: 'absolute', right: 16, bottom: 12, fontFamily: polices.texte, fontSize: 14, color: '#ffffffa0' }}>
      Photo : {demo.photo.credit}
    </div>
  </AbsoluteFill>
);

// Couvertures : texte entre 250 px du haut et 400 px du bas, à 120 px des bords.
export const Couverture: React.FC<{ variante: 'tiktok' | 'reels' }> = ({ variante }) => {
  const produit = variante === 'tiktok' ? demo : safou;
  const titre = variante === 'tiktok' ? ['TU L’APPELLES', 'COMMENT ?'] : ['UN FRUIT.', 'PLEIN DE NOMS.'];
  return (
    <AbsoluteFill style={{ background: couleurs.noir }}>
      <style>{styleDesPolices}</style>
      <Img src={staticFile(`images/${produit.photo.fichier}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.15) saturate(0.85) brightness(0.55)' }} />
      <Ombre />
      <Grain graine={5} opacite={0.07} />
      <div style={{ position: 'absolute', left: 120, right: 120, top: 330, textAlign: 'center', fontFamily: polices.titre, fontWeight: 900 }}>
        <div style={{ fontSize: 56, color: couleurs.ocre }}>✳ AfroAtlas.</div>
        <div style={{ fontSize: 118, lineHeight: 1, color: couleurs.creme, marginTop: 50, letterSpacing: '-0.02em' }}>
          {titre[0]}
          <br />
          <span style={{ color: couleurs.or }}>{titre[1]}</span>
        </div>
        <div style={{ marginTop: 70, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center' }}>
          {produit.noms.slice(0, 4).map((n) => (
            <div key={n.nom} style={{ fontSize: 64, color: couleurs.creme, padding: '6px 34px', border: `4px solid ${couleurs.or}`, borderRadius: 16, background: '#0B0B0A99' }}>
              {n.nom} <span style={{ fontFamily: polices.texte, fontWeight: 500, fontSize: 34, color: couleurs.or }}>{n.langues.join(' · ')}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', right: 130, bottom: 420, fontFamily: polices.texte, fontSize: 22, color: '#ffffffa0' }}>
        Photo : {produit.photo.credit}
      </div>
    </AbsoluteFill>
  );
};
