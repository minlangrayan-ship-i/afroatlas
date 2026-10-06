import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const geo = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const catalogue = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
// Correct only the documented drink; keep taxonomy, edible parts and commercial forms separate.
const folereDrink = catalogue.products.find((p) => p.slug === 'folere-boisson');
if (folereDrink && folereDrink.categoryId !== 'preparations') {
  folereDrink.categoryId = 'preparations';
  await writeFile('src/data/published/catalogue.json', JSON.stringify(catalogue, null, 2) + '\n');
}
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[-‐‑–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const searchIndex = Object.fromEntries(
  catalogue.products.map((p) => [
    p.id,
    [
      ...new Set(
        [
          p.labelFr,
          p.labelEn || '',
          p.labelAr || '',
          p.scientificName || '',
          ...(p.scientificNames || []),
          ...catalogue.names.filter((n) => n.productId === p.id).map((n) => n.name),
        ]
          .map(normalize)
          .filter(Boolean),
      ),
    ],
  ]),
);
await writeFile(
  'src/data/published/search-index.json',
  JSON.stringify(searchIndex, null, 2) + '\n',
);
await writeFile('src/data/published/regions.json', JSON.stringify(geo.regions, null, 2) + '\n');
await mkdir('public/data', { recursive: true });
for (const name of ['catalogue', 'geography', 'commercial-off', 'search-index'])
  await copyFile(`src/data/published/${name}.json`, `public/data/${name}.json`);
await copyFile('data/research/cameroon-corpus.json', 'public/data/cameroon-corpus.json');
console.log('Public snapshots and light region index refreshed.');
