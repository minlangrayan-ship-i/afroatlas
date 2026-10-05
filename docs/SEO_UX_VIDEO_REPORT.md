# AfroAtlas — SEO, parcours vendeur, sécurité et présentation vidéo

Audit et implémentation du 5 octobre 2026. Le nom officiel vérifié dans `src/data/site.ts` est **AfroAtlas**.

Site : https://minlangrayan-ship-i.github.io/afroatlas/

Vidéo : https://minlangrayan-ship-i.github.io/afroatlas/presentation/

## Architecture et limites de l’environnement

Le projet existant utilise Astro 7, React 19, TypeScript, Tailwind, Motion, Fuse.js et Zod, avec un frontend statique publié sur GitHub Pages. Les 93 fiches reposent sur des instantanés JSON sourcés. Les migrations et fonctions Supabase existaient comme préparation d’un service de contribution ; aucun projet Supabase n’est encore connecté et aucune variable publique de connexion n’est renseignée.

La présence de PostgreSQL sur le PC ne constitue pas une connexion du site à une base hébergée. Cette livraison n’a ni créé une base de production, ni envoyé un email réel. Les migrations ont été exécutées dans PostgreSQL local via PGlite pour tester la réception, les politiques d’accès et la modération. Les appels au fournisseur email ont été simulés dans les tests.

Les sources initiales ont été conservées dans l’historique Git et dans une sauvegarde Git complète hors du dépôt avant intervention. Les photographies antérieures, identifiants, appellations, preuves, relations et URL des produits restent conservés. L’ancien composant de contribution reste dans les sources ; la page publique utilise désormais `ContributionForm.tsx`.

## Changements livrés

| Sujet                         | Avant                                             | Après                                                                                                                                        |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Recherche                     | Noms, filtres et rapprochements approchants       | Apostrophes normalisées séparément, noms de langues recherchables, priorité exact / alias / préfixe / approchant, temporisation de 120 ms    |
| Communication avec un vendeur | Table d’appellations générale                     | Pays de l’interlocuteur, région et langue facultatives ; contexte transmis dans le lien de la fiche ; carte mobile à montrer au vendeur      |
| Précision géographique        | Consultation des contextes existants              | Les noms propres à une région sont proposés uniquement pour cette région ; aucune déduction depuis la localisation du visiteur ou une langue |
| Photographies principales     | 33 produits illustrés sur 93                      | 42 sur 93 ; neuf photos supplémentaires contrôlées, provenance et métadonnées enrichies                                                      |
| Architecture éditoriale       | Fiches et exploration existantes                  | Sept pages de catégorie avec contenu HTML réel ; liens HTML depuis l’accueil et les fiches ; fil d’Ariane                                    |
| SEO                           | Sitemap général et métadonnées parfois génériques | 116 URL retenues, titres et descriptions distincts, canonical absolues sans paramètres, pages utilitaires et pays vides en `noindex`         |
| Données structurées           | Absence de balisage documentaire commun           | `WebSite`, `BreadcrumbList` et `DefinedTerm`, sans prix, avis, note ou offre inventés                                                        |
| Catalogue sur mobile          | Toutes les fiches affichées simultanément         | 24 cartes au départ puis affichage par lots ; les 93 fiches restent accessibles par catégorie et sitemap                                     |
| Contribution                  | Formulaire étendu                                 | Trois intentions, détails facultatifs repliés, produit et identifiant préremplis, email personnel facultatif, aperçu photo                   |
| Notifications                 | Aucune intégration email                          | File privée durable, identifiant de réception, reprise après échec, déduplication, états fournisseur / livraison séparés                     |
| Sécurité frontend             | Minification et absence de source maps            | Contrôles conservés, CSP avec hashes pour les scripts, referrer limité, vérification des fichiers de publication                             |
| Présentation vidéo            | Fichier local uniquement                          | Page avec lecteur natif, commandes, affiche optimisée, texte d’accompagnement et piste reprenant le texte à l’écran                          |

Les contrôles de destination et l’ouverture de la carte restent désactivés jusqu’à la connexion de leurs gestionnaires JavaScript. Cela corrige un choix de pays qui pouvait être perdu pendant l’hydratation. Le contenu documentaire reste visible dans le HTML initial.

### Appellations et ambiguïtés

Le nom recherché reste affiché sur la carte. Une sélection sans preuve régionale affiche une absence explicite et propose les noms courants connus, sans les présenter comme attestés dans cette destination. Les appellations locales conservent leur orthographe et leurs sources. Les nouvelles appellations acceptées par le propriétaire conservent également un lien vers leur preuve.

