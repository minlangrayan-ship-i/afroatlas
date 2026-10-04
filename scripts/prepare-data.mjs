import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const geo = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const catalogue = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
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
          p.scientificName || '',
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
console.log('Public snapshots and light region index refreshed.');
