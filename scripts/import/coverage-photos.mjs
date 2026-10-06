import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { request, plain } from './common.mjs';
const selection = JSON.parse(
  await readFile('scripts/import/coverage-photo-selection.json', 'utf8'),
);
const c = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const photos = [];
// Download independent assets first. Catalogue mutation is sequential and saved once.
let next = 0;
async function download() {
  while (next < selection.length) {
    const s = selection[next++];
    if (s.status !== 'visually_accepted' || !s.reviewNote || !s.reviewedAt)
      throw Error('Unreviewed selection');
    const result = await request(
      'https://commons.wikimedia.org/w/api.php?' +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: 'File:' + s.title,
          prop: 'imageinfo',
          iiprop: 'url|extmetadata',
          iiurlwidth: '960',
        }),
    );
    const info = Object.values(result.query?.pages || {})[0]?.imageinfo?.[0];
    if (!info) throw Error('Missing Commons metadata: ' + s.title);
    const m = info.extmetadata,
      license = plain(m.LicenseShortName?.value);
    if (!/^(CC BY|CC0|Public domain)/i.test(license) || /NC|ND/i.test(license))
      throw Error('Unacceptable licence: ' + s.title);
    const creator = s.creatorOverride || plain(m.Artist?.value);
    if (!creator) throw Error('Unresolved creator: ' + s.title);
    const bytes = await request(info.thumburl || info.url, { binary: true });
    const buffers = await Promise.all(
      [400, 960].map((width) =>
        sharp(bytes)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer(),
      ),
    );
    photos.push({
      s,
      info,
      license,
      creator,
      buffers,
      description: plain(m.ImageDescription?.value),
      licenseUrl:
        plain(m.LicenseUrl?.value).replace(/^http:/, 'https:') ||
        'https://creativecommons.org/publicdomain/mark/1.0/',
    });
    console.log(`${s.slug}: ${s.role}, ${license}`);
  }
}
await Promise.all([download(), download()]);
for (const { s, info, license, creator, buffers, description, licenseUrl } of photos.sort((a, b) =>
  a.s.slug.localeCompare(b.s.slug),
)) {
  const p = c.products.find((p) => p.slug === s.slug);
  if (!p) throw Error('Unknown product: ' + s.slug);
  const id = 'coverage-photo-' + p.slug;
  const localPath = `/images/${p.slug}-coverage-960.webp`,
    smallPath = `/images/${p.slug}-coverage-400.webp`;
  const meta = await sharp(buffers[1]).metadata();
  const photo = {
    id,
    localPath,
    smallPath,
    width: meta.width,
    height: meta.height,
    altFr: `${p.labelFr} — ${s.part}`,
    creator,
    sourcePageUrl: info.descriptionurl,
    originalUrl: info.url,
    licenseId: license,
    licenseUrl,
    attribution: `${creator} · ${s.title} · ${license}`,
    modifications:
      'Orientation EXIF, redimensionnement et conversion WebP ; métadonnées supprimées, sans recadrage.',
    retrievedAt: s.reviewedAt,
    title: s.title,
    description,
    role: s.role,
    depictedForm: s.form,
    depictedPart: s.part,
    depictedProductId: s.depictedProductSlug
      ? c.products.find((p) => p.slug === s.depictedProductSlug).id
      : p.id,
    visuallyCheckedAt: s.reviewedAt,
    visualCheckResult: s.reviewNote,
    verificationStatus: 'visually_checked',
    metadataCheckedAt: s.reviewedAt,
    format: 'webp',
    fileSize: buffers[1].length,
    sha256: createHash('sha256').update(buffers[1]).digest('hex'),
    sortOrder: 0,
  };
  if (!dryRun) {
    await writeFile('public' + smallPath, buffers[0]);
    await writeFile('public' + localPath, buffers[1]);
    const old = c.images.find((i) => i.id === id);
    if (old) Object.assign(old, photo);
    else c.images.push(photo);
    p.imageId = id;
    if (s.role === 'primary' && !p.formTypes.includes(s.form)) p.formTypes.push(s.form);
    if (s.role === 'primary' && !c.forms.some((f) => f.productId === p.id && f.formType === s.form))
      c.forms.push({
        id: `form-photo-coverage-${p.slug}`,
        productId: p.id,
        formType: s.form,
        description: `Forme visible uniquement : ${s.part}. Aucune équivalence avec les autres formes.`,
        sourceIds: p.sourceIds,
      });
    p.editorialNote = `${s.reviewNote} Les photographies et preuves antérieures restent conservées.`;
    p.verifiedAt = s.reviewedAt;
  }
}
if (!dryRun)
  await writeFile('src/data/published/catalogue.json', JSON.stringify(c, null, 2) + '\n');
console.log(
  JSON.stringify({
    dryRun,
    assets: photos.length,
    primary: photos.filter((p) => p.s.role === 'primary').length,
    complementary: photos.filter((p) => p.s.role === 'complementary').length,
  }),
);
