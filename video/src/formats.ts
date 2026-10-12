// Paramètres de chaque format : taille, zones sûres, échelle typographique, place des sous-titres.
export type NomFormat = 'youtube' | 'tiktok' | 'reels';

export type Format = {
  nom: NomFormat;
  largeur: number;
  hauteur: number;
  vertical: boolean;
  /** Marges de sécurité (px) : rien d'important ne doit les franchir. */
  sur: { haut: number; bas: number; gauche: number; droite: number };
  /** Facteur appliqué aux tailles de texte des scènes. */
  echelle: number;
  /** Centre vertical des sous-titres mot par mot (px). */
  sousTitresY: number;
  /** Hauteur réservée aux scènes, entre la marge haute et les sous-titres. */
  zoneScene: { haut: number; bas: number };
  appel: string;
};

export const formats: Record<NomFormat, Format> = {
  youtube: {
    nom: 'youtube',
    largeur: 1920,
    hauteur: 1080,
    vertical: false,
    sur: { haut: 80, bas: 90, gauche: 120, droite: 120 },
    echelle: 1,
    sousTitresY: 930,
    zoneScene: { haut: 80, bas: 820 },
    appel: 'Abonnez-vous',
  },
  // 9:16 : texte important à ≥ 250 px du haut, ≥ 400 px du bas, ≥ 120 px du bord droit
  // (interfaces TikTok / Instagram). Même marge à gauche pour garder la composition centrée.
  tiktok: {
    nom: 'tiktok',
    largeur: 1080,
    hauteur: 1920,
    vertical: true,
    sur: { haut: 250, bas: 400, gauche: 120, droite: 120 },
    echelle: 1.05,
    sousTitresY: 1390,
    zoneScene: { haut: 250, bas: 1270 },
    appel: 'Lien en bio',
  },
  reels: {
    nom: 'reels',
    largeur: 1080,
    hauteur: 1920,
    vertical: true,
    sur: { haut: 250, bas: 400, gauche: 120, droite: 120 },
    echelle: 1.05,
    sousTitresY: 1390,
    zoneScene: { haut: 250, bas: 1270 },
    appel: 'Lien en bio',
  },
};

export const FPS = 30;
