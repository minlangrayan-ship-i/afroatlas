# Pack vidéo AfroAtlas — Étape 1 : storyboard et scripts

> Statut : **proposition à valider**. Aucun asset ni rendu n'est produit avant votre accord.
> Tous les chiffres et noms ci-dessous viennent de `src/data/published/catalogue.json` et `geography.json` (lus le 11 octobre 2026).

---

## 0. Points à trancher avant l'étape 2

| # | Sujet | Constat dans le dépôt | Proposition |
|---|---|---|---|
| 1 | **Nom de la marque** | Le site, le code et le logo disent **AfroAtlas**, pas « AfroAthlas ». | Utiliser **AfroAtlas** partout. **[À VÉRIFIER]** si « AfroAthlas » est un changement de nom voulu. |
| 2 | **Statuts de validation** | Le brief cite `verified / pending_review / disputed / rejected`. Les données utilisent `candidate / documented / reviewed / rejected`, et les **1 035 appellations publiées sont toutes `documented`** (aucune `reviewed`). | Afficher le badge réel **« Documenté · Source ↗ »**. Ne pas montrer de badge « verified » : ce serait faux. |
| 3 | **Schéma Prisma** | Il n'y en a pas. Le site est en Astro, les données sont des fichiers JSON, et le backend Supabase est préparé. | Aucun impact sur la vidéo. |
| 4 | **« Lancement : 10 régions du Cameroun »** | Les 10 régions sont bien cartographiées (geoBoundaries 2016, CC BY 3.0). Des noms ou usages rattachés à une région existent pour **8 régions sur 10**. **Adamaoua et Nord n’ont encore aucune donnée.** | La carte montre les 10 régions et allume les 8 documentées. Adamaoua et Nord restent grisées avec « à documenter ». |
| 5 | **Pays et extension** | 25 pays africains sont navigables. Des noms ou usages sont rattachés à **13 pays**, dont la Côte d'Ivoire, le Sénégal et le Nigeria. **Le Ghana n'en a aucun.** | Dire « déjà 13 pays documentés ». Ne pas annoncer le Ghana comme couvert. |
| 6 | **Catégories** | Le site en a **7** : légumes et feuilles (36 fiches), épices et condiments (25), poissons (17), produits de base (8), fruits (4), herbes (3), préparations (2). | Montrer les 5 du brief en vedette, sans dire qu'il n'y en a que 5. |
| 7 | **CTA** | Le texte entre accolades est le titre de la page d'accueil, pas une adresse. L'adresse actuelle est `minlangrayan-ship-i.github.io/afroatlas`. Aucun domaine propre pour l'instant. | Afficher le titre « Un produit, plusieurs noms. Retrouvez le vôtre. » avec l'adresse actuelle. **[À VÉRIFIER]** : domaine définitif, s'il est acheté avant la publication. |
| 8 | **{{HANDLE}}** | Non fourni. | **[À VÉRIFIER]** : vos noms de compte YouTube, TikTok et Instagram. |
| 9 | **Voix off** | Pas de clé ElevenLabs. Depuis cette session, le réseau **bloque** le service edge-tts (Microsoft), HuggingFace (voix Piper, modèles Whisper) et l'API ElevenLabs. | Voir § 6 : trois options à choisir. |
| 10 | **Témoignages** | Aucun dans le dépôt. | Aucun témoignage dans les vidéos. |

---

## 1. Faits réels utilisables à l'écran

| Donnée | Valeur | Origine |
|---|---|---|
| Fiches produits | **95** | `catalogue.products` |
| Appellations documentées | **1 035** | `catalogue.names` (toutes `documented`) |
| Sources distinctes | **119** | `catalogue.sources` |
| Langues ou identifiants de langue | **37** | codes de langue des appellations |
| Photos principales vérifiées | **81** fiches sur 95 | `images` (role `primary`) |
| Pays avec noms ou usages | **13** (25 pays navigables) | noms et contextes |
| Cameroun : appellations | **131**, sur **45** produits | `countryIds` contient CMR |
| Cameroun : langues locales nommées | **17** (Baka, Bakoko, Bakossi, Bakundou, Bakwéri, Bamoun, Bangwa, Bassa, Baya, Boulou, Douala, Ejagham, Ewondo, Fang, Fulfuldé, Ngoumba, Vouté), plus le français et l'anglais | `languageLabel` |
| Cameroun : sources | **26** | preuves des noms CMR |
| Cameroun : régions avec données | **8 sur 10** (toutes sauf Adamaoua et Nord) | `regionIds` des noms et contextes |

