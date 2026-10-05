import { readFile } from 'node:fs/promises';
import { request, json, plain } from './import/common.mjs';
const c = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const titles = c.images
  .filter((i) => i.role === 'primary')
  .map((i) => decodeURIComponent(i.sourcePageUrl.split('/wiki/')[1] || ''))
  .filter((t) => t.startsWith('File:'));
const records = [];
for (let offset = 0; offset < titles.length; offset += 15) {
  const r = await request(
    'https://commons.wikimedia.org/w/api.php?' +
      new URLSearchParams({
        action: 'query',
        format: 'json',
        titles: titles.slice(offset, offset + 15).join('|'),
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
      }),
  );
  for (const p of Object.values(r.query?.pages || {})) {
    const info = p.imageinfo?.[0];
    if (!info) throw new Error('Missing photograph metadata ' + p.title);
    const m = info.extmetadata,
      license = plain(m.LicenseShortName?.value);
    if (!/^(CC BY|CC0|Public domain)/i.test(license) || /NC|ND/i.test(license))
      throw new Error('Unacceptable licence ' + p.title);
    records.push({
      title: p.title,
      page: info.descriptionurl,
      originalUrl: info.url,
      author: plain(m.Artist?.value),
      license,
      licenseUrl: plain(m.LicenseUrl?.value),
      checkedAt: '2026-10-05',
    });
  }
}
await json('data/research/primary-image-provenance.json', records);
console.log(`Checked ${records.length} primary-photo source pages and explicit reusable licences.`);
