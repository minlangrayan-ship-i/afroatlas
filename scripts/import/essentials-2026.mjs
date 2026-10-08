// Adds staple products often searched for but missing from the catalogue (rice, millet,
// fonio, shea, palm oil, kola…). Same policy as catalogue.mjs: an exact Wikidata P225 match,
// names from Wikidata labels and aliases (no country inferred), and a P18 photograph under an
// accepted licence. New photographs stay complementary and pending until a visual review.
// Usage: node scripts/import/essentials-2026.mjs [--dry-run] [--test]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { request, date, plain } from './common.mjs';

const dryRun = process.argv.includes('--dry-run');
// --test runs the import on a species already cached locally, without writing anything.
const test = process.argv.includes('--test');
const seeds = test
  ? [['gombo-test', 'Gombo (test)', ['Abelmoschus esculentus'], 'vegetables', ['frais']]]
  : [
      ['riz', 'Riz', ['Oryza sativa'], 'staples', ['grains']],
      ['riz-africain', 'Riz africain', ['Oryza glaberrima'], 'staples', ['grains']],
      ['mil', 'Mil perlé', ['Cenchrus americanus', 'Pennisetum glaucum'], 'staples', ['grains']],
      ['sorgho', 'Sorgho', ['Sorghum bicolor'], 'staples', ['grains']],
      ['fonio', 'Fonio', ['Digitaria exilis'], 'staples', ['grains']],
      ['teff', 'Teff', ['Eragrostis tef'], 'staples', ['grains']],
      ['voandzou', 'Voandzou', ['Vigna subterranea'], 'staples', ['graines']],
      ['pois-angole', 'Pois d’Angole', ['Cajanus cajan'], 'staples', ['graines']],
      ['igname-blanche', 'Igname blanche', ['Dioscorea rotundata'], 'staples', ['tubercule']],
      ['karite', 'Karité', ['Vitellaria paradoxa'], 'preparations', ['amandes', 'beurre']],
      [
        'palmier-huile',
        'Palmier à huile',
        ['Elaeis guineensis'],
        'preparations',
        ['fruits', 'huile'],
      ],
      ['kola-nitida', 'Kola (Cola nitida)', ['Cola nitida'], 'fruits', ['noix']],
      ['kola-acuminata', 'Kola (Cola acuminata)', ['Cola acuminata'], 'fruits', ['noix']],
      ['nere', 'Néré', ['Parkia biglobosa'], 'spices', ['graines', 'pulpe']],
      [
        'egusi-cucumeropsis',
        'Egusi — Cucumeropsis mannii',
        ['Cucumeropsis mannii'],
        'spices',
        ['graines'],
      ],
      [
        'egusi-citrullus',
        'Egusi — Citrullus mucosospermus',
        ['Citrullus mucosospermus'],
        'spices',
        ['graines'],
      ],
      ['datte', 'Datte', ['Phoenix dactylifera'], 'fruits', ['fruits']],
      ['corossol', 'Corossol', ['Annona muricata'], 'fruits', ['fruits']],
      ['papaye', 'Papaye', ['Carica papaya'], 'fruits', ['fruits']],
    ];
// African languages Wikidata often labels, beyond those of catalogue.mjs.
const languages = {
  fr: '',
  en: '',
  ar: '',
  pt: '',
  sw: '',
  wo: '',
  yo: '',
  ha: '',
  am: '',
  mg: '',
  ig: 'Igbo',
  ff: 'Peul',
  ln: 'Lingala',
  bm: '',
  zu: 'Zoulou',
  xh: 'Xhosa',
  so: 'Somali',
  om: 'Oromo',
  ti: 'Tigrinya',
  rw: 'Kinyarwanda',
  tw: 'Twi',
  ee: 'Éwé',
  kg: 'Kikongo',
  lg: 'Luganda',
  sn: 'Shona',
  ny: 'Chichewa',
  kab: 'Kabyle',
  ary: 'Arabe marocain',
};

const file = 'src/data/published/catalogue.json';
const catalogue = JSON.parse(await readFile(file, 'utf8'));
const upsert = (key, value) => {
  const old = catalogue[key].findIndex((row) => row.id === value.id);
  if (old >= 0) catalogue[key][old] = value;
  else catalogue[key].push(value);
};
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

async function findEntity(scientificNames) {
  for (const scientific of scientificNames) {
    const search = await request(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(scientific)}&language=en&limit=5&format=json`,
    );
    for (const match of search.search || []) {
      const data = await request(
        `https://www.wikidata.org/wiki/Special:EntityData/${match.id}.json`,
      );
      const item = data.entities[match.id];
      if (item.claims?.P225?.some((c) => c.mainsnak.datavalue?.value === scientific))
        return { entity: item, scientific };
    }
  }
  return {};
}

