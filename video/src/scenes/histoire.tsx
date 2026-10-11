// Scènes de l'histoire « diaspora » : le trajet, l'afroshop, les deux noms d'un même produit.
// Les villes sont une mise en situation ; les noms et leurs pays viennent des données du site.
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { couleurs, polices } from '../theme';
import type { Format } from '../formats';
import { Credit, Eclair, Fond, TitreCinetique, usePunch } from '../components/kit';
import { Zone } from './scenes';

type Props = { format: Format };
type Ville = keyof typeof data.cartes.villes;

// ───────────── Le trajet : de la ville d'origine à la ville d'arrivée ─────────────
export const SceneTrajet: React.FC<Props & { depart: Ville; arrivee: Ville; aArrivee: number }> = ({
  format,
  depart,
  arrivee,
  aArrivee,
}) => {
  const frame = useCurrentFrame();
  const v = format.vertical;
  const [x1, y1] = data.cartes.villes[depart];
  const [x2, y2] = data.cartes.villes[arrivee];
  // Arc doré : courbe de Bézier dont le point de contrôle s'écarte vers l'ouest.
  const cx = Math.min(x1, x2) - 220,
    cy = (y1 + y2) / 2;
  const longueur = 1400;
  const trace = interpolate(frame, [aArrivee - 10, aArrivee + 22], [longueur, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Caméra : cadrée sur la ville de départ, puis recule pour montrer le voyage.
  const recul = interpolate(frame, [0, aArrivee + 20], [1.9, 1], { extrapolateRight: 'clamp' });
  const centreX = interpolate(frame, [0, aArrivee + 20], [x1, 500], { extrapolateRight: 'clamp' });
  const centreY = interpolate(frame, [0, aArrivee + 20], [y1, 560], { extrapolateRight: 'clamp' });
  const taille = v ? 840 : 760;
  const arrive = frame >= aArrivee + 18;
  const etiquette = (x: number, y: number, nom: string, visible: boolean) => (
    <g opacity={visible ? 1 : 0}>
      <circle cx={x} cy={y} r={14} fill={couleurs.or} />
      <circle cx={x} cy={y} r={14 + (frame % 30)} fill="none" stroke={couleurs.or} strokeOpacity={1 - (frame % 30) / 30} strokeWidth={3} />
      <text x={x + 26} y={y + 14} fill={couleurs.creme} fontFamily="AfroDisplay, Arial" fontWeight={900} fontSize={46}>
        {nom.toUpperCase()}
      </text>
    </g>
  );
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.vert} />
      <Zone format={format}>
        <svg width={taille} height={taille} viewBox="0 0 1000 1000" style={{ overflow: 'hidden', borderRadius: 24 }}>
          <g transform={`translate(${500 - centreX * recul} ${500 - centreY * recul}) scale(${recul})`}>
            {data.cartes.trajet.map((p) => (
              <path key={p.iso} d={p.d} fill="#25251f" stroke="#0B0B0A" strokeWidth={1.5} />
            ))}
            <path
              d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
              fill="none"
              stroke={couleurs.or}
              strokeWidth={6}
              strokeDasharray={longueur}
              strokeDashoffset={trace}
              strokeLinecap="round"
            />
            {etiquette(x1, y1, depart, true)}
            {etiquette(x2, y2, arrivee, arrive)}
          </g>
        </svg>
      </Zone>
      <Credit texte={data.cartes.afriqueCredit} y={format.vertical ? format.sur.haut + 24 : format.hauteur - 40} />
      <Eclair a={aArrivee + 18} duree={6} />
    </AbsoluteFill>
  );
};

// ───────────── L'afroshop : la demande, l'incompréhension, l'étiquette ─────────────
export const SceneAfroshop: React.FC<
  Props & {
    demande: string;
    reponse?: { texte: string; a: number };
    /** Nom écrit sur l'étiquette du bocal (le nom du pays du vendeur) et instant du zoom. */
    etiquette: { texte: string; a: number };
    photo: { fichier: string; credit: string };
  }
