import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { request, json, date, plain } from './common.mjs';
const seeds = JSON.parse(await readFile('scripts/import/seeds.json', 'utf8'));
const excluded = JSON.parse(await readFile('scripts/import/photo-exclusions.json', 'utf8'));
const products = [],
  images = [],
  names = [],
  sources = [],
  evidence = [],
  candidates = [];
const languages = ['fr', 'en', 'ar', 'sw', 'wo', 'yo', 'ha', 'am', 'pt', 'mg'];
for (const [slug, labelFr, scientific, categoryId] of seeds) {
  try {
    if (excluded[slug]) throw new Error(excluded[slug]);
    const search = await request(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(scientific)}&language=en&limit=5&format=json`,
    );
    let entity;
    for (const match of search.search || []) {
      const data = await request(
        `https://www.wikidata.org/wiki/Special:EntityData/${match.id}.json`,
      );
      const item = data.entities[match.id];
      if (item.claims?.P225?.some((c) => c.mainsnak.datavalue?.value === scientific)) {
        entity = item;
        break;
      }
    }
    if (!entity) throw new Error('Pas de correspondance scientifique exacte P225');
    const photo = entity.claims?.P18?.find((c) => c.mainsnak.datavalue?.value)?.mainsnak.datavalue
      .value;
    if (!photo || /\.(svg|pdf|tif|tiff)$/i.test(photo))
      throw new Error('Photographie raster P18 absente');
    const info = await request(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent('File:' + photo)}&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=960`,
    );
    const file = Object.values(info.query.pages)[0];
    const ii = file.imageinfo?.[0];
    const meta = ii?.extmetadata;
    const license = plain(meta?.LicenseShortName?.value);
    const licenseUrl = plain(meta?.LicenseUrl?.value);
    if (!/^(CC BY|CC0|Public domain)/i.test(license) || /NC|ND/i.test(license))
      throw new Error(`Licence non retenue: ${license}`);
    const photoDescription = plain(meta?.ImageDescription?.value);
    const bytes = await request(ii.thumburl || ii.url, { binary: true });
    await sharp(bytes)
      .rotate()
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`public/images/${slug}-960.webp`);
    await sharp(bytes)
      .rotate()
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(`public/images/${slug}-400.webp`);
    const dims = await sharp(`public/images/${slug}-960.webp`).metadata();
    const id = `product-${slug}`,
      sourceId = `wikidata-${entity.id}`,
      imageId = `photo-${slug}`;
    sources.push({
      id: sourceId,
      title: `Wikidata · ${entity.id}`,
      publisher: 'Wikidata',
      url: `https://www.wikidata.org/wiki/${entity.id}`,
      licenseId: 'CC0-1.0',
      retrievedAt: date,
      datasetVersion: String(entity.lastrevid),
    });
    images.push({
      id: imageId,
      localPath: `/images/${slug}-960.webp`,
      smallPath: `/images/${slug}-400.webp`,
      width: dims.width,
      height: dims.height,
      altFr: `Photographie de ${labelFr} — vue de l’espèce ou de son produit, voir le crédit`,
      creator: plain(meta.Artist?.value) || 'Auteur indiqué sur la page source',
      sourcePageUrl: ii.descriptionurl,
      licenseId: license,
      licenseUrl: licenseUrl || 'https://creativecommons.org/publicdomain/mark/1.0/',
      attribution:
        plain(meta.Attribution?.value) || `${plain(meta.Artist?.value)} · ${photo} · ${license}`,
      modifications: 'Redimensionnement, orientation EXIF et conversion WebP ; pas de recadrage',
      retrievedAt: date,
      title: photo,
      description: photoDescription,
    });
    const allowed = languages.filter((lang) => entity.labels?.[lang]);
    for (const lang of allowed) {
      const entries = [
        { value: entity.labels[lang].value, locator: `labels.${lang}.value` },
        ...(entity.aliases?.[lang] || [])
          .slice(0, 8)
          .map((a, i) => ({ value: a.value, locator: `aliases.${lang}[${i}].value` })),
      ];
      for (const [i, entry] of entries.entries()) {
        const eid = `evidence-${slug}-${lang}-${i}`;
        evidence.push({
          id: eid,
          sourceId,
          assertionType: 'name',
          locator: entry.locator,
          shortNote:
            'Libellé ou alias linguistique Wikidata ; aucun usage par pays, région ou boutique établi.',
          checkedAt: null,
          checkedBy: null,
        });
        names.push({
          id: `name-${slug}-${lang}-${i}`,
          productId: id,
          formId: null,
          name: entry.value,
          normalizedName: entry.value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .trim(),
          languageCode: lang,
          countryIds: [],
          regionIds: [],
          culturalAreaIds: [],
          status: 'documented',
          evidenceIds: [eid],
        });
      }
    }
    products.push({
      id,
      slug,
      labelFr,
      labelEn: entity.labels?.en?.value || null,
      description: `Fiche d’identification de ${scientific}. Les appellations ci-dessous sont documentées linguistiquement ; leur usage géographique et culinaire reste à préciser.`,
      categoryId,
      entityType: 'taxon',
      scientificName: scientific,
      taxonId: entity.id,
      sourceIds: [sourceId],
      imageId,
      formTypes: ['espèce / ingrédient brut'],
      verifiedAt: date,
      usage: null,
      editorialNote:
        'La photographie reliée à l’entité peut montrer la plante, ses fruits, un spécimen ou un poisson entier. Elle ne constitue pas une preuve de préparation alimentaire.',
    });
    console.log(`DOCUMENTED ${products.length}: ${labelFr} (${entity.id}) ${license}`);
  } catch (error) {
    candidates.push({ slug, labelFr, scientific, status: 'candidate', reason: error.message });
    console.log(`GAP ${labelFr}: ${error.message}`);
  }
  await json('src/data/published/catalogue.json', {
    products,
    images,
    names,
    sources,
    evidence,
    forms: [],
    relations: [],
    culturalAreas: [],
  });
  await json('data/candidates/catalogue.json', candidates);
}
await json('data/raw/import-report.json', {
  date,
  importer: 'catalogue.mjs',
  count: products.length,
  candidateCount: candidates.length,
  policy:
    'Correspondance P225 exacte et photographie P18 sous licence retenue. Statut documented uniquement ; pas de validation culturelle ni humaine simulée.',
});
