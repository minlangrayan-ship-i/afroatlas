# Vérifications du 4 octobre 2026

- `npm run check` : 0 erreur, avertissement ou hint.
- `npm test` : 20 tests réussis. Recherche exacte/normalisée/approximative, filtres, absence d’attribution géographique par langue, stockage local ; validation des propositions/fichiers, fusion des noms/produits/photos acceptés dans le catalogue, recherche arabe et filtres de contenu accepté.
- Les tests de base utilisent **PGlite, véritable moteur PostgreSQL**, avec schémas Auth/Storage de test : migration exécutée, propositions/photos privées inaccessibles aux visiteurs, non-propriétaire refusé, édition sans publication, acceptation atomique avec historique, refus sans publication, limitation de fréquence. Cela vérifie le SQL, pas un service Supabase distant.
- `npm run check:backend` : deux fonctions Edge contrôlées par Deno ; 3 tests réussis sur signatures JPEG/PNG/WebP, rejet d’un SVG renommé, transfert multipart des octets, et rejet d’un corps trop volumineux sans Content-Length.
- `npm run build` : 87 pages, dont 50 fiches et 23 pays.
- `node scripts/check-output.mjs` : href/src locaux valides dans les 87 pages, sous `/afroatlas/`.
- Playwright sur Edge Chromium : **11 parcours réussis**, largeurs 390/768/1440 px, navigation/recherche, clavier, zoom/Échap, URL/retour arrière, favoris/comparaison, régions, copie, références et mouvement réduit.
- Nouveaux contrôles navigateur : Mali/Burkina Faso/Niger/Nigeria sur carte, pages et formulaire ; Niger/Nigeria distingués dans la recherche ; FR/EN/AR, RTL, champs mixtes, noms arabes et locaux préservés, changement de langue des composants sans erreur d’hydratation ; valeurs canoniques des filtres conservées en arabe/anglais ; liens internes transportant la langue ; curcuma en poudre, crédits et lacunes photo ; contexte de Rabat et limites historiques du Mali ; contact mailto, absence de résultat avec accès contribution, modération désactivée honnêtement sans backend.
- Photographies : sélection de 32 formes alimentaires/vente, planches-contact examinées ; images de plantes, poissons vivants/spécimens ou espèces incertaines exclues du rôle principal. 18 lacunes affichées. Métadonnées/crédits/licences conservés ; aucune image générée.
- Consultation sans configuration Supabase : aucune requête API externe ni console bloquante sur les types de pages testés. Aucun traceur ou réseau publicitaire.

## Vérification non réalisable sans accès

Le propriétaire a confirmé qu’il n’a pas encore de projet Supabase et a demandé sa préparation. **Aucun envoi durable distant, connexion propriétaire distante, téléversement Supabase ou acceptation distante n’a été testé avec succès.** Le frontend désactive l’envoi. Le guide SUPABASE_SETUP.md précise la création du projet, la migration, le compte propriétaire, les secrets serveur, les variables publiques GitHub et le parcours réseau indispensable après activation.

Les tests ne constituent pas un audit exhaustif WCAG, une validation culturelle humaine ou une mesure des performances de terrain. Les textes documentaires détaillés et les lacunes de noms/photos restent décrits dans DATA_QUALITY.md et CONTENT_BACKLOG.md.

Publication vérifiée : https://minlangrayan-ship-i.github.io/afroatlas/. Le workflow du commit `43f886a` a réussi. Les 11 parcours ont également été vérifiés sur cette adresse publique ; le contrôle des crédits photo attend effectivement le chargement de l’image avant de conclure. Pays, arabe, recherche, email et état fermé des contributions fonctionnent en ligne.
