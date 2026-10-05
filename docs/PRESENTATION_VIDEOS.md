# Présentation en français, anglais et arabe

Les deux fichiers fournis dans les téléchargements, `AfroAtlas_Presentation_EN.mp4` et `AfroAtlas_Presentation_AR.mp4`, sont copiés sans modification dans `public/assets/video/`, sous les noms `afroatlas-presentation-en.mp4` et `afroatlas-presentation-ar.mp4`. La version française existante est conservée. Les empreintes SHA-256 vérifiées et les métadonnées sont enregistrées dans `data/research/presentation-video-versions.json`.

Les trois versions durent 77 secondes, avec une résolution de 1 280 × 720 et les codecs H.264/AAC. Les aperçus anglais et arabe sont des images extraites de chaque film à 0,5 seconde, converties en WebP ; aucune image de substitution n’est générée.

`PresentationMedia.astro` utilise la langue courante de l’interface, le paramètre `?lang=en` / `?lang=ar` et la préférence locale mémorisée. Le lecteur, son aperçu, le lien MP4 et l’aperçu de l’accueil suivent cette langue. Lors d’un changement de langue, le film précédent est arrêté et la nouvelle version repart en pause, au début ; volume, sourdine et vitesse de lecture sont conservés. Sélectionner la langue déjà active conserve la lecture.

Les fichiers MP4 ne sont pas préchargés sur l’accueil, et le lecteur reste sans autoplay avec `preload="none"` et `playsinline`. Les sous-titres français existants restent associés exclusivement au film français. Les versions anglaise et arabe conservent leurs textes intégrés à l’image ; aucune piste française n’est proposée pour ces films.

Vérifications : empreintes identiques aux originaux, lecture réelle des versions anglaise et arabe dans le navigateur mobile, sélection par URL et bouton, changement de langue pendant la lecture, retour à la piste française, maintien de la préférence après navigation et absence de téléchargement MP4 sur l’accueil. Les tests existants de vidéo française, de responsive, de recherche et de SEO sont conservés.
