# Protection et limites de publication

Le dépôt AfroAtlas reste public, conformément au choix du propriétaire du 4 octobre 2026. Son code source et son historique restent consultables et copiables. La licence existante et les licences des données/photos sont conservées. La minification n’est pas une protection contre la copie ; les ressources frontend servies au navigateur sont inspectables. Aucun blocage du clic droit, du clavier ou des outils du navigateur n’est ajouté.

## Mesures techniques

- Build production explicitement minifié, `vite.build.sourcemap: false` ; aucun fichier `.map`, référence `sourceMappingURL`, TypeScript original ou migration SQL n’est autorisé dans `dist/`.
- Contrôle `npm run check:publication` après build et dans GitHub Actions : recherche de formats de secrets reconnus dans les fichiers suivis et dans le build, rejet des clés privées/certificats sensibles, fichiers `.env` réels et jetons Supabase `service_role`. Les valeurs suspectes ne sont jamais imprimées.
- `.env*`, secrets courants, certificats privés, caches Supabase locaux et sauvegardes `.bundle` exclus de Git. Une exclusion ne retire pas automatiquement un fichier déjà suivi : le contrôle vérifie également les fichiers suivis.
- Authentification du propriétaire, contrôle d’appartenance, décisions de modération, écriture durable, limite de fréquence, validation réelle des fichiers et droits de publication exécutés dans les fonctions serveur Supabase. Le frontend ne décide jamais qu’une proposition devient publique.
- `SUPABASE_SERVICE_ROLE_KEY`, mots de passe, sel de limitation et identifiants personnels de connexion doivent rester dans la configuration serveur, jamais dans une variable `PUBLIC_*`, un commit ou un build.
- Les propositions et photos en attente restent privées grâce aux politiques SQL/Storage ; seules les fiches acceptées sont lisibles publiquement. Les tests PostgreSQL et Deno contrôlent ces règles.

La configuration Supabase n’est pas encore connectée. Aucun identifiant réel de projet, mot de passe propriétaire ou secret serveur n’est actuellement renseigné dans le frontend. Lors d’une activation, l’URL d’un service et une clé **publique** `anon` deviennent nécessairement visibles dans cette architecture : ce ne sont pas des secrets d’administration, et ils ne remplacent jamais les règles serveur. Si ces paramètres publics doivent eux aussi rester cachés, il faudra intercaler un service serveur, plutôt que les intégrer au frontend statique.

## Sources originales préservées

Avant les changements, un bundle Git complet du commit `9ea69e4` a été créé et vérifié localement : `../local-backups/afroatlas-before-hardening-9ea69e4.bundle`. Il contient les sources originales et l’historique, hors du dépôt publié. Une sauvegarde du portfolio est également conservée à côté. Aucune réécriture d’historique, suppression de sources originales ou modification de visibilité n’est effectuée.

## Vérifications et limites

Contrôles rejouables : `npm run check`, `npm test`, `npm run check:backend`, `npm run build`, `npm run check:publication`, `node scripts/check-output.mjs` et Playwright.

La recherche de secrets est heuristique : elle ne garantit pas de reconnaître toute information confidentielle possible. Elle porte sur les fichiers actuellement suivis et le build ; elle ne constitue pas un audit exhaustif de chaque version historique. Si un secret a été exposé auparavant, le supprimer d’un commit ou de l’affichage ne suffit pas : il doit être révoqué/renouvelé. Aucun secret exposé n’a été identifié par ces contrôles.

Le code public, les fichiers minifiés, les données ouvertes et les images réutilisables restent accessibles selon leurs licences. Une copie déjà téléchargée ne peut pas être effacée à distance. Aucun dispositif ne promet de rendre un site public impossible à copier.
