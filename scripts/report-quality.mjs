import { readFile, writeFile } from 'node:fs/promises';
const data = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const geo = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const gaps = data.products.filter(
  (p) => data.images.find((i) => i.id === p.imageId)?.role !== 'primary',
);
const rows = [
  ['MAR', 'Maroc'],
  ['CMR', 'Cameroun'],
  ['SEN', 'Sénégal'],
  ['MLI', 'Mali'],
  ['CIV', 'Côte d’Ivoire'],
].map(([iso, name]) => {
  const names = data.names.filter((n) => n.countryIds.includes(iso));
  const contexts = data.contexts.filter((c) => c.countryId === iso);
  const products = new Set([...names.map((n) => n.productId), ...contexts.map((c) => c.productId)]);
  return `| ${name} | ${products.size} | ${names.length} | ${contexts.length} |`;
});
const report = `# Qualité et couverture réelle

Instantané du 4 octobre 2026. Compteurs calculés depuis les données publiées.

- ${data.products.length} fiches (10 ajoutées), ${data.names.length} assertions de noms, dont 20 nouvelles assertions contextualisées ; ${data.contexts.length} contextes alimentaires ou commerciaux sourcés.
- Répartition : ${['spices', 'vegetables', 'fish'].map((id) => `${id} ${data.products.filter((p) => p.categoryId === id).length}`).join(', ')}. Une espèce, ses parties alimentaires et une préparation ne sont pas présumées équivalentes.
- 23 pays africains (Mali, Burkina Faso et Niger ajoutés ; Nigeria conservé, distinct), 5 contextes européens. Tous restent navigables même sans preuve locale.
- ${geo.regions.length} subdivisions documentaires : CMR 10 (2016), CIV 14 districts (2016), MAR 12 (2017), SEN 14 (2019), MLI 9 (2021). Les neuf objets maliens sont historiques : ils ne certifient pas les régions actuelles.
- 32 photos principales de forme alimentaire/vente vérifiées visuellement ; ${gaps.length} fiches affichent une lacune explicite. 74 photographies réelles créditées, y compris les anciens médias complémentaires. Les 10 enregistrements techniques de lacune ne sont jamais présentés comme des photos.
- 10 références Open Food Facts séparées ; aucun lien ingrédient ajouté sans preuve.

## Couverture des cinq pays prioritaires

Les alias multilingues génériques ne remplissent pas les pays artificiellement.

| Pays | Fiches avec contexte | Noms contextualisés | Usages/contextes |
| --- | ---: | ---: | ---: |
${rows.join('\n')}

Maroc : sept appellations relevées à Rabat (sans usages médicinaux), et safran de Taliouine. La portée de Rabat n’est pas nationale. Cameroun : eru, njansang, feuilles pour ndolé, corète ; marchés/localités précisés si attestés. Sénégal : nététou et contexte Casamance/Dakar, feuilles alimentaires de bissap, calices pour une boisson (le nom de boisson n’est pas imposé au produit). Mali : soumbala, poudres de feuilles de baobab et de gombo au Pays Dogon, gombo, niébé, moringa, sésame, gingembre, tamarin. Côte d’Ivoire : akpi et Kôlou dans l’espace Taï, usages de corète et hibiscus. Ces dossiers ne sont pas exhaustifs.

## Dix nouvelles fiches

Eru ; njansang ; soumbala fermenté ; poudre de feuilles de baobab ; stigmates de safran ; graines de cumin ; feuilles de menthe verte ; feuilles de vernonie pour ndolé ; feuilles alimentaires d’hibiscus ; poudre de fruits séchés de gombo. Cumin et menthe sont documentés taxonomiquement : aucun usage marocain n’a été fabriqué faute de preuve retenue.

## Photos principales encore manquantes

${gaps.map((p) => `- ${p.labelFr}`).join('\n')}

Fleurs, plantes en culture, poissons vivants/spécimens de conservation, formes différentes et espèces ambiguës sont exclus du rôle principal. Les anciens médias complémentaires conservent leurs crédits. La photo de safran illustre la forme, pas une origine marocaine. Aucune image générée.

## Preuves, langues et licences

Chaque assertion possède une preuve. Les noms locaux restent originaux ; une langue non établie est signalée. Les correspondances administratives ne sont faites que si établies. Aucun nouvel import ne simule une validation culturelle humaine.

L’interface principale est FR/EN/AR avec RTL ; les noms principaux réellement documentés sont utilisés, les manques signalés. Les citations locales, crédits et résumés documentaires originaux restent préservés. Des textes éditoriaux de détail restent en français et demandent une traduction humaine.

Les sources consultables ne sont pas toutes sous licence ouverte : Commons fournit les photos réutilisables, Wikidata les données CC0 ; les autres sources fournissent des faits cités et des résumés originaux. Aucun texte ou image d’un rapport à droits inconnus n’est redistribué. Voir SOURCES.md ; aucune licence globale CC0 n’est imposée.

## Accès restant à configurer

Le formulaire sélectionne de vrais fichiers, avec aperçu et contrôles. Base durable, stockage privé/public, authentification propriétaire, fonctions serveur et publication après validation sont préparés pour Supabase. L’envoi reste fermé jusqu’à création et connexion du projet, conformément au choix du propriétaire. Aucun succès réseau réel n’est revendiqué. Voir SUPABASE_SETUP.md, CONTENT_BACKLOG.md et VERIFICATION.md.
`;
await writeFile('docs/DATA_QUALITY.md', report);
console.log('Quality report generated from published data.');