> = ({ format, demande, reponse, etiquette, photo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const bulle = (a: number) => spring({ frame: frame - a, fps, config: { damping: 13, stiffness: 150 } });
  const zoom = interpolate(frame, [etiquette.a, etiquette.a + 18], [1, v ? 2.1 : 2.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lueur = frame >= etiquette.a ? 0.6 + 0.4 * Math.sin(frame / 4) : 0;
  const L = v ? 840 : 1680;
  const H = v ? 1020 : 740;
  // Étagères : trois rangées de bocaux ; le bocal mis en avant est au centre de la rangée du milieu.
  const rangees = [0.2, 0.47, 0.74];
  const couvercles = [couleurs.ocre, couleurs.vertVif, couleurs.or, '#6b4a2b', couleurs.ocre, '#3d5a80'];
  const focusX = L / 2,
    focusY = H * rangees[1];
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.ocre} />
      <Zone format={format}>
        <div style={{ position: 'relative', width: L, height: H, overflow: 'hidden', borderRadius: 24, background: '#1a1611', boxShadow: 'inset 0 0 120px #000' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${focusX}px ${focusY}px` }}>
            {rangees.map((y, r) => (
              <React.Fragment key={r}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: H * y + 70, height: 14, background: '#4a3a28' }} />
                {Array.from({ length: v ? 5 : 8 }).map((_, k, t) => {
                  const x = ((k + 0.5) / t.length) * L;
                  const vedette = r === 1 && k === Math.floor(t.length / 2);
                  const w = v ? 120 : 130;
                  return (
                    <div key={k} style={{ position: 'absolute', left: (vedette ? focusX : x) - w / 2, top: H * y - 70, width: w, height: 140 }}>
                      <div style={{ height: 22, margin: '0 10px', borderRadius: 6, background: couvercles[(k + r) % couvercles.length] }} />
                      <div style={{ height: 118, borderRadius: 14, background: vedette ? '#8a6d3b55' : '#ffffff14', border: '2px solid #ffffff22', overflow: 'hidden', position: 'relative' }}>
                        {vedette && <Img src={staticFile(`images/${photo.fichier}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />}
                        <div style={{ position: 'absolute', left: 8, right: 8, top: 38, padding: '4px 0', textAlign: 'center', background: vedette ? couleurs.creme : '#d9d2c0', color: couleurs.noir, fontFamily: polices.titre, fontWeight: 900, fontSize: vedette ? 22 : 14, borderRadius: 4, boxShadow: vedette ? `0 0 ${30 * lueur}px ${couleurs.or}` : undefined }}>
                          {vedette ? etiquette.texte.toUpperCase() : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          {/* Dialogue au premier plan, masqué pendant le zoom sur l'étiquette. */}
          <div style={{ position: 'absolute', left: 30, bottom: 34, transform: `scale(${bulle(2)})`, transformOrigin: 'bottom left', opacity: frame < etiquette.a ? 1 : 0 }}>
            <BulleShop texte={demande} taille={v ? 50 : 46} />
          </div>
          {reponse && (
            <div style={{ position: 'absolute', right: 30, bottom: v ? 150 : 120, transform: `scale(${bulle(reponse.a)})`, transformOrigin: 'bottom right', opacity: frame < etiquette.a ? 1 : 0 }}>
              <BulleShop texte={reponse.texte} taille={v ? 50 : 46} couleur={couleurs.ocre} />
            </div>
          )}
          {/* Enseigne de la boutique, dans le décor (hors de la zone des crédits). */}
          <div style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', fontFamily: polices.texte, fontSize: v ? 30 : 26, letterSpacing: '0.35em', color: couleurs.or, opacity: frame < etiquette.a ? 1 : 0 }}>
            AFROSHOP
          </div>
        </div>
      </Zone>
      <Credit texte={`Photo : ${photo.credit}`} y={format.vertical ? format.sur.haut + 24 : format.hauteur - 40} />
      <Eclair a={etiquette.a} duree={5} />
    </AbsoluteFill>
  );
};
const BulleShop: React.FC<{ texte: string; taille: number; couleur?: string }> = ({ texte, taille, couleur = couleurs.creme }) => (
  <div style={{ background: couleur, color: couleur === couleurs.creme ? couleurs.noir : couleurs.creme, fontFamily: polices.titre, fontWeight: 700, fontSize: taille, padding: `${taille * 0.4}px ${taille * 0.65}px`, borderRadius: taille * 0.6, whiteSpace: 'nowrap', boxShadow: '0 20px 60px #000c' }}>
    {texte}
  </div>
);

// ───────────── Deux noms, un produit ─────────────
export const SceneDeuxNoms: React.FC<
  Props & {
    gauche: { nom: string; pays: string };
    droite: { nom: string; pays: string; a: number };
    final?: { texte: string; a: number };
    photo: { fichier: string; credit: string };
  }
> = ({ format, gauche, droite, final, photo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const sD = spring({ frame: frame - droite.a, fps, config: { damping: 14 } });
  const finalActif = final && frame >= final.a;
  const punch = usePunch(finalActif ? final!.a : 0, 0.15);
  const carte = (nom: string, pays: string, s: number, accent: boolean) => (
    <div style={{ textAlign: 'center', opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ fontFamily: polices.texte, fontSize: v ? 40 : 38, letterSpacing: '0.25em', color: couleurs.or, textTransform: 'uppercase' }}>{pays}</div>
      <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: Math.min(v ? 150 : 150, (v ? 840 : 760) / (nom.length * 0.64)), color: accent ? couleurs.or : couleurs.creme, lineHeight: 1.05, whiteSpace: 'nowrap' }}>
        {nom}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.vert} />
      <Zone format={format}>
        {finalActif ? (
          <div style={punch}>
            <TitreCinetique texte={final!.texte} a={final!.a} taille={v ? 130 : 150} accent={['PRODUIT.', 'DEUX', 'NOMS.', 'AUTRE', 'NOM.']} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: 'center', gap: v ? 40 : 70 }}>
            {carte(gauche.nom, gauche.pays, 1, false)}
            <div style={{ width: v ? 220 : 240, height: v ? 220 : 240, borderRadius: 999, overflow: 'hidden', border: `6px solid ${couleurs.or}`, flexShrink: 0, opacity: sD, transform: `scale(${0.6 + 0.4 * sD})` }}>
              <Img src={staticFile(`images/${photo.fichier}`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {carte(droite.nom, droite.pays, sD, true)}
          </div>
        )}
      </Zone>
      <Credit texte={`Photo : ${photo.credit}`} y={format.vertical ? format.sur.haut + 24 : format.hauteur - 40} />
      <Eclair a={droite.a} duree={5} />
      {final && <Eclair a={final.a} duree={6} />}
    </AbsoluteFill>
  );
};
