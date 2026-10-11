// Scènes communes aux trois formats. Chaque scène reçoit ses repères (en images, relatifs
// au début de la scène) calculés sur la voix off, et s'adapte au format (16:9 ou 9:16).
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { couleurs, polices } from '../theme';
import type { Format } from '../formats';
import { BadgeSource, Compteur, Credit, Eclair, Fond, Logo, Photo, TitreCinetique, usePunch } from '../components/kit';

type Props = { format: Format };
/** Produit tel qu'affiché dans les maquettes d'interface. */
export type ProduitAffiche = { titre: string; scientifique: string | null; photo: { fichier: string; credit: string } };
const demo = data.demo.njangsang;
const safou = data.demo.safou;

/** Zone utile de la scène, entre les marges de sécurité et les sous-titres. */
export const Zone: React.FC<{ format: Format; children: React.ReactNode; style?: React.CSSProperties }> = ({
  format,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  // Mouvement de caméra continu : la scène n'est jamais figée.
  const derive = 1 + frame * 0.0009;
  return (
    <div
      style={{
        position: 'absolute',
        top: format.zoneScene.haut,
        height: format.zoneScene.bas - format.zoneScene.haut,
        left: format.sur.gauche,
        right: format.sur.droite,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${derive})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Position des crédits : bas de l'image en 16:9 ; en 9:16, juste sous la marge haute
 *  pour ne croiser ni le contenu central ni les sous-titres. */
const creditY = (format: Format) => (format.vertical ? format.sur.haut + 24 : format.hauteur - 40);

const plan = (frame: number, reperes: number[]) => {
  let i = -1;
  reperes.forEach((r, k) => {
    if (frame >= r) i = k;
  });
  return i;
};

// ───────────── HOOK : rafale de noms ─────────────
export const SceneRafale: React.FC<
  Props & {
    noms: { texte: string; detail?: string; a: number }[];
    final?: { texte: string; a: number };
    photo?: { fichier: string; credit: string };
    /** Photo en fond sur tous les plans (sinon un plan sur deux). */
    photoToujours?: boolean;
  }
> = ({ format, noms, final, photo, photoToujours = false }) => {
  const frame = useCurrentFrame();
  const v = format.vertical;
  const i = plan(frame, noms.map((n) => n.a));
  const finalActif = final && frame >= final.a;
  const courant = noms[Math.max(0, i)];
  const punch = usePunch(finalActif ? final!.a : courant.a, 0.25);
  return (
    <AbsoluteFill>
      {photo && (photoToujours || (i % 2 === 1 && !finalActif)) ? (
        <Photo fichier={photo.fichier} credit={photo.credit} sombre={0.62} zoom={photoToujours ? [1.05, 1.3] : [1.25, 1.35]} creditY={creditY(format)} />
      ) : (
        <Fond teinte={i % 2 ? couleurs.vert : couleurs.or} />
      )}
      <Zone format={format}>
        <div style={{ ...punch, textAlign: 'center' }}>
          {finalActif ? (
            <TitreCinetique texte={final!.texte} a={final!.a} taille={v ? 150 : 170} accent={['UN', 'SEUL', '1', 'SEUL']} />
          ) : (
            <>
              <div
                style={{
                  fontFamily: polices.titre,
                  fontWeight: 900,
                  fontSize: Math.min(v ? 170 : 230, ((v ? 840 : 1680) / (courant.texte.length * 0.66))),
                  whiteSpace: 'nowrap',
                  color: i % 2 ? couleurs.or : couleurs.creme,
                  letterSpacing: '-0.03em',
                  textTransform: 'uppercase',
                  textShadow: '0 10px 40px #000',
                }}
              >
                {courant.texte}
              </div>
              {courant.detail && (
                <div style={{ fontFamily: polices.texte, fontSize: v ? 48 : 46, color: couleurs.creme, opacity: 0.8, marginTop: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  {courant.detail}
                </div>
              )}
            </>
          )}
        </div>
      </Zone>
      {noms.map((n) => (
        <Eclair key={n.a} a={n.a} />
      ))}
      {final && <Eclair a={final.a} duree={8} />}
    </AbsoluteFill>
  );
};

// ───────────── TENSION : un produit, une langue, un autre nom ─────────────
export const SceneLangues: React.FC<
  Props & {
    titre: { texte: string; a: number };
    langues: { langue: string; nom?: string; a: number }[];
    photo?: { fichier: string; credit: string };
  }
> = ({ format, titre, langues, photo = demo.photo }) => {
  const frame = useCurrentFrame();
  const v = format.vertical;
  const i = plan(frame, langues.map((l) => l.a));
  const punch = usePunch(i >= 0 ? langues[i].a : titre.a, 0.18);
  return (
    <AbsoluteFill>
      {i < 0 ? (
        <Photo fichier={photo.fichier} credit={photo.credit} sombre={0.58} creditY={creditY(format)} />
      ) : (
        <Fond teinte={i % 2 ? couleurs.ocre : couleurs.vert} />
      )}
      <Zone format={format}>
        {i < 0 ? (
          <TitreCinetique texte={titre.texte} a={titre.a} taille={v ? 110 : 130} accent={['ARBRE', 'PRODUIT', 'SAFOU']} />
        ) : (
          <div style={{ ...punch, textAlign: 'center' }}>
            <div style={{ fontFamily: polices.texte, fontSize: v ? 52 : 50, letterSpacing: '0.3em', color: couleurs.or, textTransform: 'uppercase' }}>
              en {langues[i].langue}
            </div>
            {langues[i].nom && (
              <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 150 : 190, color: couleurs.creme, lineHeight: 1.05, marginTop: 10 }}>
                {langues[i].nom}
              </div>
            )}
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 30 }}>
              {langues.map((l, k) => (
                <span key={k} style={{ width: 16, height: 16, borderRadius: 99, background: k <= i ? couleurs.or : '#ffffff30' }} />
              ))}
            </div>
          </div>
        )}
      </Zone>
      {langues.map((l) => (
        <Eclair key={l.a} a={l.a} duree={4} />
      ))}
    </AbsoluteFill>
  );
};

// ───────────── TENSION : au marché, on ne se comprend pas ─────────────
// Illustration en motion design (aucune image tierce) ; remplaçable par un plan filmé,
// voir video/broll-shotlist.md.
export const SceneMarche: React.FC<Props & { chute: number }> = ({ format, chute }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const bulle = (a: number) => spring({ frame: frame - a, fps, config: { damping: 13, stiffness: 140 } });
  const b1 = bulle(4), b2 = bulle(22);
  const final = frame >= chute;
  const tailleBulle = v ? 52 : 46;
  const personnage = (couleur: string, miroir: boolean) => (
    <svg width={v ? 260 : 240} height={v ? 380 : 340} viewBox="0 0 240 340" style={{ transform: miroir ? 'scaleX(-1)' : undefined }}>
      <circle cx="120" cy="70" r="52" fill={couleur} />
      <path d="M30 340 C30 190 70 150 120 150 C170 150 210 190 210 340 Z" fill={couleur} />
    </svg>
  );
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.ocre} />
      <Zone format={format}>
        {!final ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: v ? 60 : 260, position: 'relative', marginTop: v ? 160 : 120 }}>
            {personnage('#2a2a26', false)}
            {personnage('#1f3a2e', true)}
            <div style={{ position: 'absolute', left: v ? -10 : -60, top: v ? -230 : -170, transform: `scale(${b1})`, transformOrigin: 'bottom left' }}>
              <Bulle taille={tailleBulle} texte="Je cherche du njangsang." />
            </div>
            <div style={{ position: 'absolute', right: v ? -10 : -60, top: v ? -110 : -80, transform: `scale(${b2})`, transformOrigin: 'bottom right' }}>
              <Bulle taille={tailleBulle} texte="Du… quoi ?" couleur={couleurs.ocre} />
            </div>
          </div>
        ) : (
          <TitreCinetique texte="On ne se comprend pas." a={chute} taille={v ? 120 : 140} accent={['pas.']} />
        )}
      </Zone>
      <Eclair a={chute} />
    </AbsoluteFill>
  );
};
const Bulle: React.FC<{ texte: string; taille: number; couleur?: string }> = ({ texte, taille, couleur = couleurs.creme }) => (
  <div
    style={{
      background: couleur,
      color: couleur === couleurs.creme ? couleurs.noir : couleurs.creme,
      fontFamily: polices.titre,
      fontWeight: 700,
      fontSize: taille,
      padding: `${taille * 0.45}px ${taille * 0.7}px`,
      borderRadius: taille * 0.6,
      whiteSpace: 'nowrap',
      boxShadow: '0 20px 60px #000a',
    }}
  >
    {texte}
  </div>
);

