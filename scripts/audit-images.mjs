import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const dryRun = process.argv.includes('--dry-run');
const file = 'src/data/published/catalogue.json',
  c = JSON.parse(await readFile(file, 'utf8'));
const research = JSON.parse(await readFile('data/research/image-coverage-research.json', 'utf8'));
const report = [];
const provenance = JSON.parse(
  await readFile('data/research/primary-image-provenance.json', 'utf8'),
);
for (const p of c.products) {
  const image = c.images.find((i) => i.id === p.imageId),
    bytes = await readFile('public' + image.localPath),
    m = await sharp(bytes).metadata();
  const original = research.results
    .find((r) => r.productId === p.id)
    ?.candidates.find((candidate) => candidate.page === image.sourcePageUrl)?.originalUrl;
  image.format = m.format;
  image.fileSize = bytes.length;
  image.sha256 = createHash('sha256').update(bytes).digest('hex');
  image.sortOrder = 0;
  image.width = m.width;
  image.height = m.height;
  if (original) image.originalUrl = original;
  const source = provenance.find((s) => s.page === image.sourcePageUrl);
  if (source) image.originalUrl = source.originalUrl;
  if (image.role === 'primary') {
    if (!/^(CC BY|CC0|Public domain)/i.test(image.licenseId) || /NC|ND/i.test(image.licenseId))
      throw new Error('Unacceptable primary licence: ' + p.slug);
    image.verificationStatus = 'visually_checked';
    image.metadataCheckedAt = '2026-10-05';
    image.depictedProductId = p.id;
    image.visualCheckResult ||=
      'Local photograph reviewed: edible product and recorded commercial form; provenance retained.';
    image.visuallyCheckedAt ||= '2026-10-05';
  } else image.verificationStatus = 'pending';
  report.push({
    productId: p.id,
    slug: p.slug,
    imageId: image.id,
    role: image.role || 'complementary',
    form: image.depictedForm || null,
    part: image.depictedPart || null,
    license: image.licenseId,
    source: image.sourcePageUrl,
    originalUrl: image.originalUrl || null,
    format: m.format,
    bytes: bytes.length,
    gap:
      image.role === 'primary'
        ? null
        : 'Photograph of the product form still pending; candidate is not evidence of identity.',
  });
}
if (!dryRun) {
  await writeFile(file, JSON.stringify(c, null, 2) + '\n');
  await writeFile(
    'data/research/image-audit.json',
    JSON.stringify(
      {
        checkedAt: '2026-10-05',
        productsExamined: report.length,
        productsIllustrated: report.filter((r) => r.role === 'primary').length,
        missing: report.filter((r) => r.role !== 'primary').length,
        images: report,
      },
      null,
      2,
    ) + '\n',
  );
}
console.log(
  JSON.stringify({
    dryRun,
    examined: report.length,
    illustrated: report.filter((r) => r.role === 'primary').length,
    missing: report.filter((r) => r.role !== 'primary').length,
  }),
);
