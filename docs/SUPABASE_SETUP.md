# Activer les contributions et la modération

Le propriétaire a choisi de préparer Supabase, sans projet existant. Le site publié reste consultable ; le formulaire annonce explicitement que l’envoi est fermé. Aucun brouillon n’est présenté comme une contribution reçue. Aucun identifiant secret n’est inclus dans le dépôt.

## 1. Créer le projet et la base

Dans votre compte Supabase, créer un projet et conserver son mot de passe hors du dépôt. Appliquer dans l’ordre les trois migrations, une seule fois chacune :

1. `supabase/migrations/202610040001_community.sql` : contributions, modération, fichiers et RLS.
2. `supabase/migrations/202610050002_notifications.sql` : réception atomique, déduplication et notifications privées ; compteurs agrégés facultatifs.
3. `supabase/migrations/202610050003_catalogue_media.sql` : références des médias contrôlés et limitation du débit des compteurs.

Sur un projet déjà migré, appliquer seulement les migrations manquantes. Avec un projet lié par CLI, `npx supabase db push` utilise l’historique des migrations ; ne pas réexécuter la première migration ni supprimer des tables.

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
npx supabase functions deploy retry-notifications --use-api
npx supabase functions deploy mail-webhook --use-api
npx supabase functions deploy usage-metrics --use-api
```

L’option `--use-api` effectue le bundle côté serveur, sans installation de Docker : [référence CLI officielle](https://supabase.com/docs/reference/cli/supabase-functions-deploy).

Le fichier `supabase/config.toml` désactive la vérification JWT de la passerelle pour ces fonctions. L’envoi visiteur est anonyme ; la modération vérifie elle-même le JWT et l’appartenance à `afroatlas_owners`. Les relances exigent un secret serveur, les confirmations du fournisseur exigent une signature Svix. Les compteurs restent fermés sauf activation explicite. Aucun visiteur ne peut approuver une contribution.

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

## 7. Configurer les notifications privées

Créer un compte Resend et vérifier un domaine d’expédition que vous contrôlez. Choisir un expéditeur autorisé et l’adresse destinataire souhaitée ; aucune adresse destinataire n’est préremplie dans le code. Le mode de test Resend peut limiter le destinataire au compte propriétaire : vérifier ces restrictions avant de tester.

Définir dans **Edge Functions → Secrets**, à partir de `supabase/functions/.env.example` :

| Variable privée                 | À configurer                                              |
| ------------------------------- | --------------------------------------------------------- |
| `RESEND_API_KEY`                | Clé du service email, jamais dans une variable `PUBLIC_…` |
| `CONTRIBUTIONS_FROM_EMAIL`      | Expéditeur autorisé par Resend                            |
| `CONTRIBUTIONS_RECIPIENT_EMAIL` | Votre adresse de réception choisie                        |
| `RESEND_WEBHOOK_SECRET`         | Secret de signature de votre webhook Resend               |
| `NOTIFICATION_CRON_SECRET`      | Valeur aléatoire privée, distincte de `RATE_LIMIT_SALT`   |

Dans Resend, créer un webhook HTTPS vers `https://VOTRE_REFERENCE_PROJET.supabase.co/functions/v1/mail-webhook`. Sélectionner `email.delivered`, `email.bounced`, `email.failed` et `email.complained`. La signature doit être vérifiée sur le corps brut avant son interprétation. Le champ `provider_id` rattache l’événement à la notification privée.

L’enregistrement de la proposition et de sa notification est atomique. Une tentative d’envoi est faite après la réception ; un échec conserve la proposition et reporte la notification. Le même UUID, le même contenu enregistré et la même clé d’idempotence sont réutilisés. `provider_accepted` signifie que Resend a accepté l’email ; seule une confirmation signée `email.delivered` donne l’état `delivered`.

Configurer ensuite une tâche toutes les cinq minutes, par exemple Supabase Cron. Activer `pg_cron` et `pg_net` dans le tableau de bord et enregistrer dans Vault deux secrets : `afroatlas_functions_url` (URL publique du préfixe `/functions/v1`) et `afroatlas_notification_cron_secret` (même valeur que `NOTIFICATION_CRON_SECRET`). Utiliser SQL Editor, sans mettre ces valeurs dans Git :