// ───────────── PROBLÈME : des listes sans source ─────────────
export const SceneSansSource: React.FC<Props & { titre: number; titreTexte?: string }> = ({
  format,
  titre,
  titreTexte = "D'OÙ VIENT CE NOM ?",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const cartes = [0, 1, 2];
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.ocre} />
      <Zone format={format}>
        {frame < titre ? (
          <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? 36 : 40 }}>
            {cartes.map((k) => {
              const s = spring({ frame: frame - k * 6, fps, config: { damping: 15 } });
              const barre = interpolate(frame - 14 - k * 6, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              return (
                <div key={k} style={{ position: 'relative', width: v ? 760 : 460, height: v ? 230 : 300, borderRadius: 18, background: '#1d1d19', border: '1px solid #ffffff22', padding: 28, opacity: s, transform: `translateY(${(1 - s) * 60}px) rotate(${(k - 1) * 2}deg)` }}>
                  {[0.9, 0.7, 0.8, 0.55].map((w, j) => (
                    <div key={j} style={{ height: 18, width: `${w * 100}%`, background: '#ffffff26', borderRadius: 6, marginBottom: 22, filter: 'blur(2px)' }} />
                  ))}
                  <div style={{ position: 'absolute', right: 26, bottom: 22, fontFamily: polices.titre, fontWeight: 900, fontSize: 40, color: couleurs.ocre, border: `4px solid ${couleurs.ocre}`, padding: '4px 16px', transform: `rotate(-8deg) scale(${barre})` }}>
                    SOURCE ?
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <TitreCinetique texte={titreTexte} a={titre} taille={v ? 120 : 150} accent={['NOM', 'NOTÉS', '?']} />
        )}
      </Zone>
      <Eclair a={titre} />
    </AbsoluteFill>
  );
};

// ───────────── SOLUTION : révélation du logo ─────────────
export const SceneLogo: React.FC<Props & { promesse: number; appui?: number; promesseTexte?: string }> = ({
  format,
  promesse,
  appui,
  promesseTexte = 'Un même produit, plusieurs noms.',
}) => {
  const frame = useCurrentFrame();
  const v = format.vertical;
  const balayage = interpolate(frame, [0, 18], [-120, 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.or} />
      <AbsoluteFill style={{ background: `linear-gradient(100deg, transparent ${40 + balayage}%, #DFAE4340 ${50 + balayage}%, transparent ${60 + balayage}%)` }} />
      <Zone format={format}>
        <Logo taille={v ? 130 : 170} />
        <div style={{ height: v ? 60 : 50 }} />
        <TitreCinetique texte={promesseTexte} a={promesse} taille={v ? 64 : 64} couleur={couleurs.creme} pas={2} style={{ maxWidth: v ? 820 : 1500 }} />
        {appui !== undefined && (
          <div style={{ marginTop: 40, opacity: interpolate(frame, [appui, appui + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            <BadgeSource taille={v ? 38 : 36} />
          </div>
        )}
      </Zone>
      <Eclair a={0} duree={10} />
    </AbsoluteFill>
  );
};

// ───────────── DÉMO 1 : recherche ─────────────
export const SceneRecherche: React.FC<Props & { requete: string; resultat: string; scientifique: string }> = ({
  format,
  requete,
  resultat,
  scientifique,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const lettres = Math.min(requete.length, Math.max(0, Math.floor((frame - 6) / 3)));
  const suggestion = spring({ frame: frame - (6 + requete.length * 3 + 4), fps, config: { damping: 16 } });
  const curseur = Math.floor(frame / 8) % 2 === 0;
  const largeur = v ? 820 : 1500;
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.vert} />
      <Zone format={format}>
        <Cadre format={format} largeur={largeur}>
          <div style={{ fontFamily: polices.texte, fontSize: v ? 32 : 26, color: '#ffffff99', letterSpacing: '0.2em', marginBottom: 18 }}>
            COMMENT APPELEZ-VOUS CE PRODUIT ?
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: couleurs.creme, borderRadius: 14, padding: v ? '26px 30px' : '24px 30px' }}>
            <span style={{ fontSize: v ? 50 : 44, color: couleurs.vert }}>⌕</span>
            <span style={{ fontFamily: polices.titre, fontWeight: 700, fontSize: v ? 72 : 54, color: couleurs.noir }}>
              {requete.slice(0, lettres)}
              <span style={{ opacity: curseur ? 1 : 0, color: couleurs.ocre }}>|</span>
            </span>
          </div>
          <div style={{ marginTop: 16, opacity: suggestion, transform: `translateY(${(1 - suggestion) * 20}px)`, background: '#ffffff12', border: `2px solid ${couleurs.or}`, borderRadius: 14, padding: v ? '24px 28px' : '20px 28px', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Img src={staticFile(`images/${demo.photo.fichier}`)} style={{ width: v ? 110 : 96, height: v ? 110 : 96, objectFit: 'cover', borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: polices.titre, fontWeight: 700, fontSize: v ? 50 : 40, color: couleurs.creme }}>{resultat}</div>
              <div style={{ fontFamily: polices.serif, fontStyle: 'italic', fontSize: v ? 36 : 28, color: '#ffffffa0' }}>{scientifique}</div>
            </div>
            <span style={{ fontSize: 44, color: couleurs.or }}>↗</span>
          </div>
        </Cadre>
      </Zone>
      <Eclair a={0} duree={4} />
    </AbsoluteFill>
  );
};

/** Cadre d'interface : navigateur en 16:9, téléphone en 9:16. */
const Cadre: React.FC<{ format: Format; largeur: number; children: React.ReactNode }> = ({ format, largeur, children }) => (
  <div style={{ width: largeur, borderRadius: format.vertical ? 44 : 22, background: '#121210', border: '2px solid #ffffff22', boxShadow: '0 40px 120px #000c, 0 0 0 1px #DFAE4322', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px', borderBottom: '1px solid #ffffff14' }}>
      {!format.vertical && ['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />)}
      <span style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: 26, color: couleurs.creme, marginLeft: format.vertical ? 0 : 16 }}>
        <span style={{ color: couleurs.ocre }}>✳ </span>AfroAtlas<span style={{ color: couleurs.ocre }}>.</span>
      </span>
    </div>
    <div style={{ padding: format.vertical ? 36 : 40 }}>{children}</div>
  </div>
);

// ───────────── DÉMO 2 : la fiche et ses autres noms ─────────────
export const SceneFiche: React.FC<
  Props & { produit: ProduitAffiche; noms: { nom: string; langue: string; a: number }[]; badge?: number }
> = ({ format, produit, noms, badge }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.vert} />
      <Zone format={format}>
        <Cadre format={format} largeur={v ? 840 : 1640}>
          <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? 26 : 44 }}>
            <Img src={staticFile(`images/${produit.photo.fichier}`)} style={{ width: v ? '100%' : 520, height: v ? 260 : 560, objectFit: 'cover', borderRadius: 16 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 62 : 72, color: couleurs.creme, lineHeight: 1.05 }}>{produit.titre}</div>
              <div style={{ fontFamily: polices.serif, fontStyle: 'italic', fontSize: v ? 38 : 40, color: '#ffffffa0', margin: '8px 0 22px' }}>{produit.scientifique}</div>
              <div style={{ fontFamily: polices.texte, fontSize: v ? 32 : 30, letterSpacing: '0.2em', color: couleurs.ocre, marginBottom: 14 }}>AUSSI APPELÉ</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {noms.map((n, k) => {
                  const s = spring({ frame: frame - n.a, fps, config: { damping: 14, stiffness: 170 } });
                  return (
                    <div key={k} style={{ opacity: s, transform: `scale(${0.6 + 0.4 * s})`, background: frame >= n.a && frame < n.a + 12 ? '#DFAE4333' : '#ffffff10', border: `2px solid ${frame >= n.a && frame < n.a + 12 ? couleurs.or : '#ffffff22'}`, borderRadius: 10, padding: v ? '12px 18px' : '12px 20px' }}>
                      <div style={{ fontFamily: polices.serif, fontWeight: 700, fontSize: v ? 54 : 52, color: couleurs.creme }}>{n.nom}</div>
                      <div style={{ fontFamily: polices.texte, fontSize: v ? 30 : 30, color: couleurs.or }}>{n.langue}</div>
                    </div>
                  );
                })}
              </div>
              {badge !== undefined && (
                <div style={{ marginTop: 26, opacity: interpolate(frame, [badge, badge + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
                  <BadgeSource taille={v ? 36 : 36} />
                </div>
              )}
            </div>
          </div>
        </Cadre>
        <Credit texte={`Photo : ${produit.photo.credit}`} y={creditY(format) - format.zoneScene.haut} />
      </Zone>
      <Eclair a={0} duree={4} />
    </AbsoluteFill>
  );
};

// ───────────── PREUVE : la source ─────────────
export const SceneSource: React.FC<
  Props & {
    source: { titre: string; editeur: string; emplacement: string };
    detail: { libelle: string; valeur: string };
    slogan: number;
  }
> = ({ format, source, detail, slogan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const zoom = spring({ frame, fps, config: { damping: 14 } });
  const panneau = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.or} />
      <Zone format={format}>
        {frame < slogan ? (
          <>
            <div style={{ transform: `scale(${0.6 + 0.6 * zoom})` }}>
              <BadgeSource taille={v ? 50 : 56} />
            </div>
            <div style={{ marginTop: v ? 60 : 50, width: v ? 840 : 1500, opacity: panneau, transform: `translateY(${(1 - panneau) * 40}px)`, background: '#16160f', borderLeft: `8px solid ${couleurs.or}`, borderRadius: 14, padding: v ? 36 : 40 }}>
              <Ligne libelle="Ouvrage" valeur={source.titre} v={v} />
              <Ligne libelle="Auteurs" valeur={source.editeur} v={v} />
              <Ligne libelle="Emplacement" valeur={source.emplacement} v={v} />
              <Ligne libelle={detail.libelle} valeur={detail.valeur} v={v} />
            </div>
          </>
        ) : (
          <TitreCinetique texte="Rien n'est inventé." a={slogan} taille={v ? 120 : 150} accent={['inventé.']} />
        )}
      </Zone>
      <Eclair a={slogan} />
    </AbsoluteFill>
  );
};
const Ligne: React.FC<{ libelle: string; valeur: string; v: boolean }> = ({ libelle, valeur, v }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontFamily: polices.texte, fontSize: v ? 28 : 28, letterSpacing: '0.2em', color: couleurs.or, textTransform: 'uppercase' }}>{libelle}</div>
    <div style={{ fontFamily: polices.titre, fontWeight: 700, fontSize: v ? 44 : 46, color: couleurs.creme, lineHeight: 1.2 }}>{valeur}</div>
  </div>
);

// ───────────── PREUVE : carte des 10 régions du Cameroun ─────────────
export const SceneCarte: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const v = format.vertical;
  const regions = data.cartes.cameroun;
  const documentees = regions.filter((r) => r.documentee);
  const pas = Math.max(3, Math.floor((durationInFrames * 0.6) / documentees.length));
  const taille = v ? 760 : 640;
  const allumees = documentees.filter((_, k) => frame >= 6 + k * pas).length;
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.vert} />
      <Zone format={format} style={{ flexDirection: v ? 'column' : 'row', gap: v ? 20 : 120 }}>
        <svg width={taille} height={taille} viewBox="0 0 1000 1000" style={{ overflow: 'visible' }}>
          {regions.map((r) => {
            const rang = documentees.indexOf(r);
            const allume = r.documentee && frame >= 6 + rang * pas;
            const eclat = allume ? interpolate(frame - (6 + rang * pas), [0, 8], [1, 0], { extrapolateRight: 'clamp' }) : 0;
            return (
              <path key={r.nom} d={r.d} fill={allume ? (eclat > 0.1 ? couleurs.or : couleurs.vertVif) : '#2b2b26'} stroke={couleurs.or} strokeWidth={3} strokeOpacity={0.8} />
            );
          })}
          {regions
            .filter((r) => !r.documentee)
            .map((r) => (
              <text key={r.nom} x={r.x} y={r.y} textAnchor="middle" fill={couleurs.creme} fontFamily="AfroText, Arial" fontSize={30} opacity={frame > 6 + documentees.length * pas ? 0.9 : 0}>
                à documenter
              </text>
            ))}
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 150 : 200, color: couleurs.or, lineHeight: 1 }}>
            {allumees}/{regions.length}
          </div>
          <div style={{ fontFamily: polices.texte, fontSize: v ? 40 : 42, color: couleurs.creme, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            régions documentées
          </div>
        </div>
      </Zone>
      <Credit texte={data.cartes.camerounCredit} y={creditY(format)} />
    </AbsoluteFill>
  );
};

// ───────────── PREUVE : chiffres réels ─────────────
export const SceneChiffres: React.FC<Props & { reperes: number[]; valeurs?: { valeur: number; libelle: string }[] }> = ({
  format,
  reperes,
  valeurs,
}) => {
  const v = format.vertical;
  const c = data.chiffres;
  const liste = valeurs || [
    { valeur: c.fiches, libelle: 'fiches' },
    { valeur: c.appellations, libelle: 'appellations' },
    { valeur: c.sources, libelle: 'sources' },
  ];
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.or} />
      <Zone format={format} style={{ flexDirection: v ? 'column' : 'row', gap: v ? (liste.length > 3 ? 30 : 70) : liste.length > 3 ? 80 : 140 }}>
        {liste.map((x, k) => (
          <Compteur key={x.libelle} valeur={x.valeur} libelle={x.libelle} a={reperes[k] ?? reperes[reperes.length - 1]} taille={liste.length > 3 ? (v ? 130 : 150) : v ? 170 : 190} />
        ))}
      </Zone>
      {reperes.map((r) => (
        <Eclair key={r} a={r} duree={4} />
      ))}
    </AbsoluteFill>
  );
};

