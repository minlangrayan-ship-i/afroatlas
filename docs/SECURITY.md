# Protection et limites de publication

Le choix actuel du propriétaire est **dépôt privé, site public, administration protégée**. La bascule est préparée, mais le dépôt reste temporairement public : GitHub Pages est encore l’hébergement actif, l’offre GitHub n’est pas vérifiable avec l’accès disponible, et Cloudflare/Supabase ne sont pas connectés. Le passer en privé avant de disposer d’un hébergement compatible risquerait de rendre le site indisponible. Suivre [PRIVATE_HOSTING.md](PRIVATE_HOSTING.md) pour terminer la transition.

La licence existante et les licences des données/photos sont conservées. La minification n’est pas une protection contre la copie ; les ressources frontend servies au navigateur sont inspectables. Aucun blocage du clic droit, du clavier ou des outils du navigateur n’est ajouté.

## Mesures techniques

- Build production explicitement minifié, `vite.build.sourcemap: false` ; aucun fichier `.map`, référence `sourceMappingURL`, TypeScript original ou migration SQL n’est autorisé dans `dist/`.
- Contrôle `npm run check:publication` après build et dans GitHub Actions : recherche de formats de secrets reconnus dans les fichiers suivis et dans le build, rejet des clés privées/certificats sensibles, fichiers `.env` réels et jetons Supabase `service_role`. Les valeurs suspectes ne sont jamais imprimées.
- `.env*`, secrets courants, certificats privés, caches Supabase locaux et sauvegardes `.bundle` exclus de Git. Une exclusion ne retire pas automatiquement un fichier déjà suivi : le contrôle vérifie également les fichiers suivis.
- Authentification du propriétaire, contrôle d’appartenance, décisions de modération, écriture durable, limite de fréquence, validation réelle des fichiers et droits de publication exécutés dans les fonctions serveur Supabase. Le frontend ne décide jamais qu’une proposition devient publique.
- `SUPABASE_SERVICE_ROLE_KEY`, mots de passe, sel de limitation et identifiants personnels de connexion doivent rester dans la configuration serveur, jamais dans une variable `PUBLIC_*`, un commit ou un build.
- Les propositions et photos en attente restent privées grâce aux politiques SQL/Storage ; seules les fiches acceptées sont lisibles publiquement. Les tests PostgreSQL et Deno contrôlent ces règles.
- Sur GitHub Pages, le formulaire d’administration est retiré : la route ne sert qu’un avis d’indisponibilité, sans outil de modération. Une page statique ne peut pas établir une authentification HTTP côté serveur.
- Le déploiement Cloudflare comporte une Function qui vérifie cryptographiquement les JWT Cloudflare Access : signature RS256, émetteur configuré, audience, expiration, ancienneté maximale d’une heure et email du propriétaire. Les en-têtes déclaratifs ou jetons simplement décodés ne suffisent pas.
- L’API administrative same-origin vérifie en plus le jeton Supabase auprès d’Auth et appelle `is_afroatlas_owner` à chaque requête. La Function n’a pas de clé `service_role`. La fonction Supabase de modération et les politiques SQL/Storage conservent leur propre contrôle du propriétaire, même en cas d’appel direct.
- Les mutations de la passerelle refusent les origines tierces ; aucun CORS permissif, proxy arbitraire ou destination contrôlée par le visiteur. Réponses privées non mises en cache et non indexables, taille des corps bornée, aucune journalisation de mots de passe ou de jetons.
- Le HTML de modération est embarqué dans la Function, exclu des fichiers statiques. L’épuisement d’un quota ou une panne ne peut donc pas exposer la page privée par repli sur un asset. Configurer également Cloudflare en **Fail closed**.
- Le jeton utilisateur Supabase reste en mémoire dans la page autorisée, sans localStorage/sessionStorage ni refresh token ; fermeture/rechargement impose une nouvelle connexion. Les cookies d’identité et la connexion initiale sont gérés par Cloudflare Access. La déconnexion quitte aussi Access.

La configuration Supabase n’est pas encore connectée. Aucun identifiant réel de projet, mot de passe propriétaire ou secret serveur n’est actuellement renseigné dans le frontend. Lors d’une activation, l’URL d’un service et une clé **publique** `anon` deviennent nécessairement visibles dans cette architecture : ce ne sont pas des secrets d’administration, et ils ne remplacent jamais les règles serveur. Si ces paramètres publics doivent eux aussi rester cachés, il faudra intercaler un service serveur, plutôt que les intégrer au frontend statique.

## Sources originales préservées

Avant les changements de protection initiaux, un bundle Git complet du commit `9ea69e4` a été créé et vérifié localement : `../local-backups/afroatlas-before-hardening-9ea69e4.bundle`. Avant cette nouvelle transition, le bundle `../local-backups/afroatlas-before-private-admin-2026-10-05.bundle` sauvegarde et vérifie l’historique complet jusqu’à `a94ec41`. Ils sont hors du dépôt publié. Aucun historique ni source originale n’est supprimé ou réécrit. Changer la visibilité conserve l’historique du dépôt.

## Vérifications et limites

Contrôles rejouables : `npm run check`, `npm test`, `npm run check:backend`, `npm run build`, `npm run check:publication`, `node scripts/check-output.mjs` et Playwright. Avec une `SITE_URL` de Cloudflare définie : `npm run build:cloudflare` puis `npm run check:cloudflare`. La vérification de production se fait avec `node scripts/verify-private-hosting.mjs` ; elle ne remplace pas le test de connexion du propriétaire et de modération réelle.

La recherche de secrets est heuristique : elle ne garantit pas de reconnaître toute information confidentielle possible. Elle porte sur les fichiers actuellement suivis et le build ; elle ne constitue pas un audit exhaustif de chaque version historique. Si un secret a été exposé auparavant, le supprimer d’un commit ou de l’affichage ne suffit pas : il doit être révoqué/renouvelé. Aucun secret exposé n’a été identifié par ces contrôles.

Rendre le dépôt privé limite l’accès futur aux sources et à l’historique GitHub, sans effacer les copies ou forks publics antérieurs. Les fichiers frontend, données ouvertes et images servis publiquement restent accessibles selon leurs licences. Aucun dispositif ne promet de rendre un site public impossible à copier.
