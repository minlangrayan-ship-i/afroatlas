# AfroAtlas — bibliothèque documentaire interactive

Astro, React, TypeScript, Tailwind, Motion, Fuse.js et Zod. Frontend public : https://minlangrayan-ship-i.github.io/afroatlas/. Identité visuelle et animations conservées. Interface FR/EN/AR, arabe RTL, noms locaux originaux et sources distinctes.

## Lancer et vérifier

Node.js 22.12+ :

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
npm run test:e2e
npm run check:backend
npm run check:publication
npm run check:seo
```

Le chemin de base est `/afroatlas/`. Pour Playwright : `npx playwright install chromium`, ou définir `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` vers Edge/Chromium. `PLAYWRIGHT_BASE_URL` permet de tester la publication.

## Données et collecte

93 fiches, 25 pays africains, 1 021 assertions de noms, 46 contextes locaux documentés, 42 photos principales adaptées à la forme du produit. Les 51 lacunes photographiques sont affichées. Niger/Nigeria restent distincts. Le corpus conserve les alias sans preuve de pays sans leur attribuer une géographie.

```sh
npm run import
node scripts/import/selected-photos.mjs
node scripts/import/priority-content.mjs
npm run prepare-data
npm run validate
node scripts/report-quality.mjs
node scripts/import/reviewed-forms.mjs --dry-run
node scripts/import/reviewed-forms.mjs
npm run audit:images
npm run check:import
```

L’import initial est taxonomique ; les scripts suivants réappliquent l’enrichissement documentaire et la sélection photographique. Vérifier les sources et formes avant de publier une actualisation. `photo-selection.json` est une sélection examinée, les candidats de recherche ne sont pas automatiquement publiés. Dates/révisions, métadonnées, licences et pointeurs sont conservés. Photos Commons converties en WebP 400/960, aucune image générée. Les limites ADM1 sont millésimées, pas certifiées actuelles.

## Contributions

Le formulaire public transmet automatiquement les propositions et leurs photos par email à `site.contactEmail` via FormSubmit. L’activation du destinataire est requise ; le propriétaire a confirmé l’avoir effectuée. Voir [docs/CONTRIBUTIONS_EMAIL.md](docs/CONTRIBUTIONS_EMAIL.md). Un acquittement du prestataire ne certifie ni livraison Gmail ni validation du contenu. Aucune proposition ne devient publique automatiquement.

Le projet Supabase reste préparé pour le stockage durable, les permissions du propriétaire et la modération. Ce parcours est distinct de l’email ; sa réception et sa publication doivent encore être connectées et testées. Le site n’affiche jamais un brouillon comme reçu.

Suivre [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). Les deux variables publiques sont décrites dans `.env.example` et le workflow GitHub ; les clés secrètes restent uniquement dans Supabase. Les visiteurs n’accèdent ni aux propositions en attente ni aux photos privées. Favoris et comparaison restent locaux, sans historique de recherche enregistré.

## Structure

- `src/pages/`, `src/components/`, `src/lib/` : pages, interactions, schémas, recherche et localisation.
- `src/data/published/`, `public/data/` : instantanés avec provenance et licences distinctes.
- `scripts/import/`, `data/raw/`, `data/research/` : collecte et métadonnées candidates.
- `public/images/` : photographies réutilisables et médias complémentaires crédités.
- `supabase/migrations/`, `supabase/functions/` : base, politiques d’accès et traitement serveur.
- `tests/`, `docs/` : vérifications, sources, couverture, lacunes et configuration.

Adresse publique centralisée dans `src/data/site.ts` : contact/partenariats uniquement par email. Aucun réseau publicitaire, traceur, paiement, tarif ou annonceur fictif. Emplacements conservés et inactifs.

Voir [DATA_QUALITY.md](docs/DATA_QUALITY.md), [SOURCES.md](docs/SOURCES.md), [CONTENT_BACKLOG.md](docs/CONTENT_BACKLOG.md) et [VERIFICATION.md](docs/VERIFICATION.md). Tous les rapports consultables n’ont pas une licence ouverte : faits cités et résumés originaux, aucune republication globale de leurs textes. Les collections et photos conservent leurs propres licences.

Le [bilan SEO, UX, sécurité et vidéo du 5 octobre 2026](docs/SEO_UX_VIDEO_REPORT.md) détaille les changements, les mesures de laboratoire et les accès restant à configurer. La [présentation vidéo](https://minlangrayan-ship-i.github.io/afroatlas/presentation/) utilise le fichier fourni, inchangé, et un texte d’accompagnement accessible. La recherche transporte le contexte de l’interlocuteur vers une carte à montrer au vendeur ; elle ne déduit pas la géographie d’une langue.

## Publication

Le workflow GitHub vérifie les pull requests et publie `main` sur Pages. Les fonctions Supabase se déploient séparément. Une consultation documentaire reste possible sans backend. Une version commercialement opérationnelle demande un hébergement adapté ; voir MONETIZATION.md. Les performances de terrain et un audit culturel humain ne sont pas revendiqués comme accomplis.

La transition vers **dépôt privé, site public et administration protégée** est préparée dans [PRIVATE_HOSTING.md](docs/PRIVATE_HOSTING.md). Le dépôt reste temporairement public jusqu’à la connexion et aux tests de l’hébergement compatible. GitHub Pages affiche uniquement un avis d’administration fermée ; Cloudflare Pages/Access fournit le contrôle serveur de la page et des API, avec une vérification propriétaire supplémentaire dans Supabase.

Le frontend de production est minifié sans source maps publiques et le workflow vérifie les fichiers publiés. Secrets et opérations privilégiées restent côté serveur ; minifier ne rend pas le code impossible à copier. Voir [SECURITY.md](docs/SECURITY.md) pour les contrôles, les sauvegardes originales et les limites.
