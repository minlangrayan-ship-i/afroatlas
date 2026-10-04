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
const countryIds = new Set([...countries, ...europeanContexts].map((c) => c.ISO3));
const geography = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const regionIds = new Set<string>(geography.regions.map((r: { id: string }) => r.id));
for (const p of data.products) {
  if (!data.images.some((i) => i.id === p.imageId)) throw new Error('Image missing');
  for (const id of p.sourceIds) if (!sourceIds.has(id)) throw new Error('Product source missing');
  for (const id of p.identityEvidenceIds || [])
    if (!evidenceIds.has(id)) throw new Error('Identity evidence missing');
  const image = data.images.find((i) => i.id === p.imageId)!;
  if (image.role === 'primary' && image.depictedProductId && image.depictedProductId !== p.id)
    throw new Error(`Incorrect primary identity: ${p.slug}`);
  if (
    image.role === 'primary' &&
    (!p.formTypes.includes(image.depictedForm) || !image.localPath.endsWith('.webp'))
  )
    throw new Error(`Incorrect primary form: ${p.slug}`);
}
for (const n of data.names) {
  if (
    n.countryIds.some((id) => !countryIds.has(id)) ||
    n.regionIds.some((id) => !regionIds.has(id))
  )
    throw new Error('Name geography missing');
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
for (const relation of data.relations)
  if (
    !productIds.has(relation.fromId) ||
    !productIds.has(relation.toId) ||
    relation.evidenceIds.some((id) => !evidenceIds.has(id))
  )
    throw new Error('Relation provenance missing');
for (const c of data.contexts)
  if (
    !productIds.has(c.productId) ||
    !sourceIds.has(c.sourceId) ||
    !countryIds.has(c.countryId) ||
    c.regionIds.some((id) => !regionIds.has(id))
  )
    throw new Error('Context provenance missing');
for (const image of data.images) {
  await access(`public${image.localPath}`);
  await access(`public${image.smallPath}`);
  if (/<[^>]+>/.test(image.creator + image.attribution))
    throw new Error('HTML metadata not cleaned');
}
if (countries.length !== 25 || europeanContexts.length !== 5)
  throw new Error('Geographic coverage incorrect');
console.log(
  `Validated ${data.products.length} products, ${data.names.length} name assertions, ${data.images.filter((i) => i.role === 'primary').length} product-form photographs, ${data.contexts.length} local contexts, ${countries.length} African countries and 5 European contexts.`,
);
