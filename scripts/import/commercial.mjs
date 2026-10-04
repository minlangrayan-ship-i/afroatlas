import { collectPages, json, date } from './common.mjs';
const urls = [
  'https://world.openfoodfacts.org/api/v2/search?categories_tags_en=ginger&page_size=5&fields=code,product_name,product_name_fr,brands,quantity,ingredients_text,ingredients_text_fr,origins,manufacturing_places,countries_tags,image_front_url,ingredients',
  'https://world.openfoodfacts.org/api/v2/search?categories_tags_en=turmeric&page_size=5&fields=code,product_name,product_name_fr,brands,quantity,ingredients_text,ingredients_text_fr,origins,manufacturing_places,countries_tags,image_front_url,ingredients',
];
const references = [],
  gaps = [];
for (const url of urls) {
  try {
    const maxPages = Math.max(1, Math.min(3, Number(process.env.OFF_IMPORT_PAGES || 1)));
    const records = await collectPages({
      urlForPage: (page) => (page === 1 ? url : `${url}&page=${page}`),
      readItems: (data) => data.products || [],
      maxPages,
      maxItems: 5 * maxPages,
      delayMs: 6500,
    });
    for (const record of records) {
      if (!record.code || !record.brands || !(record.product_name_fr || record.product_name))
        continue;
      if (references.some((reference) => reference.barcode === record.code)) continue;
      references.push({
        id: `off-${record.code}`,
        brandId: `off-brand-${record.brands}`,
        brand: record.brands,
        barcode: record.code,
        tradeName: record.product_name_fr || record.product_name,
        packageImageIds: [],
        quantity: record.quantity || null,
        unit: null,
        ingredientsDeclared: record.ingredients_text_fr || record.ingredients_text || null,
        originClaim: record.origins || null,
        manufactureCountryIds: [],
        manufacturingPlaceDeclared: record.manufacturing_places || null,
        marketCountryIds: record.countries_tags || [],
        sourceRecordId: record.code,
        sourceUrl: `https://world.openfoodfacts.org/product/${record.code}`,
        retrievedAt: date,
        status: 'documented',
        label: 'Référence documentée ; disponibilité en boutique non vérifiée',
        relations: [],
      });
    }
  } catch (error) {
    gaps.push({ url, reason: error.message });
  }
}
await json('src/data/published/commercial-off.json', {
  license: 'ODbL-1.0 / Database Contents License',
  licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
  imageLicense: 'CC BY-SA (aucune image importée dans ce lot)',
  references,
  gaps,
  importedAt: date,
  note: 'Instantané Open Food Facts identifié et redistribué sous ODbL. Aucune relation à un ingrédient publiée sans preuve explicite. Provenance, fabrication et marchés restent distincts. Les noms de marques ne sont pas des noms locaux.',
});
console.log(`OFF ${references.length} références, ${gaps.length} lacunes`);
