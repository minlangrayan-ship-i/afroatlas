# Activer les contributions et la modération

Le propriétaire a choisi de préparer Supabase, sans projet existant. Le site publié reste consultable ; le formulaire annonce explicitement que l’envoi est fermé. Aucun brouillon n’est présenté comme une contribution reçue. Aucun identifiant secret n’est inclus dans le dépôt.

## 1. Créer le projet et la base

Dans votre compte Supabase, créer un projet et conserver son mot de passe hors du dépôt. Dans **SQL Editor**, exécuter intégralement `supabase/migrations/202610040001_community.sql`, une seule fois sur le projet neuf.

Cette migration crée les propositions privées, les fiches acceptées publiques, l’historique de modération, une limitation de cinq propositions par heure et deux espaces photo : `afroatlas-pending` privé et `afroatlas-approved` public. Les visiteurs ne disposent d’aucun droit d’écriture directe sur les tables ou les fichiers.

## 2. Réserver la modération au propriétaire

Dans **Authentication → Users**, créer votre compte email/mot de passe, confirmé. Copier son UUID, puis exécuter dans SQL Editor :

```sql
insert into public.afroatlas_owners(user_id)
values ('REMPLACER_PAR_UUID_DU_COMPTE');
```

Ne jamais ajouter automatiquement les utilisateurs à cette table. La simple inscription ne donne aucun droit de modération. Désactiver l’inscription publique si vous n’en avez pas besoin. Utiliser un mot de passe unique ; il n’est jamais placé dans la configuration du frontend.

## 3. Déployer les fonctions

Depuis le dossier `afroatlas`, avec Node.js et votre session Supabase CLI :

```sh
npx supabase login
npx supabase link --project-ref VOTRE_REFERENCE_PROJET
npx supabase functions deploy submit-contribution --use-api
npx supabase functions deploy moderate-contribution --use-api
```

L’option `--use-api` effectue le bundle côté serveur, sans installation de Docker : [référence CLI officielle](https://supabase.com/docs/reference/cli/supabase-functions-deploy).

Le fichier `supabase/config.toml` désactive la vérification JWT de la passerelle pour ces deux fonctions. C’est intentionnel : l’envoi visiteur est anonyme ; la fonction de modération vérifie elle-même le JWT avec Auth puis l’appartenance à `afroatlas_owners`. Elle ne permet pas une validation anonyme.

Dans **Edge Functions → Secrets**, définir :

| Nom               | Valeur                                                |
| ----------------- | ----------------------------------------------------- |
| `RATE_LIMIT_SALT` | Une longue valeur aléatoire, privée, propre au projet |
| `ALLOWED_ORIGINS` | `https://minlangrayan-ship-i.github.io`               |

Pour tester localement, ajouter `http://127.0.0.1:4321` à la liste d’origines, séparée par une virgule. Retirer cette origine ensuite. `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis aux fonctions hébergées par Supabase ; vérifier leur présence côté serveur. La clé `service_role` ne doit jamais atteindre le navigateur, le chat ou GitHub.

## 4. Connecter le frontend et republier

Dans **Project Settings → API Keys**, relever l’URL du projet et la **clé publique legacy `anon` JWT**. Cette implémentation utilise explicitement cette clé ; ne pas fournir une clé `service_role`, une clé secrète ou un mot de passe.

Dans le dépôt GitHub, **Settings → Secrets and variables → Actions → Variables**, créer :

```text
PUBLIC_SUPABASE_URL=https://VOTRE_REFERENCE_PROJET.supabase.co
PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE_ANON
```

Relancer le workflow **Verify and publish AfroAtlas**. Les variables sont intégrées lors du build : les ajouter sans republier ne change pas le site déjà en ligne. Pour un essai local, copier `.env.example` vers `.env`, remplir uniquement ces deux valeurs publiques et reconstruire le site.

## 5. Examiner, modifier et publier

Ouvrir `/afroatlas/moderation/`, se connecter avec le compte propriétaire. Sélectionner une proposition, examiner sa photo privée, modifier la proposition et les champs de la fiche publique. Les éditeurs JSON sont réservés au propriétaire ; aucune connaissance technique n’est demandée au visiteur.

Types de fiche publique : `product`, `name`, `usage`, `photo`, `country`, `region`. Pour un produit existant, `productId` doit correspondre à son **id**, consultable dans `public/data/catalogue.json` (ne pas confondre avec le nom saisi ou le slug). Pour un nouveau produit, conserver l’id `community-…`. Pour un pays existant, `country` est son ISO3 ; une région existante utilise son id documentaire pour permettre le filtre. Une nouvelle région possède un id stable, placé dans `region`, et son pays dans `country`.

Renseigner une source HTTPS, sa licence ou ses conditions, le périmètre réellement attesté, et les crédits/licence de la photo. `labelEn` et `labelAr` restent `null` si non documentés. Ne pas déduire un pays d’une langue. Un nouveau produit ou un remplacement photo exige une photo téléversée et vérifiée. Une proposition sans photo peut enrichir les noms, les usages ou la géographie. Pour un signalement photo sans remplacement, enregistrer la correction et rechercher une image appropriée avant publication.

**Enregistrer** conserve les modifications sans publier. **Refuser** conserve la décision privée. **Accepter et publier** copie la photo validée vers l’espace public puis publie la fiche et l’historique dans une transaction de base. La nouvelle fiche devient disponible à la recherche à la prochaine visite/recharge ; les noms et usages sont rapprochés du produit concerné. Un pays ou une région apparaît dans les choix et l’exploration, sans inventer de frontière cartographique.

## 6. Vérification indispensable après connexion

1. Depuis un navigateur visiteur, envoyer une proposition avec une photo JPEG, PNG ou WebP valide (maximum 5 Mo), sa source/licence ou la confirmation des droits. Vérifier un accusé avec UUID et `pending`.
2. Recharger, puis constater la ligne durable dans Supabase. La photo doit rester privée. Vérifier qu’elle n’apparaît pas dans le catalogue.
3. Vérifier qu’un autre compte ne lit pas les propositions et ne peut pas modérer.
4. Avec le propriétaire, ouvrir la photo, modifier et enregistrer : toujours aucune publication.
5. Accepter une appellation sur un produit existant, recharger la recherche et rechercher ce nom exact. Vérifier également son filtre pays/région.
6. Accepter un nouveau produit avec une photo appropriée ; vérifier fiche publique, crédits et recherche. Refuser une autre proposition : aucune fiche publique ne doit apparaître.
7. Contrôler les formats interdits, dépassements de taille, absence de droits, indisponibilité du service et limitation de fréquence. Une erreur ne doit jamais afficher « reçue ».

Les politiques SQL et la logique de catalogue ont été testées localement. Ce parcours réseau avec un véritable projet Supabase reste à exécuter après sa création ; aucun succès d’envoi réel n’est revendiqué avant cela.

Documentation officielle : [déploiement](https://supabase.com/docs/guides/functions/deploy), [secrets des fonctions](https://supabase.com/docs/guides/functions/secrets), [clés API](https://supabase.com/docs/guides/api/api-keys).