// ───────────── USAGE : montrer la carte au vendeur ─────────────
export const SceneVendeur: React.FC<
  Props & { produit: ProduitAffiche; destination?: string; noms: { nom: string; detail: string }[]; titre?: string }
> = ({ format, produit, destination, noms, titre = 'Montrez la carte au vendeur.' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const s = spring({ frame, fps, config: { damping: 15 } });
  const tel = v ? { w: 660, h: 1000 } : { w: 420, h: 700 };
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.ocre} />
      <Zone format={format} style={{ flexDirection: 'row', gap: 120 }}>
        <div style={{ width: tel.w, height: tel.h, borderRadius: 56, border: '10px solid #2a2a26', background: couleurs.creme, overflow: 'hidden', transform: `translateY(${(1 - s) * 200}px) rotate(${(1 - s) * -6}deg)`, boxShadow: '0 40px 120px #000' }}>
          <Img src={staticFile(`images/${produit.photo.fichier}`)} style={{ width: '100%', height: tel.h * 0.36, objectFit: 'cover' }} />
          <div style={{ padding: v ? 34 : 26, color: couleurs.noir }}>
            <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 50 : 30, lineHeight: 1.1 }}>{produit.titre}</div>
            <div style={{ fontFamily: polices.texte, fontSize: v ? 34 : 21, margin: '12px 0 10px', color: couleurs.vert }}>Je cherche ce produit, dans cette forme.</div>
            {destination && (
              <div style={{ fontFamily: polices.texte, fontSize: v ? 30 : 19, color: '#667064', marginBottom: 10 }}>
                Destination : <b style={{ color: couleurs.noir }}>{destination}</b>
              </div>
            )}
            {noms.slice(0, 3).map((n) => (
              <div key={n.nom} style={{ borderTop: '1px solid #00000018', padding: v ? '14px 0' : '10px 0' }}>
                <div style={{ fontFamily: polices.serif, fontWeight: 700, fontSize: v ? 58 : 34, color: couleurs.ocre }}>{n.nom}</div>
                <div style={{ fontFamily: polices.texte, fontSize: v ? 30 : 19, color: '#667064' }}>{n.detail}</div>
              </div>
            ))}
          </div>
        </div>
        {!v && <TitreCinetique texte={titre} a={6} taille={96} accent={['vendeur.', 'connaît.']} style={{ maxWidth: 700, textAlign: 'left' }} />}
      </Zone>
      <Eclair a={0} duree={4} />
    </AbsoluteFill>
  );
};

