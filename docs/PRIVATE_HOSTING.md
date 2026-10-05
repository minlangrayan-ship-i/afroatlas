# Dépôt privé, site public, administration protégée

## État constaté le 6 octobre 2026

Le dépôt `minlangrayan-ship-i/afroatlas` est public, avec un historique conservé et des permissions API `admin: true`. Le site actuel est https://minlangrayan-ship-i.github.io/afroatlas/, publié par GitHub Actions sur GitHub Pages. Il n’y a pas de domaine personnalisé. L’API consultable ne fournit pas l’offre du compte GitHub : elle ne permet donc pas de confirmer une offre Pro. Wrangler indique qu’aucune session Cloudflare n’est connectée. Supabase n’est pas créé/configuré.

[GitHub Pages exige une offre compatible pour un dépôt privé](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Changer immédiatement la visibilité risquerait de couper la publication actuelle. Aucun abonnement, migration en production ou changement de visibilité n’a été engagé. L’administration sur cet hébergement statique est fermée ; son formulaire a été retiré. Cette fermeture n’est pas présentée comme une administration Cloudflare déjà opérationnelle.

## Solution préparée et coût

**Cloudflare Pages Free + Cloudflare Access Free + Supabase séparé.** Pages accepte [les dépôts GitHub publics ou privés](https://developers.cloudflare.com/pages/configuration/git-integration/). Le site reste public ; seules les routes de modération et leurs API sont soumises à Access. Les fonctions Supabase et les règles SQL vérifient également les permissions du propriétaire.

Coût de l’hébergement et du contrôle d’accès : **0 $ / mois dans les quotas gratuits**, sans engagement d’offre payante. [Pages Free](https://developers.cloudflare.com/pages/platform/limits/) prévoit 500 builds/mois, 20 000 fichiers et 25 Mio maximum par fichier. Les [assets statiques sont gratuits et les Functions Free disposent de 100 000 requêtes/jour, partagées avec les autres Workers](https://developers.cloudflare.com/pages/functions/pricing/). [Access Free](https://www.cloudflare.com/plans/zero-trust-services/) couvre 50 utilisateurs authentifiés ; les visiteurs publics ne doivent pas être envoyés vers Access. Le paquet courant respecte les limites de fichiers et de taille.

Un sous-domaine `pages.dev` est inclus : aucun achat de domaine nécessaire. Supabase, emails et autres services conservent leurs propres quotas et conditions ; leur création n’est pas effectuée ici. Aucun dépassement payant ou changement d’offre ne doit être activé sans accord préalable sur son coût. Si GitHub Pro est déjà actif, Pages peut rester une solution pour le frontend public d’un dépôt privé, mais l’administration dynamique exige toujours un service serveur.

## 1. Connecter Cloudflare et conserver le site actuel

Dans Cloudflare, **Workers & Pages → Create → Pages → Connect to Git**. Installer/autoriser l’application GitHub Cloudflare uniquement pour `afroatlas`. Le compte connecté doit appartenir au propriétaire ; aucun identifiant de connexion ne doit être envoyé dans le chat ou commité.

Paramètres :

| Paramètre             | Valeur                                                                |
| --------------------- | --------------------------------------------------------------------- |
| Branche de production | `main`                                                                |
| Répertoire racine     | racine du dépôt                                                       |
| Commande de build     | `npm run build:cloudflare`                                            |
| Dossier publié        | `dist-cloudflare`                                                     |
| `NODE_VERSION`        | `22`                                                                  |
| `SITE_URL`            | URL HTTPS réellement attribuée au projet, avec `/afroatlas/` à la fin |

Définir aussi les variables publiques Supabase du frontend selon `.env.example`, après avoir configuré le backend. `build:cloudflare` active automatiquement le rendu administratif puis l’extrait dans le bundle serveur. **Ne jamais publier `dist/` sur Cloudflare pour cette architecture**, ni le build administratif sur GitHub Pages. Ne pas utiliser l’envoi manuel par glisser-déposer : [il ne déploie pas les Functions](https://developers.cloudflare.com/pages/platform/known-issues/).

Le paquet conserve le préfixe `/afroatlas/`, les pages, animations, médias et liens internes. `/` redirige vers `/afroatlas/`. Les URL canoniques, le sitemap et robots utilisent `SITE_URL`. Le pipeline GitHub existant reste actif pendant la préparation.

L’intégration GitHub gère les identifiants de publication : aucun token de déploiement n’est embarqué dans le frontend. Si une publication CLI est choisie ultérieurement, limiter le token Cloudflare à **Account / Cloudflare Pages / Edit**, au seul compte concerné, et le stocker dans un environnement CI protégé réservé à `main`. Aucun token permanent Cloudflare n’est nécessaire à la solution Git intégrée proposée ici.

## 2. Protéger uniquement les chemins administratifs avec Access

Créer/activer **Cloudflare Zero Trust Free** dans le compte propriétaire. Pour un domaine `pages.dev`, suivre la [procédure officielle d’activation d’Access sur le domaine de production](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain) : l’option Pages par défaut protège uniquement les aperçus. Modifier l’application de production créée afin que **ses chemins protégés soient uniquement** :

- `/afroatlas/moderation` et ses sous-chemins ;
- `/afroatlas/api/admin` et ses sous-chemins.

Inclure la route sans slash final, celle avec slash et les variantes sous le même préfixe. Utiliser **une même application Access** avec ces chemins/hostnames afin que l’audience soit commune à la page et aux API. Avec un domaine personnalisé, ajouter les mêmes chemins pour ce domaine dans l’application ; la signature est vérifiée aussi lors d’un appel sur un autre hostname.

Policy **Allow → Emails → `minlangrayan@gmail.com` seulement**. Ne pas créer de policy `Bypass` ou `Everyone`. Authentification recommandée : fournisseur d’identité du propriétaire avec MFA activée ; le code ponctuel email peut servir au démarrage. Durée de session : une heure. Protéger les aperçus séparément ou désactiver les builds de branches inutiles. Ne pas verrouiller tout le domaine public derrière Access.

Dans Pages **Settings → Variables and Secrets**, configurer les paramètres **runtime de production**, puis redéployer :

| Paramètre serveur     | Contenu                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `ADMIN_ACCESS_ISSUER` | `https://VOTRE_EQUIPE.cloudflareaccess.com`                           |
| `ADMIN_ACCESS_AUD`    | Audience de l’application Access, dans ses paramètres supplémentaires |
| `ADMIN_OWNER_EMAIL`   | Email exact du propriétaire autorisé                                  |
| `SUPABASE_URL`        | URL du projet Supabase configuré                                      |
| `SUPABASE_ANON_KEY`   | Clé publique `anon` du projet, utilisée avec le JWT utilisateur       |

Ces paramètres ne sont pas des `PUBLIC_*` et ne sont pas intégrés au JavaScript public. La passerelle n’utilise aucune clé privilégiée Supabase. Son fichier exemple est `server/.dev.vars.example`, vide ; les valeurs réelles de développement vont dans un `.dev.vars` ignoré.

Configurer **Settings → Runtime → Fail open / closed → Fail closed**, comme recommandé pour les [Functions d’authentification](https://developers.cloudflare.com/pages/functions/routing/#fail-open--closed). Le paquet exclut également le HTML administratif des assets : même un repli statique ne peut pas le servir. Les pages publiques contournent les Functions grâce à `_routes.json`.

## 3. Configurer Supabase

Suivre [SUPABASE_SETUP.md](SUPABASE_SETUP.md) : trois migrations, compte propriétaire confirmé, ajout de son UUID dans `afroatlas_owners`, fonctions serveur et stockage privé. Désactiver les inscriptions inutiles. L’email du compte Supabase doit correspondre à celui autorisé par Access.

Ajouter l’**origine HTTPS exacte du nouveau site** dans `ALLOWED_ORIGINS` des fonctions Supabase, sans slash ou chemin, et conserver l’ancienne origine pendant la transition. La passerelle transmet l’origine contrôlée à la fonction de modération. Ne pas employer `*`. Configurer également les URL Auth autorisées selon le nouveau site, sans redirections arbitraires.

Les secrets privilégiés restent dans Supabase : clé `service_role`, mot de passe DB, sel de limitation, clés email/webhook/cron. Ils ne sont pas copiés dans Cloudflare frontend ou GitHub variables publiques. Les visiteurs peuvent consulter les fiches acceptées et proposer une contribution ; ils ne lisent jamais les propositions en attente ni les photos privées.

Après Access, le propriétaire se connecte avec son compte Supabase dans le panneau. Le serveur confirme son identité et son rôle avant de retourner un JWT utilisateur temporaire. À chaque appel de liste/photo/décision, il répète la vérification. L’API Supabase de modération refait son propre contrôle avant toute écriture ; RLS protège aussi les appels SQL/Storage directs.

## 4. Vérifier avant de passer le dépôt en privé

En local/CI :

```sh
npm run check
npm test
npm run check:backend
# SITE_URL doit être défini dans l’environnement avant ces deux commandes.
npm run build:cloudflare
npm run check:cloudflare
```

Sur **la vraie production Cloudflare**, avec `SITE_URL` et `ADMIN_ACCESS_ISSUER` dans l’environnement :

```sh
node scripts/verify-private-hosting.mjs
```

Le script teste les pages publiques sans cookies, leur indexabilité, sitemap/robots et le refus ou la redirection Access des routes privées, y compris avec un faux en-tête JWT. `SUPABASE_URL` permet de vérifier en plus le refus de l’API de modération directe. Il ne prétend pas vérifier une session propriétaire ou un déploiement par un simple HTTP 200.

Faire également ces tests réels, puis les consigner hors du dépôt si des identifiants privés sont concernés :

1. Navigateur privé/mobile : accueil, recherche, FR/EN/AR, produit, vidéo et email sans connexion ; aucune page éditoriale publique bloquée par Access.
2. Compte tiers : refus par Access ; utilisateur Supabase confirmé sans entrée propriétaire : lecture et publication refusées côté serveur, même par appel direct.
3. Compte propriétaire : connexion, liste persistante des contributions, aperçu privé, édition, refus, puis acceptation d’une proposition de test correctement sourcée ; seule la proposition acceptée devient recherchable.
4. Déconnexion et jeton expiré : nouvelle authentification obligatoire. Aucun JWT dans localStorage/sessionStorage.
5. Nouvel envoi sur `main` : build Cloudflare réussi, site public à jour ; permissions de l’intégration restreintes au dépôt.

## 5. Basculer sans perdre l’historique

Une sauvegarde Git complète et vérifiée est déjà conservée hors du dépôt : `../local-backups/afroatlas-before-private-admin-2026-10-05.bundle` (HEAD `a94ec41`). Ne pas recréer, déplacer ou supprimer le dépôt pour changer sa visibilité.

Lorsque les tests Cloudflare/Supabase sont réussis :

1. Dans GitHub **afroatlas → Settings → Secrets and variables → Actions → Variables**, définir `HOSTING_PROVIDER=cloudflare`. Le job GitHub Pages se désactive ; les validations restent actives. Cloudflare Git Integration continue de publier `main`.
2. Mettre à jour les liens du portfolio et les autres liens partagés vers l’URL Cloudflare réellement validée. L’ancien domaine `github.io` n’est pas transférable à Cloudflare et peut cesser de répondre après privatisation avec une offre GitHub non compatible. Un domaine personnel, s’il existe déjà, peut conserver son URL après migration DNS validée ; aucun domaine n’a été acheté ici.
3. Dans GitHub **afroatlas → Settings → General → Danger Zone → Change repository visibility → Change to private**, confirmer `minlangrayan-ship-i/afroatlas`. L’accès `admin` est disponible ; c’est la compatibilité d’hébergement et sa configuration qui empêchent de faire cette action immédiatement.
4. Vérifier `git fetch`, l’historique, l’accès anonyme au dépôt désormais refusé, puis un **nouveau build Cloudflare depuis le dépôt privé**. Rejouer la vérification de production. Si l’app GitHub ne voit plus le dépôt, réautoriser uniquement `afroatlas` dans ses réglages d’installation.

Si le propriétaire confirme une offre GitHub compatible et choisit de garder Pages, configurer `PRIVATE_GITHUB_PAGES_SUPPORTED=true` uniquement après vérification de cette compatibilité ; cela ne fournit aucune administration dynamique à Pages. Aucune variable déclarative ne souscrit une offre ni ne la rend compatible.

## Limites restantes

Vérifications effectuées : 63 tests unitaires (dont 21 nouveaux cas de contrôle administratif), 10 tests Deno, build Astro de 140 pages, compilation du serveur Cloudflare et contrôle de 362 fichiers publics dans les quotas gratuits. Le runtime Cloudflare local a servi quatre pages publiques sans connexion et refusé cinq variantes de routes administratives/API en HTTP 401, ainsi qu’un faux JWT ; le module serveur privé était inaccessible en HTTP 404. Le contrôle de publication ne détecte aucun secret reconnu ni source map publique, et l’audit npm des dépendances de production indique zéro vulnérabilité connue. Ces contrôles restent heuristiques, sans garantie universelle d’absence de secret.

Les contrôles serveur ont été testés localement avec de vraies signatures JWT et des réponses backend simulées, et les politiques SQL avec PostgreSQL local. Ils ne sont pas présentés comme des tests réussis de Cloudflare Access/Supabase en production. Les accès aux deux comptes, le compte propriétaire et les tests réels ci-dessus restent indispensables. Une copie/fork antérieure des sources ne disparaît pas en passant le dépôt en privé. Le frontend, les données et les photographies publiques restent consultables et téléchargeables selon leurs licences.
