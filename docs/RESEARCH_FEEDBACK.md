# Enrichissement documentaire — 4 octobre 2026

Le catalogue passe de 50 à 68 fiches et de 23 à 25 pays africains. Gabon et Guinée équatoriale sont ajoutés ; le Kenya, le Niger et le Nigeria sont conservés avec leurs identifiants distincts. Les identifiants et URL des anciennes fiches sont préservés.

## Contenu ajouté

18 fiches : waterleaf, pèbè, rondelle, quatre côtés, maniguette, poivre sauvage, poivre d’Éthiopie, managu, amarantes alimentaires, saga, feuilles de niébé, feuilles de manioc, sukuma wiki (feuilles), macabo, maïs, arachide, igname Dioscorea alata et boisson de foléré.

Quatre fiches existantes sont précisées : épinard classique, calices d’hibiscus, feuilles de foléré et eru. Les calices, feuilles et boisson ont des identités séparées et des relations explicites. Les noms kenyan managu et terere désignent des groupes alimentaires : aucune espèce unique n’est inventée. Les observations de Korhogo (1999), Malabo et du district de Suba sont situées, sans extension automatique à tout le pays.

Les références et localisations des preuves sont enregistrées dans chaque assertion. L’inventaire détaillé est dans [feedback-inventory.json](../data/research/feedback-inventory.json). Une source accessible publiquement n’est pas nécessairement sous licence ouverte. Les contenus sont des résumés originaux ; les références originales restent consultables. La revue est documentaire et assistée par IA, sans expertise botanique sur spécimen.

## Photographies

La photographie principale d’épinard, dont la légende ne confirmait pas l’espèce, est écartée sans suppression du fichier ni réattribution au waterleaf. Une photographie identifiée de Spinacia oleracea la remplace. Une photographie de graines de Monodora myristica illustre le pèbè. Toutes deux proviennent de Wikimedia Commons, sont inspectées visuellement et publiées localement en WebP avec crédit et licence CC BY-SA 4.0. La photographie existante des calices d’hibiscus est conservée après contrôle de la forme. Les nouveaux produits sans photographie fiable affichent un emplacement neutre ; aucune image générée n’est utilisée.

## Incertitudes et lacunes

« Wataleaf » est une variante de saisie transmise par le propriétaire, pas une appellation traditionnelle attestée. « Muse » et « masso » ne sont associés à aucune espèce : une recette, une communauté linguistique ou une photographie contextualisée serait nécessaire. Les pistes « country onion » et « prekese » restent à corroborer. Le groupe plantain nécessite une fiche documentée. Les équivalences nététou / dawadawa / iru ne sont pas ajoutées sans vérifier matière première et procédé ; la fiche soumbala existante est conservée.

Précision du propriétaire reçue le 4 octobre : « bisap » est le contexte de recette indiqué pour « muse » et « masso ». Il s’agit d’une piste orale, insuffisante pour déterminer si ces termes désignent un ingrédient, une variété ou une préparation. Aucune correspondance botanique n’est ajoutée à partir de cette seule précision.

Les fiches existantes de gingembre, curcuma, njansang, ndolé, gombo, jute, manioc, taro, niébé et autres produits sont conservées. Leur conservation ne constitue pas une nouvelle validation exhaustive de toutes leurs assertions. L’enrichissement régional du Maroc, du Sénégal et du Mali reste limité aux éléments déjà documentés ; cette passe apporte surtout des références camerounaises et kenyanes, et un contexte ivoirien précisément situé.

Le rapport CTFC a répondu 403 et n’est pas utilisé comme preuve. L’Atlas RSD n’a pu être consulté que par ses extraits indexés ; le PDF complet reste à consulter. Certaines publications ont un accès partiel, indiqué dans l’inventaire. La bibliothèque ne revendique ni exhaustivité ni validation scientifique indépendante.

## Maintenance et limites de service

Après une réimportation des données initiales, exécuter `node scripts/enrich-user-feedback.mjs`, puis `npm run prepare-data`. La migration est idempotente. Les sources, images originales et anciennes références sont conservées.

Les contributions et la modération restent en attente de configuration du projet Supabase : aucun envoi réel ni publication automatique n’est simulé. Le suivi Cloudflare existant est conservé. Le dépôt demeure public ; le frontend est consultable et copiable.

## Vérifications de cette livraison

26 tests automatisés de données et de recherche, 12 parcours navigateur (mobile, tablette, bureau, FR/EN/AR et RTL), contrôle de types Astro sans diagnostic, génération de 107 pages et contrôle de publication réussis. Les parcours couvrent les nouveaux pays sur la carte, les trois formes de foléré, Wataleaf, les photos chargées, les noms incertains, les filtres, les favoris, le comparateur, les crédits et les liens email. Les contributions désactivées sont testées comme telles ; aucun test d’envoi réel Supabase n’est revendiqué.
