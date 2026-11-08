// Country links stated by Wikidata for the 2026 West and North Africa records:
// P495 (country of origin) for preparations, P183 (endemic to) for a species.
// Only countries present in AfroAtlas are kept; nothing else is inferred.
// Usage: node scripts/import/origines-2026.mjs
import { readFile, writeFile } from 'node:fs/promises';

const facts = [
  ['attieke', 'CIV', 'P495', 'Pays d’origine indiqué par Wikidata'],
  ['smen', 'MAR', 'P495', 'Pays d’origine indiqué par Wikidata'],
  ['khlii', 'MAR', 'P495', 'Pays d’origine indiqué par Wikidata'],
  ['couscous', 'TUN', 'P495', 'Un des pays d’origine indiqués par Wikidata'],
  ['couscous', 'DZA', 'P495', 'Un des pays d’origine indiqués par Wikidata'],
  ['argan', 'MAR', 'P183', 'Espèce endémique de ce pays selon Wikidata'],
  ['argan', 'DZA', 'P183', 'Espèce endémique de ce pays selon Wikidata'],
];
const file = 'src/data/published/catalogue.json';
const catalogue = JSON.parse(await readFile(file, 'utf8'));
for (const [slug, country, property, note] of facts) {
  const product = catalogue.products.find((p) => p.slug === slug);
  if (!product) throw new Error(`Fiche inconnue : ${slug}`);
  const row = {
    id: `context-wikidata-${slug}-${country.toLowerCase()}`,
    productId: product.id,
    countryId: country,
    regionIds: [],
    localContext: note,
    description: `${note} (${property}). Ne précise ni région, ni usage culinaire, ni présence en boutique.`,
    sourceId: product.sourceIds[0],
    locator: `${property} — ${product.taxonId}`,
    form: product.formTypes[0],
    relationType: 'presence',
  };
  const i = catalogue.contexts.findIndex((c) => c.id === row.id);
  if (i >= 0) catalogue.contexts[i] = row;
  else catalogue.contexts.push(row);
}
await writeFile(file, JSON.stringify(catalogue, null, 2) + '\n');
console.log(`${facts.length} repères pays ajoutés.`);