```sql
select cron.schedule(
  'afroatlas-notification-retries',
  '*/5 * * * *',
  $$select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'afroatlas_functions_url') || '/retry-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets
         where name = 'afroatlas_notification_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );$$
);
```

Les tentatives sont limitées à huit et arrêtées avant 23 heures. La [déduplication Resend expire après 24 heures](https://resend.com/docs/dashboard/emails/idempotency-keys) : un cas `needs_review` demande un examen manuel, sans relance aveugle risquant un double email. Les événements de refus ou de plainte n’entraînent pas de réexpédition automatique. La modération affiche l’état et le nombre de tentatives.

Avant d’ouvrir le formulaire : envoyer une véritable proposition de test, vérifier la persistance après recharge, l’email reçu, l’état signé `delivered`, puis une panne contrôlée et une relance. Vérifier aussi un double clic / une requête répétée : une seule proposition et une notification fournisseur dédupliquée. Les tests livrés utilisent PostgreSQL local et un fournisseur simulé ; aucun email réel n’a été envoyé dans cette session.

## 8. Vérifier les photos et synchroniser les médias

Le serveur limite les fichiers à 5 Mo, contrôle les signatures JPEG/PNG/WebP, refuse les animations et les dimensions excessives (8 000 pixels par côté, 12 millions de pixels), puis réencode en WebP après orientation et suppression des métadonnées. Il n’utilise pas Sharp côté Edge : cette bibliothèque native n’est pas prise en charge ; le traitement utilise [ImageMagick WASM, suivant la documentation Supabase](https://supabase.com/docs/guides/functions/examples/image-manipulation).

Tester ce traitement sur la fonction réellement hébergée avant de connecter le formulaire, y compris un fichier renommé, une image animée et un fichier trop grand. Le décodage WASM et les limites ont été testés localement sous Deno ; la disponibilité de l’asset WASM dans le bundle hébergé doit être confirmée au premier déploiement. Si le bundle requiert des fichiers statiques supplémentaires, utiliser le [déploiement des fichiers WASM avec Docker](https://supabase.com/docs/guides/functions/wasm), qui ne prend pas en charge `--use-api` pour ces fichiers statiques.

Les 42 photos principales existantes sont servies depuis GitHub Pages. Leurs métadonnées peuvent être recopiées, sans doublon d’identifiant, vers `catalogue_media` :

```sh
node scripts/sync-media.mjs --dry-run
node scripts/sync-media.mjs
```

La deuxième commande exige `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans l’environnement serveur privé. Ne jamais placer la clé privilégiée dans `.env.example`, le chat ou une variable frontend. Les fichiers ne sont pas encodés dans les lignes de base : seules leurs URL, leur provenance et leurs dimensions sont enregistrées. La synchronisation réelle reste à effectuer après création du projet ; le site publié lit encore ses instantanés JSON statiques.

## 9. Activer, si souhaité, les compteurs d’usage

Ils sont distincts de Cloudflare Web Analytics et désactivés par défaut. Définir `USAGE_METRICS_ENABLED=true` côté fonctions et `PUBLIC_USAGE_METRICS_ENABLED=true` dans les variables de build, puis republier. Le pied de page propose un accord facultatif, révocable ; aucun compteur n’est transmis avant cet accord. Seuls cinq noms d’événement sont acceptés. Aucun texte de recherche, pays choisi, identifiant visiteur, email ou contenu de proposition n’est envoyé.

`usage_daily` contient seulement le jour, le type d’événement et son total. Ces nombres ne sont pas des visiteurs uniques. Le limiteur conserve temporairement une empreinte salée de l’adresse réseau ; les logs d’infrastructure du prestataire restent soumis à ses propres réglages. Choisir une durée de conservation des propositions privées et des limites de débit avant ouverture du service. Purger périodiquement les limites expirées, sans effacer des contributions ni leur audit.

Lecture des compteurs depuis votre espace SQL propriétaire :

```sql
select day, event, count from public.usage_daily
order by day desc, event;
```