// ───────────── EXTENSION : les autres pays d'Afrique ─────────────
// Chaque exemple (nom, pays, fiche) vient des données : un nom n'est montré que s'il est
// rattaché à ce pays par une source.
export const SceneAfrique: React.FC<
  Props & { exemples?: (typeof data.ailleurs[number] & { a: number })[]; compteur?: number }
> = ({ format, exemples = [], compteur = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = format.vertical;
  const pays = data.cartes.afrique;
  const taille = v ? 700 : 660;
  const zoom = interpolate(frame, [0, 30], [1.6, 1], { extrapolateRight: 'clamp' });
  const i = plan(frame, exemples.map((e) => e.a));
  const courant = i >= 0 && frame < compteur ? exemples[i] : undefined;
  const afficheCompteur = frame >= compteur;
  const s = spring({ frame: frame - (courant ? courant.a : compteur), fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.or} />
      <Zone format={format} style={{ flexDirection: v ? 'column' : 'row', gap: v ? 10 : 100 }}>
        <svg width={taille} height={taille} viewBox="0 0 1000 1000" style={{ transform: `scale(${zoom})`, flexShrink: 0 }}>
          {pays.map((p) => {
            const actif = courant?.iso === p.iso;
            const deja = exemples.some((e, k) => e.iso === p.iso && k <= i);
            const fond = actif ? couleurs.or : p.documente && (afficheCompteur || deja) ? '#9c7a2f' : p.documente ? '#3a3527' : '#22221c';
            return <path key={p.iso} d={p.d} fill={p.iso === 'CMR' ? couleurs.vertVif : fond} stroke="#0B0B0A" strokeWidth={2} />;
          })}
        </svg>
        <div style={{ textAlign: 'center', minWidth: v ? 0 : 640, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
          {courant ? (
            <>
              <div style={{ fontFamily: polices.texte, fontSize: v ? 40 : 40, letterSpacing: '0.25em', color: couleurs.or, textTransform: 'uppercase' }}>{courant.pays}</div>
              <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 140 : 150, color: couleurs.creme, lineHeight: 1.05 }}>{courant.nom}</div>
              <div style={{ fontFamily: polices.texte, fontSize: v ? 32 : 30, color: '#ffffffb0', marginTop: 8 }}>Fiche : {courant.produit}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 160 : 210, color: couleurs.or, lineHeight: 1 }}>{data.chiffres.pays}</div>
              <div style={{ fontFamily: polices.texte, fontSize: v ? 40 : 42, color: couleurs.creme, letterSpacing: '0.15em', textTransform: 'uppercase' }}>pays déjà documentés</div>
            </>
          )}
        </div>
      </Zone>
      {exemples.map((e) => (
        <Eclair key={e.a} a={e.a} duree={4} />
      ))}
      <Credit texte={data.cartes.afriqueCredit} y={creditY(format)} />
    </AbsoluteFill>
  );
};

