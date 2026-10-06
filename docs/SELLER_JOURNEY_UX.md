# Parcours de recherche et présentation au vendeur — 6 octobre 2026

## Problèmes reproduits sur la publication précédente

La recherche `foléré` / `folere` retrouvait quatre fiches, sans choix explicite de partie et de forme. Les calices ne possédaient pas d’appellation sénégalaise sourcée, alors qu’un contexte d’usage, plus bas, décrivait une boisson appelée bissap. Les filtres proposaient Bassa, Douala, Ewondo et Fang deux fois, ainsi que `la` sans libellé. Les calices exposaient `labels.fr.value`, `aliases.fr[0].value` et `Uses`. La boisson était classée parmi les légumes. Les emplacements publicitaires vides restaient affichés.

La reproduction dans Edge à 390 px est conservée localement dans `.runtime/seller-journey-before.json` et les captures `seller-journey-before-*.png`.

## Modifications

- Choix photographiques explicites : calices séchés pour infusion, feuilles alimentaires, boisson préparée, plante entière ; gombo frais et gombo en poudre. Une photographie complémentaire reste identifiée comme telle.
- Pays de l’interlocuteur, région et langue conservés dans les liens de cartes **et** d’autocomplétion. Retour aux résultats avec les paramètres précédents. Filtres avancés repliés sur téléphone, dépliés sur grand écran.
- Résultat contextuel placé avant les détails documentaires ; noms courants de secours limités à un nom documenté par langue principale. Aucun alias sans géographie n’est promu au rang d’appellation locale.
- Explication près du résultat des calices au Sénégal : la preuve concerne le nom de la boisson, pas le nom de vente des calices. Lien vers la source déjà présente ; aucune nouvelle assertion créée.
- Vue « Montrer au vendeur » : grande photo de la forme lorsqu’elle existe, nom saisi, destination, partie et forme, noms documentés, phrase courte, absence de nom local explicitée. Dialogue natif, fermeture avec Échap, focus rendu au bouton, sans tableau volumineux.
- Appellations détaillées, usages, sources, crédits et limites dépliables, présents dans le HTML pour l’indexation et la consultation sans JavaScript.
- Libellés publics des pointeurs documentaires et des groupes alimentaires ; chemins originaux intacts dans les données. Distinction entre nom contextualisé, alias linguistique sans géographie, nom scientifique, variante de saisie et validation éditoriale humaine.
- Fusion de cinq correspondances explicites entre identifiants camerounais et codes : Bassa/bas, Douala/dua, Ewondo/ewo, Fang/fan, Boulou/bum. Bakoko, Baka, Bakossi et les autres distinctions restent séparés. `la` désigne les noms scientifiques latins d’Aloe vera et Senna italica.
- Options triées selon FR/EN/AR ; noms camerounais traduits dans la navigation et les formulaires sans modifier leurs identifiants. Langues proposées seulement lorsque les assertions établissent le pays et la région sélectionnés. Changement de contexte : sélections incompatibles effacées.
- Boisson au foléré déplacée dans « Préparations & boissons ». L’autre préparation, Kpem, était déjà correctement classée. Aucune recatégorisation massive ; la correction est maintenue lors de la préparation des données.
- Aucune publicité vide rendue. La configuration conserve les emplacements : activation globale, campagne activée, libellé partenaire et URL HTTPS indispensables. Toute annonce activée porte « Publicité ». Contact partenaire conservé.

## Fichiers principaux

`src/lib/presentation.ts`, `search.ts`, `destination.ts`, `i18n.ts`, `advertising.ts` ; `src/components/Catalog.tsx`, `SearchBox.tsx`, `DestinationPicker.tsx`, `ShopCard.tsx`, `NamesTable.tsx`, `Regions.tsx`, `ProductCard.tsx`, `AdSlot.astro` ; `src/pages/produits/[slug].astro`, `index.astro`, `src/styles/global.css`, `scripts/prepare-data.mjs`. Une seule catégorie modifiée dans les instantanés du catalogue ; assertions, preuves, licences, URL de fiches et paramètres préservés.

## Vérifications

- 77 tests unitaires, dont six tests ciblés sur le nouveau parcours.
- Suite complète Playwright : 28 tests réussis. Recherche avec accents, formes, Sénégal, réinitialisation pays/région/langue, autocomplétion, clavier, dialogue et retour du focus, mobile, FR/EN/AR et RTL, favoris, comparaison, contributions et trois vidéos.
- `astro check` sans erreur, avertissement ou indication ; vérification de format Prettier. Aucun script lint distinct n’est défini dans le dépôt.
- Compilation statique : 144 pages. Avertissement CSP préexistant sur les directives de styles ; les parcours testés ne présentent pas d’erreur de navigateur.
- Audit SEO : 144 pages contrôlées, 121 pages indexables et 121 URL dans le sitemap ; titres/descriptions uniques, URL canoniques sans paramètres, une balise H1 et un beacon par page. Base `/afroatlas/` conservée.
- Scan des textes HTML des 144 pages, y compris les détails repliés : aucune occurrence des fuites ciblées `aliases.*.value`, `labels.*.value`, `commercial_group` ou `Uses` dans l’interface française.
- Contrôle de publication : aucun secret reconnu, source map publique ou implémentation serveur dans les artefacts frontend. Ce contrôle heuristique ne garantit pas la détection de tous les secrets possibles.

Captures locales FR/EN/AR : `.runtime/seller-preview/search-*.png`, `product-*.png`, `seller-*.png`. Les fichiers `.runtime` ne sont pas publiés dans le dépôt.

Version mise en ligne sur GitHub Pages et contrôlée le 6 octobre 2026 : les trois nouveaux tests de parcours passent aussi sur l’URL publique, avec les photos réellement chargées, la vue vendeur raccourcie, le retour du focus, les paramètres conservés, les filtres, FR/EN/AR, les favoris et la comparaison. Le contrôle des images attend leur chargement après défilement, conformément à leur chargement différé. Neuf captures de la publication sont conservées localement. Les contrôles GitHub du frontend, du backend préparé et du déploiement ont réussi.

## Limites documentaires

Le corpus reste composé de 95 fiches et 1 035 assertions de noms, toutes au statut documenté. Aucun import n’a été converti en validation humaine. Une preuve supplémentaire, spécifique aux calices et au contexte local sénégalais, est nécessaire pour afficher un nom de vente attesté. Les assertions camerounaises ne permettent pas d’attribuer automatiquement l’ewondo à la région Centre.

14 formes commerciales utilisent encore des photographies complémentaires explicitement signalées ; une photo de feuilles alimentaires d’hibiscus isolées reste notamment à documenter. Les traductions de l’interface ne remplacent pas les noms locaux ni les textes documentaires dans leur langue d’origine. L’absence de données ne signifie pas l’absence du produit ou de son usage.