### Exemples de démo (noms et langues tels que documentés)

**Exemple principal : njansang (*Ricinodendron heudelotii*).**
Source : Eyog Matig O., Ndoye O., Kengue J., Awono A. (éd.), IPGRI.

| Nom | Langue |
|---|---|
| njangsang | Bassa, Douala |
| essang | Boulou |
| essessang | Ewondo, Fang |
| isangé | Bakossi |
| esangasanga | Bakwéri |
| oryok | Ejagham |
| nzonell | Ngoumba |

Sur la fiche « amandes », on trouve aussi akpi et djansang.

**Exemple secondaire : safou (*Dacryodes edulis*).** Même source.

| Nom | Langue |
|---|---|
| sao | Douala, Bakwéri |
| sah | Bassa |
| assa | Ewondo |
| asa / assas | Boulou |
| odou | Fang |
| wom | Bamoun |

**Exemple court : basilic tropical (*Ocimum gratissimum*).** Source : Nole T. et al. Messep (Ewondo, et attesté dans les régions Centre et Sud selon une autre source), Masebi (Bassa), Mahepo (Douala).

**Exemple « hors Cameroun » : gombo.** Ila (yoruba), kuɓewa (haoussa), mbamia (swahili), بامية (arabe), okra (anglais).

---

## 2. Bibliothèque de scènes communes

Les trois formats réutilisent les mêmes scènes. Seuls la durée, le cadrage et le texte changent.