async function photograph(entity, slug, labelFr) {
  const photo = entity.claims?.P18?.find((c) => c.mainsnak.datavalue?.value)?.mainsnak.datavalue
    .value;
  if (!photo || /\.(svg|pdf|tif|tiff)$/i.test(photo))
    return { gap: 'Photographie raster P18 absente' };
  const info = await request(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent('File:' + photo)}&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=960`,
  );
  const ii = Object.values(info.query.pages)[0].imageinfo?.[0];
  const meta = ii?.extmetadata;
  const license = plain(meta?.LicenseShortName?.value);
  if (!/^(CC BY|CC0|Public domain)/i.test(license) || /NC|ND/i.test(license))
    return { gap: `Licence non retenue: ${license}` };
  const large = `public/images/${slug}-960.webp`,
    small = `public/images/${slug}-400.webp`;
  // The test mode works offline from cached metadata and uses the thumbnail dimensions.
  let dims = { width: ii.thumbwidth || ii.width, height: ii.thumbheight || ii.height };
  if (!test) {
    const bytes = await request(ii.thumburl || ii.url, { binary: true });
    const resized = await sharp(bytes)
      .rotate()
      .resize({ width: 960, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });
    dims = { width: resized.info.width, height: resized.info.height };
    if (!dryRun) {
      await mkdir('public/images', { recursive: true });
      await sharp(bytes)
        .rotate()
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(large);
      await sharp(bytes)
        .rotate()
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 76 })
        .toFile(small);
    }
  }
  return {
    image: {
      id: `photo-${slug}`,
      localPath: `/images/${slug}-960.webp`,
      smallPath: `/images/${slug}-400.webp`,
      width: dims.width,
      height: dims.height,
      altFr: `Photographie liée à ${labelFr} sur Wikidata — vue de l’espèce, à contrôler`,
      creator: plain(meta.Artist?.value) || 'Auteur indiqué sur la page source',
      sourcePageUrl: ii.descriptionurl,
      licenseId: license,
      licenseUrl:
        plain(meta?.LicenseUrl?.value) || 'https://creativecommons.org/publicdomain/mark/1.0/',
      attribution:
        plain(meta.Attribution?.value) || `${plain(meta.Artist?.value)} · ${photo} · ${license}`,
      modifications: 'Redimensionnement, orientation EXIF et conversion WebP ; pas de recadrage',
      retrievedAt: date,
      title: photo,
      description: plain(meta?.ImageDescription?.value),
      // Not a shop form until a person has checked what the photograph shows.
      role: 'complementary',
      depictedForm: 'non documentée',
      verificationStatus: 'metadata_checked',
      metadataCheckedAt: date,
    },
  };
}

const report = { date, added: [], gaps: [] };
for (const [slug, labelFr, scientificNames, categoryId, formTypes] of seeds) {
  try {
    if (!test && catalogue.products.some((p) => p.slug === slug)) {
      report.gaps.push({ slug, reason: 'Fiche déjà présente ; non modifiée' });
      continue;
    }
    const { entity, scientific } = await findEntity(scientificNames);
    if (!entity)
      throw new Error(`Pas de correspondance P225 exacte : ${scientificNames.join(' / ')}`);
    const duplicate = catalogue.products.find((p) => p.taxonId === entity.id);
    if (duplicate && !test) throw new Error(`Taxon déjà décrit par la fiche ${duplicate.slug}`);
    const { image, gap } = await photograph(entity, slug, labelFr);
    if (!image) throw new Error(gap);
    const id = `product-${slug}`,
      sourceId = `wikidata-${entity.id}`;
    const source = {
      id: sourceId,
      title: `Wikidata · ${entity.id}`,
      publisher: 'Wikidata',
      url: `https://www.wikidata.org/wiki/${entity.id}`,
      licenseId: 'CC0-1.0',
      retrievedAt: date,
      datasetVersion: String(entity.lastrevid),
    };
    const names = [],
      evidence = [];
    for (const [lang, languageLabel] of Object.entries(languages)) {
      if (!entity.labels?.[lang]) continue;
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
          normalizedName: normalize(entry.value),
          languageCode: lang,
          countryIds: [],
          regionIds: [],
          culturalAreaIds: [],
          status: 'documented',
          evidenceIds: [eid],
          localContext: '',
          ...(entry.value === scientific ? { nameType: 'scientific' } : {}),
          ...(languageLabel ? { languageLabel } : {}),
        });
      }
    }
    const product = {
      id,
      slug,
      labelFr,
      labelEn: entity.labels?.en?.value || null,
      labelAr: entity.labels?.ar?.value || null,
      description: `Fiche d’identification de ${scientific}. Les appellations ci-dessous sont documentées linguistiquement ; leur usage géographique et culinaire reste à préciser.`,
      categoryId,
      entityType: 'taxon',
      scientificName: scientific,
      taxonId: entity.id,
      sourceIds: [sourceId],
      imageId: image.id,
      formTypes,
      verifiedAt: date,
      usage: null,
      editorialNote:
        'Fiche ajoutée pour couvrir un produit très recherché. La photographie reliée à l’entité montre l’espèce et doit être contrôlée avant de représenter une forme vendue en boutique.',
      documentaryScope: 'organism',
    };
    if (!dryRun && !test) {
      upsert('sources', source);
      for (const e of evidence) upsert('evidence', e);
      for (const n of names) upsert('names', n);
      upsert('images', image);
      upsert('products', product);
    }
    report.added.push({
      slug,
      entity: entity.id,
      scientific,
      names: names.length,
      license: image.licenseId,
    });
    console.log(`ADDED ${slug} (${entity.id}) ${names.length} noms · ${image.licenseId}`);
  } catch (error) {
    report.gaps.push({ slug, reason: error.message });
    console.log(`GAP ${slug}: ${error.message}`);
  }
}
if (!dryRun && !test) {
  await writeFile(file, JSON.stringify(catalogue, null, 2) + '\n');
  await mkdir('data/candidates', { recursive: true });
  await writeFile('data/candidates/essentials-2026.json', JSON.stringify(report, null, 2) + '\n');
}
console.log(
  `${dryRun || test ? 'Simulation' : 'Import'} : ${report.added.length} ajoutés, ${report.gaps.length} lacunes.`,
);
