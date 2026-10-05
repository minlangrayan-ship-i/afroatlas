import { readFile } from 'node:fs/promises';
import { request, json, plain } from './import/common.mjs';
const c = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const checkedAt = '2026-10-05';
const results = [];
// Bounded documentary research, never automatic selection or equivalence.
for (const p of c.products) {
  const i = c.images.find((i) => i.id === p.imageId);
  const row = {
    productId: p.id,
    slug: p.slug,
    scientificName: p.scientificName,
    scope: p.documentaryScope || null,
    forms: p.formTypes,
    imageId: i.id,
    currentRole: i.role || 'complementary',
    checkedAt,
    candidates: [],
    gap:
      i.role === 'primary'
        ? null
        : 'No visually accepted reusable photograph of the requested form.',
  };
  if (i.role !== 'primary') {
    const q = `"${p.scientificName || p.labelEn || p.labelFr}" filetype:bitmap`;
    row.query = q;
    try {
      const r = await request(
        'https://commons.wikimedia.org/w/api.php?' +
          new URLSearchParams({
            action: 'query',
            format: 'json',
            generator: 'search',
            gsrsearch: q,
            gsrnamespace: '6',
            gsrlimit: '4',
            prop: 'imageinfo',
            iiprop: 'url|size|extmetadata',
            iiurlwidth: '400',
          }),
      );
      row.candidates = Object.values(r.query?.pages || {})
        .filter((page) => page.imageinfo?.[0])
        .map((page) => {
          const info = page.imageinfo[0],
            m = info.extmetadata;
          return {
            title: page.title,
            page: info.descriptionurl,
            originalUrl: info.url,
            thumbnailUrl: info.thumburl,
            author: plain(m.Artist?.value),
            license: plain(m.LicenseShortName?.value),
            licenseUrl: plain(m.LicenseUrl?.value),
            description: plain(m.ImageDescription?.value),
            width: info.width,
            height: info.height,
            bytes: info.size,
            status: 'candidate_unverified',
          };
        });
    } catch (e) {
      row.error = String(e.message).slice(0, 250);
    }
    console.log(`${p.slug}: ${row.candidates.length} candidate(s), no automatic publication`);
  }
  results.push(row);
}
await json('data/research/image-coverage-research.json', {
  checkedAt,
  productsExamined: results.length,
  results,
});