Foléré, feuilles, calices, boisson et plante restent distincts. La recherche peut retourner plusieurs entrées ; elle ne fusionne pas leurs identités. « Muse » et « masso » restent sans équivalence affirmée faute de preuve suffisante. Une correspondance approchante demande de confirmer l’identité sur la fiche.

L’interface conserve FR / EN / AR et le RTL. Les noms alimentaires ne sont pas inventés pour compléter une traduction manquante. Les pages prérendues restent françaises, avec traduction de l’interface côté client : **aucun `hreflang` n’est ajouté**, puisque de véritables routes éditoriales traduites ne sont pas encore disponibles. Le texte documentaire et la vidéo fournie restent dans leur langue originale.

## Photographies : bilan vérifiable

- **93 produits examinés** ; recherche et couverture enregistrées pour chaque produit.
- **42 produits illustrés** par une photo principale de leur forme, contrôlée visuellement et créditée.
- **9 nouvelles photos principales**, en WebP 400 / 960, ajoutées sans suppression des photographies antérieures.
- **51 produits sans photo principale fiable**, conservant un emplacement explicite.

| Produit           | Forme et partie représentées                                                             |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Muscade           | Graines / noix                                                                           |
| Maniguette        | Graines                                                                                  |
| Poivre sauvage    | Fruits séchés                                                                            |
| Poivre d’Éthiopie | Fruits séchés                                                                            |
| Macabo            | Cormes et cormelles récoltés                                                             |
| Maïs              | Épi et grains détachés ; cultivar illustratif, sans généralisation à toutes les variétés |
| Arachide          | Graines décortiquées                                                                     |
| Igname alata      | Tubercule partiellement coupé, illustration documentée de l’espèce                       |
| Manioc            | Racines récoltées                                                                        |

Une image intitulée « Bissap au Togo » a été **refusée pour la fiche boisson** : elle montre des calices séchés, et non une boisson. Le crédit du poivre d’Éthiopie a été rétabli depuis la page source : **stephenbuchan**, avec lien vers sa page Flickr, conformément à sa licence CC BY 2.0. L’absence de champ auteur dans une réponse API n’a pas été interprétée comme une absence de crédit requis.

Les médias stockent notamment : identifiant stable, produit, chemins locaux, source et URL originale, auteur, licence et lien, modifications, alt, dimensions, format, poids, SHA-256, forme et partie représentées, statut et date de contrôle. Les images ne sont ni générées, ni hotlinkées depuis une source externe. Les enregistrements non principaux et les candidats non vérifiés ne remplacent pas une photo documentaire.

Pièces de contrôle :

- [Audit des 93 produits et liste exhaustive des 51 lacunes](../data/research/image-audit.json).
- [Recherche de couverture, candidats non publiés et lacunes](../data/research/image-coverage-research.json).
- [Provenance des 42 photographies principales](../data/research/primary-image-provenance.json).
- [Choix visuels et raisons d’acceptation ou de refus](../scripts/import/reviewed-form-selection.json).
- [Import et conservation des données vérifiés](../data/research/import-verification.json).

L’import possède un mode `--dry-run`. Une simulation n’a modifié aucun fichier publié. Deux imports complets consécutifs produisent les mêmes données et les mêmes fichiers au niveau binaire. Les 93 identifiants et URL, les 1 021 assertions, les preuves, sources et relations antérieures restent conservés. Le script `sync-media.mjs` prépare 42 lignes uniques pour `catalogue_media` ; seule sa simulation a été exécutée, aucune synchronisation vers une base hébergée n’est revendiquée.

## Vidéo fournie

Le MP4 original a été copié sans modification dans `public/assets/video/afroatlas-presentation.mp4` : 1 min 17 s environ, 1 280 × 720, **2 743 594 octets**. Son empreinte est identique au fichier fourni :

```text
c044dc773352ac6aed529baad21b09918f28f263503bb1c67206349dd838cd94
```

La page dédiée utilise `controls`, `playsinline`, `preload="none"`, sans lecture automatique, avec dimensions réservées. L’accueil affiche seulement une miniature et un lien : il ne télécharge pas le MP4. Une piste VTT intitulée « Texte à l’écran (FR) » reprend les textes affichés dans la vidéo ; ce n’est pas une transcription vérifiée de sa bande sonore. Un résumé HTML et un accès direct au fichier sont disponibles.

## SEO et mesure

