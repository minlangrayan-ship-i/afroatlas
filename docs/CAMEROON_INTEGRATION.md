# Intégration du corpus camerounais — 5 octobre 2026

Le corpus texte fourni par le propriétaire est conservé intégralement dans `data/research/cameroon-source.txt`, avec son empreinte SHA-256 dans l’inventaire structuré. Son original sur le disque n’est pas modifié. Le guide fourni décrit un autre projet autonome ; l’intégration adapte les données au site Astro existant, sans installer un nouveau serveur Prisma/PostgreSQL ni remplacer son hébergement.

## Bilan

- 35 identités du corpus reliées au site : 25 nouvelles fiches et 10 fiches existantes enrichies, soit 93 fiches au total.
- 110 couples nom/langue distincts, 116 usages documentaires et 20 références importés. Un même nom/langue peut désigner plusieurs identités : il ne faut pas confondre ce chiffre avec le nombre d’assertions nom-produit.
- 9 liens de présence/production enregistrés séparément ; aucun nom régional n’en est déduit.
- Les 10 régions et leurs identifiants existants sont conservés. Les attestations locales restent limitées aux régions ou localités fournies ; les langues ne servent pas à deviner une région.
- Les noms de l’aire historique « Nord Cameroun (1954) » restent hors des régions actuelles, dans une section dédiée.

L’inventaire complet, ses preuves et la table de correspondance entre identifiants sont dans `data/research/cameroon-corpus.json`, également disponible sur le site via `/data/cameroon-corpus.json`. La migration `node scripts/integrate-cameroon.mjs` est reproductible et idempotente. Après une réimportation initiale, exécuter d’abord `node scripts/enrich-user-feedback.mjs`, puis cette migration et `npm run prepare-data`.

## Identités et affichage

Les fiches existantes de tilapia du Nil, sardinelle plate, njansang, eru, foléré-boisson, manioc, oignon, patate douce, niébé et tamarin sont réutilisées. Aucune URL existante n’est supprimée. Les noms de Monodora, Ricinodendron, Hibiscus, maïs et baobab en tant que plantes disposent de profils séparés des graines, calices, feuilles ou poudres. Kpem est une préparation, pas un synonyme des feuilles de manioc.

Les deux identités nommées « silure » restent distinctes ; les maquereaux et courbines restent des groupes commerciaux. « Njama njama » identifie ici des feuilles de Solanum scabrum, sans fusion avec tout le groupe managu ni avec les baies de Vaccinium.

Les graphies scientifiques historiques restent dans l’original. Pour les rapprochements avec des fiches existantes, `Sardinella madarensis` est relié à la sardinelle plate déjà identifiée comme `Sardinella maderensis`, `Ipomea batatas` à `Ipomoea batatas`, et la graphie `Gnetum bucholzianum` n’écrase pas `Gnetum buchholzianum`. Les autres taxons du corpus ne sont pas déclarés révisés selon une nomenclature actuelle.

Les labels linguistiques fournis sont conservés. Quand aucun code linguistique vérifié n’est disponible, le filtre utilise un identifiant interne `cm-language-*`, sans l’afficher comme code ISO ni l’utiliser comme attribut de langue HTML. Seules les appellations attestées sont ajoutées ; aucune traduction française, anglaise ou arabe n’est inventée.

## Provenance, droits et limites

Les statuts `verified` du document deviennent `documented` dans le site. Les preuves importées n’ont aucun nouveau nom de validateur ni date de contrôle indépendant : cette livraison ne prétend pas avoir relu et expertisé chaque référence. Les accès partiels, les extraits d’index, les sources historiques et les licences incertaines restent visibles.

Le catalogue CEMAC fournit des intitulés français et des correspondances de cultures, sans enquête d’appellations régionales. Les noms de basilic issus d’une étude médicinale ne prouvent pas une recette et ne donnent lieu à aucun conseil médical. Les liens de preuve OMPI restent référencés avec leurs restrictions ; aucun PDF de source n’est redistribué. Les visites web de contrôle ont confirmé l’accès au catalogue FAO et aux métadonnées WorldFish ; certaines tentatives de lecture supplémentaire ont répondu 403 ou expiré. Elles ne sont pas présentées comme une consultation complète réussie.

Aucune photographie incertaine ou générée n’est ajoutée. Les photos existantes sont conservées ; les nouvelles fiches sans média approprié affichent un emplacement neutre. Les zones sans preuve régionale et les entrées en attente, notamment masso, restent signalées sans équivalence inventée.

Les contributions et la modération restent en attente de configuration Supabase. Les nouveaux champs sont optionnels dans le schéma statique ; aucune migration SQL du guide autonome n’est requise pour les publier sur GitHub Pages. Les catégories sont acceptées de manière cohérente par le frontend et la validation serveur préparée.

## Vérifications

35 tests de données et de recherche, 3 tests de validation serveur et 13 parcours navigateur réussis. Contrôle Astro : zéro erreur, avertissement ou remarque. Build : 132 pages statiques. La réimportation du corpus produit des fichiers identiques octet pour octet ; tous les identifiants et URL des fiches précédentes sont conservés.

Les parcours couvrent les noms régionaux, les deux silures, les filtres de langue et de pays, les attestations historiques, les favoris, le comparateur, les photos existantes, les liens email et les trois langues d’interface. Vérification visuelle représentative sur mobile et bureau, y compris Kpem en arabe. Les visites françaises et les autres navigations conservent le script Cloudflare existant. Les tests ne constituent ni une expertise botanique complète, ni un test d’envoi réel vers un service Supabase configuré.
