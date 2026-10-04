import { readFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { request, json, plain, date } from './common.mjs';
const selection = JSON.parse(await readFile('scripts/import/photo-selection.json', 'utf8'));
const images = [];
await mkdir('data/research/photos', { recursive: true });
for (const [slug, [title, form]] of Object.entries(selection)) {
  try {
    const info = await request(
      'https://commons.wikimedia.org/w/api.php?' +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: `File:${title}`,
          prop: 'imageinfo',
          iiprop: 'url|extmetadata',
          iiurlwidth: '960',
        }),
    );
    const ii = Object.values(info.query.pages)[0].imageinfo?.[0];
    if (!ii) throw new Error('File absent');
    const meta = ii.extmetadata,
      license = plain(meta.LicenseShortName?.value);
    if (!/^(CC BY|CC0|Public domain)/i.test(license) || /NC|ND/i.test(license))
      throw new Error('Licence non réutilisable');
    const bytes = await request(ii.thumburl || ii.url, { binary: true });
    await sharp(bytes)
      .rotate()
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`data/research/photos/${slug}-960.webp`);
    await sharp(bytes)
      .rotate()
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(`data/research/photos/${slug}-400.webp`);
    const dims = await sharp(`data/research/photos/${slug}-960.webp`).metadata();
    images.push({
      slug,
      form,
      id: `shop-photo-${slug}`,
      localPath: `/images/${slug}-shop-960.webp`,
      smallPath: `/images/${slug}-shop-400.webp`,
      width: dims.width,
      height: dims.height,
      altFr: `${slug} — forme illustrée : ${form}`,
      creator: plain(meta.Artist?.value) || 'Auteur sur la page source',
      sourcePageUrl: ii.descriptionurl,
      licenseId: license,
      licenseUrl:
        plain(meta.LicenseUrl?.value) || 'https://creativecommons.org/publicdomain/mark/1.0/',
      attribution:
        plain(meta.Attribution?.value) || `${plain(meta.Artist?.value)} · ${title} · ${license}`,
      modifications: 'Redimensionnement, orientation EXIF et conversion WebP ; aucun recadrage',
      retrievedAt: date,
      title,
      description: plain(meta.ImageDescription?.value),
      role: 'primary',
      depictedForm: form,
    });
    console.log(`${slug}: ${license}`);
  } catch (e) {
    console.log(`GAP ${slug}: ${e.message}`);
  }
}
await json('data/research/selected-photos.json', images);
// Contact sheet for visual review; these assets are not public until reviewed.
const tiles = [];
for (const [i, p] of images.entries()) {
  const raster = await sharp(`data/research/photos/${p.slug}-400.webp`)
    .resize(180, 120, { fit: 'contain', background: '#faf7ef' })
    .toBuffer();
  tiles.push({ input: raster, left: (i % 6) * 200, top: Math.floor(i / 6) * 160 });
  const label = Buffer.from(
    `<svg width="190" height="32"><text x="3" y="20" font-size="13">${i + 1}. ${p.slug}</text></svg>`,
  );
  tiles.push({ input: label, left: (i % 6) * 200, top: Math.floor(i / 6) * 160 + 122 });
}
await sharp({
  create: {
    width: 1200,
    height: Math.ceil(images.length / 6) * 160,
    channels: 3,
    background: '#faf7ef',
  },
})
  .composite(tiles)
  .png()
  .toFile('data/research/photo-review.png');
