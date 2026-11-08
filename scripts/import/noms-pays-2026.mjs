// Adds names tied to a country by a readable source (article, FAO or PROTA page, FishBase,
// institutional report). Each name keeps its source, the place where it appears and the
// language the source gives; a language never extends a name to another country.
// Input: data/candidates/noms-pays-2026.json, curated by hand after reading each source:
//   [{ slug, name, country, languageCode?, languageLabel?, source: { title, publisher, url,
//      licenseId }, locator, note }]
// Usage: node scripts/import/noms-pays-2026.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { date } from './common.mjs';

const file = 'src/data/published/catalogue.json';
const catalogue = JSON.parse(await readFile(file, 'utf8'));
const rows = JSON.parse(await readFile('data/candidates/noms-pays-2026.json', 'utf8'));
const upsert = (key, row) => {
  const i = catalogue[key].findIndex((r) => r.id === row.id);
  if (i >= 0) catalogue[key][i] = row;
  else catalogue[key].push(row);
};
const normalize = (v) =>
  v
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
const short = (v) => createHash('sha256').update(v).digest('hex').slice(0, 10);
const countryNames = {
  CIV: 'Côte d’Ivoire',
  GIN: 'Guinée',
  MLI: 'Mali',
  SEN: 'Sénégal',
  MAR: 'Maroc',
  TUN: 'Tunisie',
};
let added = 0;
for (const row of rows) {
  const product = catalogue.products.find((p) => p.slug === row.slug);
  if (!product) throw new Error(`Fiche inconnue : ${row.slug}`);
  // A source may give a language without a country: the name then stays tied to the language.
  if (row.country && !countryNames[row.country]) throw new Error(`Pays non prévu : ${row.country}`);
  const sourceId = `source-pays-${short(row.source.url)}`;
  upsert('sources', {
    id: sourceId,
    title: row.source.title,
    publisher: row.source.publisher,
    url: row.source.url,
    licenseId: row.source.licenseId,
    retrievedAt: date,
    datasetVersion: `consulté le ${date}`,
    accessNote:
      'Seuls le nom et son contexte sont cités ; le texte de la source n’est pas reproduit.',
  });
  const key = short(`${row.slug}|${row.name}|${row.country}|${row.source.url}`);
  const evidenceId = `evidence-pays-${key}`;
  upsert('evidence', {
    id: evidenceId,
    sourceId,
    assertionType: 'name-usage',
    locator: row.locator,
    shortNote: row.note,
    checkedAt: date,
    checkedBy: 'AfroAtlas — lecture de la source',
  });
  upsert('names', {
    id: `name-pays-${key}`,
    productId: product.id,
    formId: null,
    name: row.name,
    normalizedName: normalize(row.name),
    languageCode: row.languageCode || 'local-und',
    ...(row.languageLabel ? { languageLabel: row.languageLabel } : {}),
    countryIds: row.country ? [row.country] : [],
    regionIds: [],
    culturalAreaIds: [],
    status: 'documented',
    evidenceIds: [evidenceId],
    localContext: row.country
      ? `Nom cité pour ${countryNames[row.country]} par la source.`
      : 'Nom cité avec sa langue ; la source ne le rattache à aucun pays.',
    nameType: 'local',
    geographicScope: row.country ? 'country' : 'language_community',
  });
  if (!product.sourceIds.includes(sourceId)) product.sourceIds.push(sourceId);
  added++;
}
await writeFile(file, JSON.stringify(catalogue, null, 2) + '\n');
console.log(`${added} noms rattachés à un pays.`);
