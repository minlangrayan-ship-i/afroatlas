import { readFile, access } from 'node:fs/promises';
import { catalogueSchema, commercialSchema } from '../src/lib/schema';
import { countries, europeanContexts } from '../src/data/countries';
const data = catalogueSchema.parse(
  JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8')),
);
commercialSchema.parse(
  JSON.parse(await readFile('src/data/published/commercial-off.json', 'utf8')),
);
const groups = [data.products, data.names, data.images, data.sources, data.evidence];
for (const group of groups) {
  const ids = group.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate ID');
}
const productIds = new Set(data.products.map((p) => p.id)),
  sourceIds = new Set(data.sources.map((s) => s.id)),
  evidenceIds = new Set(data.evidence.map((e) => e.id));
for (const p of data.products) {
  if (!data.images.some((i) => i.id === p.imageId)) throw new Error('Image missing');
  for (const id of p.sourceIds) if (!sourceIds.has(id)) throw new Error('Product source missing');
}
for (const n of data.names) {
  if (
    !productIds.has(n.productId) ||
    !n.evidenceIds.length ||
    n.evidenceIds.some((id) => !evidenceIds.has(id))
  )
    throw new Error('Name evidence missing');
  if (n.status === 'candidate' || n.status === 'rejected')
    throw new Error('Unpublishable assertion');
  if (
    n.status === 'reviewed' &&
    !n.evidenceIds.some((id) => data.evidence.find((e) => e.id === id)?.checkedBy)
  )
    throw new Error('Review without reviewer');
}
for (const e of data.evidence)
  if (!sourceIds.has(e.sourceId)) throw new Error('Evidence source missing');
for (const image of data.images) {
  await access(`public${image.localPath}`);
  await access(`public${image.smallPath}`);
  if (/<[^>]+>/.test(image.creator + image.attribution))
    throw new Error('HTML metadata not cleaned');
}
if (countries.length !== 20 || europeanContexts.length !== 5)
  throw new Error('Geographic coverage incorrect');
console.log(
  `Validated ${data.products.length} products, ${data.names.length} name assertions, ${data.images.length} credited photographs, 20 African countries and 5 European contexts.`,
);