| ID | Scène | Contenu visuel |
|---|---|---|
| S1 | **Hook** | Typographie cinétique sur fond noir et grain. Les noms s'empilent et se percutent : njangsang, essang, essessang, isangé… |
| S2 | **Tension** | Mise en situation au marché ou en épicerie : une personne demande un produit et le vendeur ne comprend pas. Silhouettes animées si pas de B-roll. Des points d'interrogation dorés éclatent. |
| S3 | **Problème « pas de source »** | Captures floutées et génériques de forums ou résultats de recherche (pas de vrai site tiers), barrées d'un trait ocre : « Qui a raison ? » |
| S4 | **Logo** | Révélation de l'astérisque « ✳ AfroAtlas. » (identité existante), sur un balayage or, puis la promesse. |
| S5 | **Démo de recherche** | Mockup animé de l'interface réelle : on tape « essang », les suggestions apparaissent, on ouvre la fiche. |
| S6 | **Démo multi-noms** | Bloc « Aussi appelé » : les noms apparaissent un par un avec leur langue. Zoom sur le badge « Documenté · Source ↗ ». |
| S7 | **Démo source** | La source s'ouvre : titre de l'ouvrage, éditeurs, page. Mise en avant de « chaque nom a sa source ». |
| S8 | **Carte du Cameroun** | 10 régions en trait or. 8 s’allument en vert, une à une. Adamaoua et Nord restent grisées, avec « à documenter ». |
| S9 | **Preuve chiffrée** | Compteurs animés : 95 fiches, 1 035 appellations, 119 sources, 17 langues camerounaises. |
| S10 | **Montrer au vendeur** | Mockup mobile de la carte vendeur en plein écran : « Je cherche ce produit, dans cette forme. » |
| S11 | **Extension** | Zoom arrière du Cameroun vers l'Afrique : 13 pays documentés s'allument (dont Côte d'Ivoire, Sénégal, Nigeria). |
| S12 | **CTA** | Titre du site, adresse, handle **[À VÉRIFIER]**, rappel « Contribuez : proposez un nom avec sa source ». |

**Sous-titres :** mot par mot, gros (YouTube 64 px, 9:16 76 px), centrés, police Inter Display Black. Le mot actif est en or (#DFAE43), les autres en blanc cassé (#FAF7EF).

**Palette :**

| Couleur | Code | Usage |
|---|---|---|
| Noir profond | #0B0B0A | fond |
| Vert AfroAtlas | #193D30 | identité |
| Or / épice | #DFAE43 | accent |
| Ocre / terracotta | #B94C35 | soulignements |
| Crème | #FAF7EF | texte |

**Sound design :** whoosh doux sur les transitions, « tick » sur chaque nom qui apparaît, impact grave sur le logo et le CTA. Tous les sons sont synthétisés par le code (aucun son tiers).

---

## 3. YouTube 16:9, 1920 × 1080, cible 78 s

**Hook retenu :** A (voir § 5).

| Scène | Durée | Visuel | Voix off | Texte à l'écran | SFX |
|---|---|---|---|---|---|
| S1 Hook | 0:00–0:04 | Noms qui s'empilent, coupe toutes les 0,6 s | « Njangsang. Essang. Essessang. Isangé… Quatre noms. Un seul produit. » | NJANGSANG / ESSANG / ESSESSANG / ISANGÉ → « 1 PRODUIT » | ticks, impact |
| S2 Tension | 0:04–0:12 | Marché en silhouettes, zooms rapides, « ? » dorés | « Au Cameroun, la même amande porte un nom différent selon que l'on parle bassa, boulou, ewondo ou bakossi. » | BASSA · BOULOU · EWONDO · BAKOSSI | whoosh |
| S2b | 0:12–0:18 | Une personne montre son téléphone, le vendeur fait non de la tête | « Résultat : au marché ou dans une épicerie de la diaspora, on ne se comprend pas. » | « On ne se comprend pas. » | — |
| S3 Problème | 0:18–0:25 | Résultats génériques flous, barrés d'ocre | « Et en ligne, les listes de noms circulent… sans dire d'où elles viennent. » | « D'OÙ VIENT CE NOM ? » | glitch léger |
| S4 Logo | 0:25–0:31 | Balayage or, ✳ AfroAtlas. | « AfroAtlas relie les noms d'un même produit. Sources à l'appui. » | « Un même produit, plusieurs noms. » | impact grave |
| S5 Recherche | 0:31–0:38 | Mockup desktop : saisie de « essang », suggestions | « Vous tapez le nom que vous connaissez… » | « Tapez votre nom » | frappe clavier |
| S6 Multi-noms | 0:38–0:47 | Fiche : bloc « Aussi appelé », noms et langues un par un | « … et AfroAtlas vous montre tous les autres : en bassa, en douala, en ewondo, en fang, en bakwéri. » | njangsang · Bassa / essessang · Ewondo / esangasanga · Bakwéri | ticks |
| S7 Source | 0:47–0:54 | Zoom badge « Documenté · Source ↗ », panneau de la source | « Chaque nom est relié à sa source : l'ouvrage, la page, la langue. Rien n'est inventé. » | « 1 nom = 1 source » | clic |
| S8 Carte | 0:54–1:01 | Carte du Cameroun, 8 régions allumées, Adamaoua et Nord grisées | « On commence par le Cameroun : huit régions sur dix déjà documentées. » | « 8/10 régions » + « Adamaoua, Nord : à documenter » | montée |
| S9 Preuve | 1:01–1:08 | Compteurs | « Aujourd'hui : 95 fiches, 1 035 appellations, 119 sources. » | 95 · 1 035 · 119 | ticks rapides |
| S10 Vendeur | 1:08–1:12 | Mockup mobile, carte vendeur plein écran | « Et au marché ? Vous montrez la carte au vendeur. » | « Montrer au vendeur » | whoosh |
| S11 Extension | 1:12–1:15 | Zoom arrière, 13 pays allumés | « Treize pays déjà, et ce n'est que le début. » | « 13 pays » | — |
| S12 CTA | 1:15–1:18 | Titre, adresse, handle | « Retrouvez le vôtre sur AfroAtlas. Abonnez-vous. » | « Un produit, plusieurs noms. Retrouvez le vôtre. » / adresse / {{HANDLE}} [À VÉRIFIER] | impact |

**Texte complet de la voix off** (environ 170 mots, débit posé de 2,3 mots/s) :

> Njangsang. Essang. Essessang. Isangé… Quatre noms. Un seul produit.
> Au Cameroun, la même amande porte un nom différent selon que l'on parle bassa, boulou, ewondo ou bakossi.
> Résultat : au marché ou dans une épicerie de la diaspora, on ne se comprend pas.
> Et en ligne, les listes de noms circulent… sans dire d'où elles viennent.
> AfroAtlas relie les noms d'un même produit. Sources à l'appui.
> Vous tapez le nom que vous connaissez… et AfroAtlas vous montre tous les autres : en bassa, en douala, en ewondo, en fang, en bakwéri.
> Chaque nom est relié à sa source : l'ouvrage, la page, la langue. Rien n'est inventé.
> On commence par le Cameroun : huit régions sur dix déjà documentées.
> Aujourd'hui : 95 fiches, 1 035 appellations, 119 sources.
> Et au marché ? Vous montrez la carte au vendeur.
> Treize pays déjà, et ce n'est que le début.
> Retrouvez le vôtre sur AfroAtlas. Abonnez-vous.

**À vérifier sur la phrase « la même amande ».** Les noms cités par langue (njangsang en bassa, essang en boulou, essessang en ewondo, isangé en bakossi) sont rattachés dans les données à la fiche « Ricinodendron — arbre à njangsang ». Ils proviennent de la même source (IPGRI). La fiche « amandes » porte d'autres noms (ndjanssang, akpi, djansang). La voix off dit « la même amande » par simplification. **[À VÉRIFIER]** : préférez-vous « le même arbre » pour coller exactement à la fiche ?

---

## 4. TikTok 9:16, 1080 × 1920, cible 24 s

Rythme rapide, une coupe toutes les 0,8 à 1,2 s. **Hook retenu :** B, lisible en moins de 2 s.

| Scène | Durée | Visuel | Voix off | Texte à l'écran (zone sûre) | SFX |
|---|---|---|---|---|---|
| S1 Hook | 0:00–0:02 | « ESSANG ? » énorme, puis 3 noms en rafale | « Tu l'appelles comment, toi ? » | ESSANG ? → NJANGSANG ? → ESSESSANG ? | impact |
| S2 Tension | 0:02–0:06 | Silhouettes au marché, « ? » | « Même produit, nom différent selon la langue. Au marché, personne ne se comprend. » | « 1 produit = plein de noms » | whoosh |
| S4 Logo | 0:06–0:08 | ✳ AfroAtlas. | « AfroAtlas les relie. » | « AfroAtlas » | impact |
| S5+S6 Démo | 0:08–0:15 | Mockup mobile : « essang », puis noms et langues | « Tape ton nom, tu vois tous les autres : bassa, douala, ewondo, bakwéri… » | njangsang · Bassa / essessang · Ewondo | ticks |
| S7 Source | 0:15–0:18 | Zoom badge source | « Et chaque nom a sa source. » | « Sources à l'appui » | clic |
| S9 Preuve | 0:18–0:21 | Compteurs | « 1 035 noms, 119 sources. » | 1 035 · 119 | ticks |
| S12 CTA | 0:21–0:24 | Titre, « Lien en bio » | « Lien en bio. » | « LIEN EN BIO » + {{HANDLE}} [À VÉRIFIER] | impact |

**Texte de la voix off** (environ 55 mots) :

> Tu l'appelles comment, toi ? Même produit, nom différent selon la langue. Au marché, personne ne se comprend. AfroAtlas les relie. Tape ton nom, tu vois tous les autres : bassa, douala, ewondo, bakwéri… Et chaque nom a sa source. 1 035 noms, 119 sources. Lien en bio.

---

## 5. Instagram Reels 9:16, 1080 × 1920, cible 38 s

Version plus esthétique : plans un peu plus longs (1,5 à 2 s), photos produits en plein cadre, typographie élégante. **Hook retenu :** C.

| Scène | Durée | Visuel | Voix off | Texte à l'écran | SFX |
|---|---|---|---|---|---|
| S1 Hook | 0:00–0:03 | Photo safou plein cadre, lent zoom avant, noms en surimpression | « Sao. Sah. Assa. Odou. Ce sont tous des noms du safou. » | sao · sah · assa · odou | ticks |
| S2 Tension | 0:03–0:09 | Fondus enchaînés de photos produits | « Chaque langue du Cameroun a les siens. Douala, bassa, ewondo, fang, bamoun… » | DOUALA · BASSA · EWONDO · FANG · BAMOUN | nappe |
| S3 Problème | 0:09–0:13 | Texte seul sur noir | « Mais qui les a notés, et où ? » | « Qui les a notés ? » | — |
| S4 Logo | 0:13–0:17 | Révélation or | « AfroAtlas réunit ces noms, sources à l'appui. » | « Un même produit, plusieurs noms. » | impact doux |
| S6+S7 Démo | 0:17–0:25 | Mockup mobile : fiche, « Aussi appelé », badge source | « Pour chaque produit : ses noms, sa langue, et l'ouvrage qui l'atteste. » | « Documenté · Source ↗ » | clic |
| S8 Carte | 0:25–0:30 | Carte du Cameroun, régions qui s'allument | « Huit régions du Cameroun déjà documentées. » | « 8/10 régions » | montée |
| S10 Vendeur | 0:30–0:34 | Carte vendeur | « Au marché, montre la carte au vendeur. » | « Montrer au vendeur » | whoosh |
| S12 CTA | 0:34–0:38 | Titre et CTA | « Lien en bio. Enregistre et partage à quelqu'un qui cuisine. » | « LIEN EN BIO » / « Enregistre & partage » + {{HANDLE}} [À VÉRIFIER] | impact |

**Texte de la voix off** (environ 85 mots) :

> Sao. Sah. Assa. Odou. Ce sont tous des noms du safou. Chaque langue du Cameroun a les siens. Douala, bassa, ewondo, fang, bamoun… Mais qui les a notés, et où ? AfroAtlas réunit ces noms, sources à l'appui. Pour chaque produit : ses noms, sa langue, et l'ouvrage qui l'atteste. Huit régions du Cameroun déjà documentées. Au marché, montre la carte au vendeur. Lien en bio. Enregistre et partage à quelqu'un qui cuisine.

(Ces noms du safou sont rattachés à la fiche « Safoutier — prunier d'Afrique », source IPGRI. sao = Douala et Bakwéri, sah = Bassa, assa = Ewondo, odou = Fang, wom = Bamoun.)

---

## 6. Hooks à tester (A/B)

Ils seront aussi livrés dans `video/hooks.md` à l'étape 2.

| Format | A | B | C | Retenu |
|---|---|---|---|---|
| YouTube | Avalanche de noms : « Njangsang. Essang. Essessang. Isangé… Quatre noms. Un seul produit. » | Question : « Combien de noms pour un seul produit ? Au Cameroun, au moins dix. » | Défi : « Vous savez ce qu'est l'essessang ? Vous en avez sûrement déjà mangé. » | **A** : visuel immédiat et preuve du concept en 4 s. |
| TikTok | « Ce produit a 10 noms. Tu les connais tous ? » | « Tu l'appelles comment, toi ? » + ESSANG ? | « POV : tu demandes du njangsang à Yaoundé » | **B** : question directe qui fait commenter, lisible en moins de 2 s. |
| Reels | « Sao, sah, assa, odou : un seul fruit. » | « Le safou a plus de noms que tu ne crois. » | Noms du safou sur photo plein cadre, voix posée | **C** : plus esthétique et dans le ton Reels. |

**Notes de prudence :**
- « Au moins dix » (YouTube B) : la fiche Ricinodendron porte 10 noms rattachés au Cameroun. À reformuler si les données changent.
- TikTok C : « à Yaoundé » n'est pas attesté pour ce nom précis. Si ce hook est testé, remplacer par « au marché ».

---

## 7. Plan technique de l'étape 2 (après validation)

### Composition
Remotion (React/TypeScript), une composition paramétrée par format : ratio, durée, zones sûres, tailles de police. Les scènes vivent dans `video/src/scenes/`, les données (chiffres et noms) sont lues **depuis `catalogue.json`** au moment du rendu, donc jamais recopiées à la main. Rendu avec le Chromium déjà installé, encodage final avec ffmpeg en H.264 et AAC, 30 fps, dans `out/`. Une commande : `npm run render:all`.

### Zones sûres 9:16
Texte important à au moins 250 px du haut, 400 px du bas et 120 px du bord droit. Un calque de contrôle (désactivé au rendu final) dessine ces marges.

### Mockups de l'interface
Recréés en React à l'identique du site (mêmes couleurs, mêmes composants « Aussi appelé » et carte vendeur), animés image par image. Aucune capture de site tiers.

### Carte du Cameroun
Tracés réels des 10 régions depuis `geography.json` (geoBoundaries, CC BY 3.0), avec le crédit affiché à l'écran.

### Photos produits
Photos du catalogue (licences Wikimedia Commons CC BY / BY-SA / domaine public), avec **crédit auteur et licence à l'écran** comme les licences l'exigent.

### Voix off — à choisir
| Option | Avantage | Limite |
|---|---|---|
| (a) **Votre voix** (recommandé pour la crédibilité) | Authentique | Vous enregistrez les 3 textes ci-dessus. Je livre la vidéo calée sur un minutage du script, et l'alignement Whisper se lance sur votre machine (le modèle ne peut pas être téléchargé ici). |
| (b) **vidIQ voiceover** | Voix masculine grave générée maintenant | Service tiers connecté à cette session, payant en crédits ; le script lui est envoyé. |
| (c) **TTS hors ligne (espeak-ng)** | Gratuit, local | Voix robotique : utilisable seulement comme piste guide pour le montage. |

Si vous ouvrez l'accès réseau à `speech.platform.bing.com` (edge-tts) ou `huggingface.co` (Piper et Whisper), j'utilise une voix française neuronale gratuite et l'alignement automatique ici.

### Sous-titres
`.srt` français et anglais générés depuis le script minuté (ou l'alignement Whisper si disponible). Mot par mot à l'écran.

### Musique
Aucune musique tierce n'est disponible sans réseau. Je propose une **nappe cinématique générée par code** (synthèse procédurale, donc libre de droits par construction). Je fournis aussi une liste de pistes libres à télécharger vous-même (YouTube Audio Library, Pixabay Music). Le mixage final vise -14 LUFS, avec la voix 12 à 15 dB au-dessus de la musique.

### B-roll
`assets/broll/` n'existe pas. Les plans réels (marché, épicerie, mains tenant les produits) seront remplacés par des **silhouettes animées clairement marquées « PLACEHOLDER »**, avec une liste de plans à filmer ou à télécharger (Pexels, Pixabay, licence libre) livrée dans `video/broll-shotlist.md`.

### Livrables publish/
Titres, description YouTube SEO, 5 à 8 hashtags, commentaire épinglé, miniature 1280 × 720, couvertures 9:16.

### Contrôle (étape 3)
ffprobe (résolution, durée, codecs), loudnorm (-14 LUFS), et des images clés extraites pour vérifier la lisibilité et les zones sûres.

---

## 8. Ce que j'attends de vous

1. Valider ou corriger le nom **AfroAtlas** et le badge **« Documenté »** au lieu de « verified » (§ 0, points 1 et 2).
2. Choisir la **voix off** : (a), (b) ou (c), ou ouvrir l'accès réseau.
3. Donner les **handles**, et le domaine s'il existe.
4. Valider les **hooks retenus** et les textes de voix off, ou les modifier.
5. Trancher « la même amande » ou « le même arbre » (§ 3).
