# AfroAtlas — bibliothèque documentaire interactive

V1 statique en français : Astro, React pour les îlots interactifs, TypeScript, Tailwind 4, Motion, Fuse.js, Zod et cartes SVG. Les données sont collectées en amont : aucune API extérieure ne dépend de la recherche d’un visiteur.

## Lancer

Node.js 22.12+ (22 LTS recommandé), npm :

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

Le chemin de base est `/afroatlas/`, en développement et en publication. Astro génère de vraies pages produit et pays dans `dist/`. `astro.config.mjs` définit le compte GitHub et le sous-chemin. Le workflow teste les pull requests ; seul `main` ou un lancement manuel publie.

## Collecte et publication

```sh
npm run import
node scripts/import/commercial.mjs
npm run prepare-data
npm run validate
```

Les scripts conservent un cache, une date, les réponses brutes, les licences et les lacunes. Les candidats ne deviennent pas des noms vérifiés. Le cache peut être effacé pour actualiser les sources ; revoir les changements avant de publier, particulièrement les licences et l’identité des photographies. `scripts/import/seeds.json` est une liste de recherches, pas une table de noms locaux validés.

Les photos sont associées aux entités Wikidata par P18 et les espèces sont rapprochées par P225 exact. Le contrôle individuel des photographies et la qualité éditoriale restent indispensables. Des photographies peuvent représenter la plante entière, un spécimen ou un poisson entier. Aucun nom de pays n’est déduit d’un libellé linguistique.

## Structure

```text
src/pages/                  Pages statiques, produits/[slug], pays/[iso]
src/components/             Îlots React et composants Astro
src/lib/                    Schémas, recherche, accès, stockage, services
src/data/published/         Instantanés validés, licences séparées
data/raw/                   Données brutes et rapport d’import
data/candidates/            Lacunes et candidats non publiés
scripts/import/             Collecte rejouable avec cache et reprises
public/images/              Vraies photos WebP, 400 et 960 pixels
public/data/                Données téléchargeables avec provenance
tests/                      Logique et parcours navigateur
docs/                       Sources, qualité, lacunes et feuille de route
```

Nom, logo textuel et palette : `src/data/site.ts`. Les modèles sont dans `src/lib/schema.ts`. Les identifiants restent indépendants des libellés. Les données Open Food Facts gardent leurs propres licences ODbL / Database Contents License ; les dérivés cartographiques et photos gardent les licences par source. Lire `docs/SOURCES.md` avant toute réutilisation.

## Fonctionnalités et limites

Recherche exacte, normalisation des accents, alias et fautes modérées ; filtres dans l’URL ; favoris locaux ; comparaison de trois fiches ; zoom ; copier un nom ; partage ; brouillon et export JSON. Les contributions ne sont pas envoyées, ne sont pas publiques et ne publient jamais automatiquement. Aucun historique de recherche n’est conservé. Les erreurs de stockage sont signalées. Pas de reconnaissance photo, compte, boutique, transaction, stock, prix, publicité ou traceur actif.

La couverture culturelle reste une lacune majeure : ce premier lot documente des appellations linguistiques, pas des usages régionaux. Les 20 pays restent explorables ; les contextes sans preuves affichent un état vide. Les références commerciales ne sont pas liées automatiquement à un ingrédient.

## Hébergement

Dépôt dédié AfroAtlas et GitHub Pages pour le prototype documentaire. Aucun usage commercial opérationnel n’est présumé. Une version monétisée doit faire l’objet d’un examen du périmètre d’usage et d’un hébergement adapté, sans garantie d’admissibilité sur Pages. Voir `docs/MONETIZATION.md`.

Pour exécuter les tests Playwright : `npx playwright install chromium`, puis `npm run test:e2e`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` peut désigner un navigateur Chromium installé. `PLAYWRIGHT_BASE_URL` permet de tester une publication. Les objectifs LCP/CLS/INP ne sont pas des mesures promises : mesurer réellement le site et documenter les résultats.
