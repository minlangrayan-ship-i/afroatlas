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
```

Le chemin de base est `/afroatlas/`. Pour Playwright : `npx playwright install chromium`, ou définir `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` vers Edge/Chromium. `PLAYWRIGHT_BASE_URL` permet de tester la publication.

## Données et collecte

50 fiches, 23 pays africains, 862 assertions de noms, 22 contextes locaux documentés, 32 photos principales adaptées à la forme du produit. Les 18 lacunes photographiques sont affichées. Niger/Nigeria restent distincts. Le corpus conserve les alias sans preuve de pays sans leur attribuer une géographie.

```sh
npm run import
node scripts/import/selected-photos.mjs
node scripts/import/priority-content.mjs
npm run prepare-data
npm run validate
node scripts/report-quality.mjs
```

L’import initial est taxonomique ; les scripts suivants réappliquent l’enrichissement documentaire et la sélection photographique. Vérifier les sources et formes avant de publier une actualisation. `photo-selection.json` est une sélection examinée, les candidats de recherche ne sont pas automatiquement publiés. Dates/révisions, métadonnées, licences et pointeurs sont conservés. Photos Commons converties en WebP 400/960, aucune image générée. Les limites ADM1 sont millésimées, pas certifiées actuelles.

## Contributions

Le propriétaire a choisi de préparer un projet Supabase. Le code inclut réception multipart, stockage durable privé, validation des fichiers/droits, compte propriétaire, édition/refus/acceptation et catalogue public des fiches acceptées. Aucune proposition ne devient publique automatiquement. **L’envoi reste fermé tant que Supabase n’est pas créé et connecté.** Le site n’affiche jamais un brouillon comme reçu.

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

## Publication

Le workflow GitHub vérifie les pull requests et publie `main` sur Pages. Les fonctions Supabase se déploient séparément. Une consultation documentaire reste possible sans backend. Une version commercialement opérationnelle demande un hébergement adapté ; voir MONETIZATION.md. Les performances de terrain et un audit culturel humain ne sont pas revendiqués comme accomplis.
