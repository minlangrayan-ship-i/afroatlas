# Pack vidéo AfroAtlas — storyboard (version 2, produite)

**Angle.** AfroAtlas sert d'abord à la personne de la diaspora qui entre dans une afroshop et ne retrouve pas le produit de chez elle, parce qu'il porte un autre nom dans le pays du vendeur. La version 1 (variations de noms entre langues camerounaises) est archivée : `video/storyboard-v1-cameroun.md` et `voiceover/archives/v1/`.

Tous les noms, pays, sources et chiffres sont lus dans les données du site par `video/scripts/extract-data.mjs`. Le script s'arrête si une paire racontée n'existe pas dans les données. Les villes (Douala, Paris, Abidjan, Bamako, Bruxelles) sont une mise en situation.

## Faits utilisés

| Donnée | Valeur |
|---|---|
| Paires documentées | njangsang (Cameroun) = akpi, Kôlou (Côte d'Ivoire) · soumbala (Mali, Burkina Faso) = nététou (Sénégal) · foléré (Cameroun) = bissap-feuille (Sénégal) |
| Source de « akpi » | *Gestion durable des ressources naturelles dans l'espace Taï*, CHM Côte d'Ivoire, tableau 5, p. 21 |
| Chiffres | 95 fiches, 1 035 appellations, 119 sources, 13 pays |
| Statut affiché | « Documenté · Source ↗ » (statut réel des appellations ; aucun badge « verified ») |
| Photos | njansang : L. E. Clark et T. C. H. Sunderland, domaine public · soumbala : crédit affiché à l'écran |

## YouTube 16:9 — environ 62 s

| Scène | Visuel | Voix off | Son |
|---|---|---|---|
| Trajet | Carte Afrique–Europe, arc doré Douala → Paris | Vous avez grandi à Douala. Aujourd'hui, vous vivez à Paris. | — |
| Afroshop | Étagères, bulles « Je cherche du njangsang. » / « Connais pas… », zoom sur le bocal « AKPI » | Un samedi, vous entrez dans une afroshop… sur l'étagère. | souffle, éclair |
| Deux noms | NJANGSANG · Cameroun ↔ AKPI · Côte d'Ivoire, puis « MÊME PRODUIT. DEUX NOMS. » | Lui a grandi à Abidjan… Même produit. Deux noms. | tick, impact |
| Sans source | Listes floues « SOURCE ? », puis « AUCUNE LISTE FIABLE ? » | Et aucune liste fiable pour faire le lien. | souffle |
| Logo | ✳ AfroAtlas. « Un même produit, plusieurs noms. » | C'est pour ça qu'existe AfroAtlas. | impact |
| Recherche | Saisie « njangsang » → fiche « Njansang / akpi — amandes » | Vous tapez le nom de chez vous… | souffle |
| Fiche | « Aussi appelé » : njangsang · Cameroun, akpi · Côte d'Ivoire, Kôlou, ndjanssang ; badge source | …pays par pays, langue par langue. | ticks |
| Source | Ouvrage, auteurs, tableau 5 p. 21, « akpi · Côte d'Ivoire », puis « Rien n'est inventé. » | Chaque nom est relié à sa source. | souffle |
| Carte vendeur | Téléphone : destination Côte d'Ivoire → akpi, Kôlou | Choisissez le pays du vendeur… | souffle |
| Autres pays | Carte d'Afrique : soumbala · Mali, nététou · Sénégal, foléré · Cameroun, bissap-feuille · Sénégal | Soumbala au Mali… | ticks |
| Chiffres | 95 · 1 035 · 119 · 13 | Aujourd'hui : … | ticks |
| CTA | Logo, titre du site, adresse, « Abonnez-vous » | Un produit, plusieurs noms. Retrouvez le vôtre… | impact |

## TikTok 9:16 — environ 21 s

Afroshop dès la première image (« Je cherche du njangsang. » / « Connais pas. » / zoom sur « AKPI ») → Deux noms → « MÊME PRODUIT. AUTRE NOM. » → Logo et badge source → Carte vendeur (Côte d'Ivoire) → « Lien en bio ».

## Instagram Reels 9:16 — environ 31 s

SOUMBALA · Mali ↔ NÉTÉTOU · Sénégal, « UN CONDIMENT. DEUX PAYS. » → Trajet Bamako → Bruxelles → Afroshop (« Du nététou ? ») → Logo → Fiche soumbala par pays et badge → Carte vendeur (Sénégal) → 13 pays → « Lien en bio · Enregistre & partage ».

Textes complets de la voix off : `voiceover/*.fr.txt` (anglais : `*.en.txt`). Hooks A/B : `video/hooks.md`.

## Points ouverts

- **{{HANDLE}} [À VÉRIFIER]** : noms de compte. Pour l'afficher dans l'appel à l'action, lancer `npm run render:all -- --compte=@…`.
- **Domaine** : l'adresse affichée est `minlangrayan-ship-i.github.io/afroatlas`. Après achat d'un domaine, relancer avec `--adresse=…`.
- **Nom de marque** : AfroAtlas (orthographe du site). Seuls les noms de fichiers vidéo reprennent « afroathlas », comme demandé.
