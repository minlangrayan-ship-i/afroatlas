import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { request, plain, json } from './common.mjs';
const selection = JSON.parse(await readFile('scripts/import/reviewed-form-selection.json', 'utf8'));
const c = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const dryRun = process.argv.includes('--dry-run'),
  download = process.argv.includes('--download-candidates');
const proposals = [];
await mkdir('data/research/photos', { recursive: true });
for (const s of selection) {
  const p = c.products.find((p) => p.slug === s.slug);
  if (!p) throw new Error('Unknown product');
  const r = await request(
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
  const info = Object.values(r.query?.pages || {})[0]?.imageinfo?.[0];
  if (!info) throw new Error('Missing source: ' + s.title);
  const m = info.extmetadata,
    license = plain(m.LicenseShortName?.value);
  if (!/^(CC BY|CC0|Public domain)/i.test(license) || /NC|ND/i.test(license))
    throw new Error('Unacceptable licence');
  const candidate = {
    ...s,
    page: info.descriptionurl,
    originalUrl: info.url,
    creator: s.creatorOverride || plain(m.Artist?.value),
    license,
    licenseUrl: plain(m.LicenseUrl?.value).replace(/^http:/, 'https:'),
    description: plain(m.ImageDescription?.value),
  };
  if (s.status === 'visually_accepted' && !candidate.creator)
    throw new Error('Resolve attribution before publication: ' + s.slug);
  proposals.push(candidate);
  if (download || (!dryRun && s.status === 'visually_accepted')) {
    const bytes = await request(info.thumburl || info.url, { binary: true });
    for (const width of [400, 960])
      await sharp(bytes)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(`data/research/photos/${s.slug}-review-${width}.webp`);
  }
  if (!dryRun && !download && s.status === 'visually_accepted') {
    if (!p.formTypes.includes(s.form)) p.formTypes.push(s.form);
    const id = 'form-photo-' + s.slug,
      localPath = `/images/${s.slug}-form-960.webp`,
      smallPath = `/images/${s.slug}-form-400.webp`;
    for (const [width, path] of [
      [960, localPath],
      [400, smallPath],
    ])
      await writeFile(
        'public' + path,
        await readFile(`data/research/photos/${s.slug}-review-${width}.webp`),
      );
    const meta = await sharp('public' + localPath).metadata();
    const image = {
      id,
      localPath,
      smallPath,
      width: meta.width,
      height: meta.height,
      altFr: `${p.labelFr} — ${s.part}, ${s.form}`,
      creator: candidate.creator,
      sourcePageUrl: candidate.page,
      originalUrl: candidate.originalUrl,
      licenseId: license,
      licenseUrl: candidate.licenseUrl || 'https://creativecommons.org/publicdomain/mark/1.0/',
      attribution: `${candidate.creator} · ${s.title} · ${license}`,
      modifications:
        'Orientation EXIF, redimensionnement et conversion WebP ; métadonnées supprimées, sans recadrage.',
      retrievedAt: '2026-10-05',
      title: s.title,
      description: candidate.description,
      role: 'primary',
      depictedForm: s.form,
      depictedPart: s.part,
      depictedProductId: p.id,
      visuallyCheckedAt: '2026-10-05',
      visualCheckResult: s.reviewNote,
      ...(s.creatorUrl ? { creatorUrl: s.creatorUrl } : {}),
    };
    const existing = c.images.find((i) => i.id === id);
    if (existing) Object.assign(existing, image);
    else c.images.push(image);
    p.imageId = id;
    p.editorialNote = `Photographie principale contrôlée : ${s.part}, ${s.form}. Elle ne représente pas les autres formes ni une provenance nationale. Les photographies antérieures restent conservées comme compléments documentaires.`;
  }
  console.log(`${s.slug}: ${s.status} · ${license}`);
}
if (!dryRun && !download)
  await writeFile('src/data/published/catalogue.json', JSON.stringify(c, null, 2) + '\n');
if (download) await json('data/research/reviewed-form-candidates.json', proposals);
console.log(
  JSON.stringify({
    dryRun,
    download,
    selected: selection.filter((s) => s.status === 'visually_accepted').length,
    candidates: proposals.length,
  }),
);
