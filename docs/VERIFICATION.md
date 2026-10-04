# Vérifications effectuées le 4 octobre 2026

- `npm run check` : 0 erreur, 0 avertissement, 0 hint.
- `npm test` : 11 tests réussis, recherche exacte/normalisée/approximative, homonymes, combinaisons de filtres, absence de preuve géographique, absence de lien commercial implicite, contributions et stockage local dégradé.
- `npm run build` : 70 pages statiques générées, dont 40 fiches et 20 pays.
- `scripts/check-output.mjs` : href/src locaux des 70 pages valides sous `/afroatlas/`.
- Playwright : 7 parcours réussis dans Edge Chromium installé, sur le build statique. Affichage 390, 768 et 1440 px, pas de débordement horizontal ni erreur bloquante de console sur les types de pages testés. Aucune requête étrangère à l’origine du site pendant la consultation.
- Parcours : autocomplétion au clavier, photo chargée, zoom et Échap, URL des filtres et retour arrière, candidats « piment » distincts, favoris persistants, comparaison, 20 pays / 5 contextes, sélection de région et rechargement, copie de nom, brouillon puis export JSON sans prétendre un envoi, références séparées et mouvement réduit.
- Photographies : planche-contact des 46 premières P18 examinée ; six illustrations mises hors publication ; 40 photos conservées avec crédit et licence.

Ces contrôles ne constituent pas un audit exhaustif WCAG 2.2 AA ni une validation culturelle des noms. Aucune mesure de terrain LCP/CLS/INP ni aucun score Lighthouse n’est annoncé. Les nommages régionaux, usages alimentaires et rapprochements commerciaux demandent un travail éditorial supplémentaire décrit dans DATA_QUALITY.md.

Les tests sont rejouables dans `tests/`. L’accès public doit être contrôlé après chaque déploiement, distinctement du build local.