Le contrôle des **140 pages HTML** valide un H1, une canonical absolue sans paramètres, une description, une image de partage, du JSON-LD analysable et exactement un script Cloudflare par page. Les **116 pages retenues** ont des titres et descriptions distincts et correspondent exactement au sitemap. `lastmod` est fixé au 5 octobre 2026, date de cette modification réelle ; il n’est pas avancé automatiquement à chaque build.

Les fiches sont prérendues et contiennent leurs noms, explications et sources sans JavaScript. Les pages de catégorie possèdent des cartes et des liens HTML. Recherche, favoris, comparaison, contribution, modération, références commerciales et fiches communautaires dynamiques restent hors du sitemap. Les pays sans contenu documenté restent navigables et en `noindex`.

Les URL existantes n’ont pas été remplacées : aucune redirection artificielle n’a été ajoutée. GitHub Pages doit continuer à servir les erreurs avec un véritable statut 404, contrôlé séparément après publication. Le fichier `/afroatlas/robots.txt` référence le sitemap ; les robots consultent principalement **`/robots.txt` à la racine du domaine**. Un dépôt Pages de projet ne contrôle pas cette racine : pour une maîtrise complète de cette directive et des en-têtes HTTP, il faut un domaine dédié ou une configuration de l’hébergement racine.

Le chiffre annoncé de **418 vues en 24 heures** n’a pas de tableau de bord accessible dans cette session. Il n’est donc ni confirmé ni renommé « visiteurs uniques » ou « clics Google ».

### Search Console : configuration à effectuer

1. Dans votre compte Google Search Console, ajouter la propriété **préfixe d’URL** `https://minlangrayan-ship-i.github.io/afroatlas/`.
2. Choisir la vérification par balise HTML. Copier uniquement sa valeur publique dans la variable GitHub Actions `PUBLIC_GOOGLE_SITE_VERIFICATION`, puis relancer le déploiement et cliquer Vérifier. Ne pas copier de jeton d’accès Google dans le dépôt.
3. Soumettre `https://minlangrayan-ship-i.github.io/afroatlas/sitemap-index.xml` dans Sitemaps.
4. Inspecter l’accueil, une fiche, une catégorie et une page pays utile. Consulter Indexation, puis Performances pour impressions, clics, CTR et position moyenne, en précisant la période et les filtres.