// ───────────── APPEL À L'ACTION ─────────────
export const SceneAppel: React.FC<Props & { adresse: string; compte?: string; secondaire?: string }> = ({
  format,
  adresse,
  compte,
  secondaire,
}) => {
  const frame = useCurrentFrame();
  const v = format.vertical;
  const pulse = 1 + Math.sin(frame / 6) * 0.03;
  return (
    <AbsoluteFill>
      <Fond teinte={couleurs.or} />
      <Zone format={format}>
        <Logo taille={v ? 110 : 120} />
        <div style={{ height: 30 }} />
        <TitreCinetique texte="Un produit, plusieurs noms. Retrouvez le vôtre." a={4} taille={v ? 72 : 76} accent={['vôtre.']} pas={2} style={{ maxWidth: v ? 840 : 1400 }} />
        <div style={{ marginTop: 36, fontFamily: polices.texte, fontSize: v ? 34 : 36, color: couleurs.creme, opacity: 0.85 }}>{adresse}</div>
        <div style={{ marginTop: 34, transform: `scale(${pulse})`, background: couleurs.or, color: couleurs.noir, fontFamily: polices.titre, fontWeight: 900, fontSize: v ? 58 : 54, padding: v ? '22px 48px' : '20px 52px', borderRadius: 999 }}>
          {format.appel}
        </div>
        {secondaire && <div style={{ marginTop: 26, fontFamily: polices.titre, fontWeight: 700, fontSize: v ? 44 : 40, color: couleurs.or }}>{secondaire}</div>}
        {compte && <div style={{ marginTop: 20, fontFamily: polices.texte, fontSize: v ? 36 : 34, color: couleurs.creme }}>{compte}</div>}
      </Zone>
      <Eclair a={0} duree={8} />
    </AbsoluteFill>
  );
};

export { safou };