Ces éléments techniques sont prêts ; aucune propriété Search Console n’a été créée et aucune indexation Google n’est garantie. Voir la [documentation officielle de démarrage](https://developers.google.com/search/docs/monitor-debug/search-console-start).

### Cloudflare et événements d’usage

Le beacon déjà installé est conservé une seule fois dans le layout ; aucun second outil équivalent n’a été ajouté. [Cloudflare Web Analytics ne propose pas d’événements personnalisés et n’enregistre pas les paramètres de recherche des URL](https://developers.cloudflare.com/web-analytics/faq/). Les navigations entre pages restent de vraies navigations HTML.

Pour les recherches internes, les recherches vides, l’ouverture de fiches, le choix d’une destination et la réception de contributions, un service facultatif de compteurs journaliers a été préparé dans Supabase. Il est **désactivé par défaut** et, après configuration, exige un accord explicite révocable dans le pied de page. Seul le type d’événement est envoyé, sans mots recherchés, destination, coordonnées, contenu privé ou identifiant visiteur. Les totaux ne sont pas des utilisateurs uniques.

Dans Cloudflare : ouvrir **Web Analytics**, le site correspondant au token installé, puis choisir une période récente et filtrer le chemin `/afroatlas/`. Vérifier dans **Manage site** que l’option excluant les visiteurs de l’UE n’est pas activée involontairement ; elle peut exclure les visites françaises. [Référence officielle de configuration](https://developers.cloudflare.com/web-analytics/get-started/). Aucun accès au compte Cloudflare n’étant disponible, ce réglage et l’affichage des premières visites doivent encore être confirmés par le propriétaire.

## Sécurité et notifications

Les propositions passent par une validation serveur, un corps de requête borné, une limite de cinq propositions par heure, un champ anti-spam et la vérification des droits photo. Les images sont contrôlées par signature, dimensions et taille, décodées puis réencodées en WebP sans métadonnées EXIF/GPS. Les formats actifs comme SVG ne sont pas acceptés. Le serveur ne télécharge pas une image depuis une URL fournie par le visiteur.

Les propositions et photographies restent privées jusqu’à la décision du propriétaire. Les politiques RLS et la fonction de modération refusent les lectures ou décisions des visiteurs et des comptes non propriétaires. L’authentification de modération utilise un JWT en mémoire, pas une mutation authentifiée par cookie. Les mutations SQL utilisent des paramètres et les publications sont transactionnelles.

Les emails utilisent un expéditeur et un destinataire privés configurés côté serveur, un sujet fixe, un corps texte et un Reply-To validé. L’outbox conserve le contenu exact avant l’appel fournisseur. Une panne ne perd pas la proposition ; les nouvelles tentatives reprennent la même clé et le même contenu. Les états « reçue », `provider_accepted` et `delivered` restent distincts. Une notification non confirmée n’affiche jamais « email envoyé ».

La CSP autorise les scripts locaux, les hashes Astro et le beacon Cloudflare. Les attributs de style nécessaires au thème et à Motion sont permis séparément ; aucun `unsafe-inline` pour les scripts. Les vérifications navigateur doivent confirmer l’absence de violation CSP. Le build peut annoncer que `style-src-attr` remplace la portée correspondante de `style-src` : c’est la séparation voulue pour conserver ces attributs tout en contrôlant les scripts.

GitHub Pages ne permet pas à ce dépôt de définir tous les en-têtes HTTP : la CSP est livrée en balise meta et ne fournit pas `frame-ancestors`. La protection complète contre l’intégration dans une iframe exige un hébergement acceptant cet en-tête. Le frontend est minifié, sans source maps publiques ; **le code d’un dépôt public et les fichiers servis au navigateur restent copiables**.

Les migrations 002 et 003 sont additives. Aucun secret ni fichier de sauvegarde privé n’est publié. Le garde de publication détecte plusieurs formats de secrets et les sources serveur dans les bundles ; ce contrôle reste heuristique et ne garantit pas une absence universelle de secret.

## Validation et performances

Vérifications locales réussies :

- `npm run check` : 0 erreur, 0 avertissement, 0 indication sur 98 fichiers.
- `npm test` : **42 tests**, dont migrations PostgreSQL, RLS, publication après acceptation, déduplication et données médiatiques.
- `npm run check:backend` : cinq fonctions typées et **10 tests Deno**, dont réencodage WASM réel, fichiers invalides, injections, signature du webhook et reprise de notification avec fournisseur simulé.
- `npm run test:e2e` : **19 tests navigateur**, aux largeurs 390 / 768 / 1 440, dont recherche, pays, FR / EN / AR, RTL, photos, favoris, comparaison, formulaire, destination, carte vendeur, SEO et lecture vidéo avec piste VTT.
- `npm run build` : **140 pages** générées ; contrôle SEO sur ces 140 fichiers et correspondance exacte des 116 URL indexables avec le sitemap.
- Import complet relancé deux fois : résultat binaire identique, simulation sans modification, anciens identifiants, références et relations préservés. Synchronisation de 42 médias testée en simulation uniquement.
- `npm audit --omit=dev` : **0 vulnérabilité signalée** dans les dépendances frontend de production au moment du contrôle ; cela ne constitue pas un audit universel de la stack ou du fournisseur.
- Inspection visuelle sur mobile : vidéo, contribution, sélection de destination, carte vendeur et arabe. Le dernier contrôle de la page contribution ne relève aucune violation CSP après désactivation du probe `eval` de Zod par son option `jitless`.

### Comparaison de laboratoire

Deux premières séries séquentielles ont montré une forte variation des durées sur le PC. Elles sont conservées, mais ne permettent pas d’attribuer cet écart au code. Une comparaison complémentaire a donc alterné l’ancien commit `c7e04128` et la version modifiée, sur deux previews de production locales, dans le même navigateur : 36 observations, contextes vierges, trois essais par page et largeur, sans bridage réseau / CPU, mouvement réduit, observation de 1,5 seconde après `load`. Le protocole V2 compte tous les fichiers JavaScript de même origine visibles dans Resource Timing, quel que soit l’initiateur.

| Page / largeur       | LCP avant, médiane | LCP après, médiane | CLS avant → après |
| -------------------- | -----------------: | -----------------: | ----------------: |
| Accueil / 390 px     |             184 ms |             184 ms |             0 → 0 |
| Gombo / 390 px       |             204 ms |             228 ms |             0 → 0 |
| Catalogue / 390 px   |             160 ms |             224 ms |             0 → 0 |
| Accueil / 1 440 px   |             208 ms |             212 ms |       0,00086 → 0 |
| Gombo / 1 440 px     |             188 ms |             232 ms |             0 → 0 |
| Catalogue / 1 440 px |             288 ms |             256 ms |             0 → 0 |

Le catalogue desktop affiche moins de cartes au départ ; sa médiane baisse dans cette série. Plusieurs autres médianes augmentent modestement avec les fonctions ajoutées : **aucune amélioration générale des temps n’est revendiquée**. Les octets JavaScript observés passent de 126 818 à 129 619 sur l’accueil, de 117 308 à 119 833 / 124 137 sur Gombo selon la largeur, et de 167 971 à 172 457 sur le catalogue. Le chargement différé de la carte explique les différences selon le viewport. Aucun transfert vidéo n’est observé sur ces trois pages.

Ces résultats sont locaux, sans latence réseau ni bridage mobile, sur seulement trois essais. Ils ne démontrent **ni un INP de terrain ni un résultat au 75e percentile**. Les objectifs LCP ≤ 2,5 s, INP ≤ 200 ms et CLS ≤ 0,1 doivent être évalués sur les données réelles disponibles dans Cloudflare / Search Console après collecte suffisante.

Mesures brutes : [comparaison alternée V2](measurements/interleaved-before-after.json), [première série avant](measurements/initial-before.json), [première série après](measurements/initial-after.json). Les premières séries utilisaient un comptage JavaScript limité aux initiateurs `script` et ne servent pas au bilan des octets de la comparaison V2.

### Publication

Le commit frontend `54cea733f8ed2110e68f5d95670a9ebdb527fb1d` a été publié avec succès par [le workflow GitHub Pages](https://github.com/minlangrayan-ship-i/afroatlas/actions/runs/37375667375). Les vérifications publiques ont été effectuées le 5 octobre 2026 à 21:31 UTC et sont enregistrées dans [publication-verification.json](../data/research/publication-verification.json).

- Accueil, vidéo, catégorie, fiches, contribution, sitemap et médias : HTTP **200**. L’URL inexistante retourne **404** ; le robots racine du domaine retourne également 404, tandis que `/afroatlas/robots.txt` est accessible.
- Le MP4 publié possède la même empreinte et le même poids que l’original. Lecture, piste VTT, destination, carte vendeur, RTL, lien email et absence de débordement mobile vérifiés sur le site public.
- Le beacon Cloudflare charge en **200** ; ses requêtes POST de mesure obtiennent **204**. Aucun doublon de script, erreur JavaScript ou violation CSP relevé pendant ce parcours.
- La contribution en ligne reste volontairement désactivée tant que Supabase n’est pas connecté. Aucun envoi serveur réel ni email livré n’est revendiqué.

Les réponses 204 confirment le transport vers Cloudflare ; elles ne prouvent ni l’affichage dans le tableau de bord, ni les paramètres géographiques du compte. L’arrivée des statistiques et l’absence d’exclusion involontaire des visites françaises restent à confirmer dans **Web Analytics → Manage site**, avec les étapes indiquées plus haut. Le second commit de livraison ajoute ce bilan et ses preuves ; il ne modifie pas les fichiers frontend vérifiés.

## Configuration encore indispensable et calendrier

À la livraison : projet Supabase, variables publiques de connexion, compte propriétaire, expéditeur Resend autorisé, destinataire choisi, secrets email / webhook / tâche de reprise, configuration Search Console et accès au tableau de bord Cloudflare restent nécessaires. Le formulaire garde l’envoi fermé et l’annonce clairement. Suivre [SUPABASE_SETUP.md](SUPABASE_SETUP.md), qui détaille les migrations, les cinq fonctions, les secrets serveur, les relances et le parcours réseau à tester avant ouverture.

- **Sous 7 jours** : créer et connecter Supabase, confirmer un véritable envoi et une modération de bout en bout, tester le webhook et une reprise après panne ; vérifier Search Console et les réglages Cloudflare UE. Choisir aussi les durées de conservation des données privées.
- **À 30 jours** : analyser les pages réellement indexées, requêtes, impressions et clics ; consulter les mesures de terrain disponibles et les compteurs consentis ; traiter les lacunes prioritaires avec des sources et des photographies vérifiées. Ne pas attribuer les absences d’indexation à une cause sans consulter les rapports.
- **À 90 jours** : comparer des périodes cohérentes, enrichir les contextes les plus demandés et poursuivre la validation culturelle ; envisager un domaine propre pour les en-têtes et le robots racine, et de vraies routes traduites si le contenu éditorial correspondant est disponible.

Les références de données et licences restent attachées aux fiches. Le balisage documentaire suit [DefinedTerm](https://schema.org/DefinedTerm) et [BreadcrumbList](https://schema.org/BreadcrumbList). La validation des fichiers s’appuie sur les [recommandations OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). Ces changements améliorent la qualité technique et documentaire ; ils ne promettent ni classement Google ni trafic à échéance fixe.
