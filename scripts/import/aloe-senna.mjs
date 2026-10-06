import { readFile, writeFile } from 'node:fs/promises';
const file = 'src/data/published/catalogue.json';
const c = JSON.parse(await readFile(file, 'utf8'));
const date = '2026-10-06';
const upsert = (key, value) => {
  const old = c[key].find((row) => row.id === value.id);
  if (old) Object.assign(old, value);
  else c[key].push(value);
};
const urls = {
  senna: 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:518341-1',
  aloe: 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:530017-1',
  pharmacopoeia: 'https://asric.africa/sites/default/files/2024-01/African%20Pharmacopoeia.pdf',
  mali: 'https://www.bibliosante.ml/bitstream/handle/123456789/14966/25P13.pdf?isAllowed=y&sequence=1',
  uganda: 'https://www.gssrr.org/JournalOfBasicAndApplied/article/view/1892',
};
for (const [key, title, publisher, licenseId, locator] of [
  [
    'senna',
    'Senna italica Mill. — nomenclature et distribution',
    'Royal Botanic Gardens, Kew — POWO / WCVP',
    'CC BY 3.0 — données Kew Backbone ; autres textes sous licences distinctes',
    'Taxonomy; Distribution / Native to',
  ],
  [
    'aloe',
    'Aloe vera (L.) Burm.f. — identité botanique',
    'Royal Botanic Gardens, Kew — POWO / WCVP',
    'CC BY 3.0 — données Kew Backbone ; autres textes sous licences distinctes',
    'Taxonomy / accepted species',
  ],
  [
    'pharmacopoeia',
    'African Pharmacopoeia — monographie Senna italica',
    'Union africaine — Scientific, Technical and Research Commission',
    'Consultation et citation ; aucune licence ouverte de redistribution établie',
    'p. 385, Common names; African names (Bambara); Part used',
  ],
  [
    'mali',
    'Espèces de Senna conservées dans l’herbier de l’INRMPT',
    'Kalifa Jean Baptiste KONE — USTTB, Faculté de pharmacie, thèse 2025',
    'Consultation et citation ; aucune licence ouverte de redistribution établie',
    'Tableau II, p. 5 imprimée (page 29 du PDF), herbier n° 159',
  ],
  [
    'uganda',
    'Aloe vera à Kitagata, district de Sheema : enquête locale',
    'Kamukama Adams, Twineomujuni Eliot, Agaba Gerald — IJSBAR 15(1), 2014',
    'Consultation et citation ; licence de redistribution non vérifiée',
    'Results, enquête réalisée en août 2012, culture dans les jardins des répondants',
  ],
]) {
  const id = `source-plant-${key}-20261006`;
  upsert('sources', {
    id,
    title,
    publisher,
    url: urls[key],
    licenseId,
    retrievedAt: date,
    datasetVersion: key === 'mali' ? '2025' : key === 'uganda' ? '2014' : `consulté le ${date}`,
    accessNote:
      'Faits et appellations cités avec leur périmètre. Aucun PDF, texte intégral ou photographie de ces publications n’est redistribué.',
  });
  upsert('evidence', {
    id: `evidence-plant-${key}-20261006`,
    sourceId: id,
    assertionType:
      key === 'mali' || key === 'pharmacopoeia' ? 'documented-name' : 'identity-and-context',
    locator,
    shortNote:
      key === 'mali'
        ? 'Senna italica est associé à mba bali dans la colonne des noms bambara. Les autres espèces du tableau restent distinctes.'
        : key === 'pharmacopoeia'
          ? 'La monographie associe Balibali et M’bali mbali à Senna italica. Le nom abrégé Mbali fourni par le propriétaire n’est pas certifié comme appellation distincte.'
          : 'Fait documentaire contrôlé ; aucune équivalence culinaire ou efficacité thérapeutique déduite.',
    checkedAt: date,
    checkedBy: 'Codex — contrôle documentaire, sans validation culturelle humaine',
  });
}
for (const [slug, qid, revision] of [
  ['aloe-vera', 'Q80079', '2550694446'],
  ['sene-africain', 'Q7450834', '2535288001'],
]) {
  const id = `source-plant-wikidata-${slug}`;
  upsert('sources', {
    id,
    title: `Wikidata ${qid} — libellés documentés`,
    publisher: 'Wikidata',
    url: `https://www.wikidata.org/wiki/${qid}?oldid=${revision}`,
    licenseId: 'CC0',
    retrievedAt: date,
    datasetVersion: revision,
  });
  upsert('evidence', {
    id: `evidence-plant-wikidata-${slug}`,
    sourceId: id,
    assertionType: 'documented-label',
    locator: `${qid}, labels fr / en / ar, révision ${revision}`,
    shortNote: 'Libellés présents dans la révision ; une langue ne prouve pas un usage national.',
    checkedAt: date,
    checkedBy: 'Codex — contrôle du JSON Wikidata',
  });
}
const missingImage =
  c.images.find((i) => i.localPath === '/images/product-form-pending.svg') ||
  c.images.find((i) => i.role !== 'primary');
for (const [
  slug,
  labelFr,
  labelEn,
  labelAr,
  scientificName,
  qid,
  sourceKeys,
  description,
  usage,
  consumedPart,
  forms,
] of [
  [
    'aloe-vera',
    'Aloe vera — feuille',
    'Aloe vera',
    'صبر حقيقي',
    'Aloe vera',
    'Q80079',
    ['aloe', 'uganda'],
    'Plante succulente, identifiée comme Aloe vera (L.) Burm.f. La photographie montre une feuille coupée et son gel intérieur, et non un produit cosmétique ou une boisson.',
    'Une enquête à Kitagata, dans le district de Sheema en Ouganda, relève sa culture dans les jardins des répondants. Ce constat local ne prouve pas un usage alimentaire national. Aucun conseil de consommation ni bénéfice médical n’est établi par cette fiche.',
    'feuille coupée — gel visible, sans présumer de son aptitude à la consommation',
    ['frais'],
  ],
  [
    'sene-africain',
    'Séné africain — Senna italica',
    'Dog senna',
    'سنا الكلب',
    'Senna italica',
    'Q7450834',
    ['senna', 'pharmacopoeia', 'mali'],
    'Espèce de Fabaceae documentée sous les noms bambara M’bali mbali, Balibali et mba bali. La recherche « Mbali » retrouve cette fiche. Les noms locaux sont rattachés au contexte malien, sans être attribués aux autres pays de présence.',
    'La pharmacopée africaine décrit des folioles séchées dans un contexte médicinal. Cette fiche d’identification ne donne aucune dose ou recommandation d’usage. Kew documente la présence botanique au Mali, au Cameroun, en Ouganda, au Zimbabwe et au Tchad. La présence en Zambie reste à confirmer dans les sources retenues.',
    'organisme — folioles citées par la source, sans qualification alimentaire',
    ['plante / identité botanique', 'séché'],
  ],
]) {
  const id = `product-${slug}`;
  const old = c.products.find((p) => p.id === id);
  upsert('products', {
    id,
    slug,
    labelFr,
    labelEn,
    labelAr,
    description,
    categoryId: 'herbs',
    entityType: 'taxon',
    scientificName,
    taxonId: qid,
    sourceIds: [
      ...sourceKeys.map((k) => `source-plant-${k}-20261006`),
      `source-plant-wikidata-${slug}`,
    ],
    imageId: old?.imageId || missingImage.id,
    formTypes: forms,
    verifiedAt: date,
    usage,
    editorialNote:
      'Identification botanique et faits sourcés ; ni certification alimentaire, ni validation médicale. Les noms, formes et pays ne sont pas présumés équivalents.',
    consumedPart,
    documentaryScope: 'organism',
    verificationStatus: 'documented',
    identityEvidenceIds: sourceKeys.map((k) => `evidence-plant-${k}-20261006`),
  });
  for (const formType of forms)
    upsert('forms', {
      id: `form-${slug}-${formType === 'séché' ? 'dried' : 'identity'}`,
      productId: id,
      formType,
      description:
        formType === 'séché'
          ? 'Folioles séchées décrites dans la pharmacopée ; photographie commerciale encore à documenter.'
          : 'Forme visible d’identification ; ne représente pas une préparation transformée.',
      sourceIds: sourceKeys.map((k) => `source-plant-${k}-20261006`),
    });
}
const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’‘ʼ`]/g, "'")
    .trim();
const addName = (
  slug,
  name,
  languageCode,
  proof,
  countryIds = [],
  note = '',
  nameType = 'common',
) => {
  const evidence = c.evidence.find((e) => e.id === proof);
  const source = c.sources.find((s) => s.id === evidence.sourceId);
  upsert('names', {
    id: `name-${slug}-${languageCode}-${normalize(name).replace(/[^\p{L}\p{N}]+/gu, '-')}`,
    productId: `product-${slug}`,
    formId: null,
    name,
    normalizedName: normalize(name),
    languageCode,
    countryIds,
    regionIds: [],
    culturalAreaIds: [],
    status: 'documented',
    evidenceIds: [proof],
    localContext: note || 'Libellé documentaire ; aucun contexte géographique déduit de la langue.',
    sourceUrl: source.url,
    sourceLocator: evidence.locator,
    nameType,
    ...(countryIds.length
      ? {
          geographicScope: 'language_community',
          limitations:
            'Le rattachement au Mali est étayé par l’herbier INRMPT. Aucune région précise, ni usage de ce nom dans les autres pays, n’est établi.',
        }
      : {}),
  });
};
for (const [name, language] of [
  ['Aloe vera', 'fr'],
  ['Aloe vera', 'en'],
  ['صبر حقيقي', 'ar'],
])
  addName('aloe-vera', name, language, 'evidence-plant-wikidata-aloe-vera');
addName('aloe-vera', 'Aloe vera', 'la', 'evidence-plant-aloe-20261006', [], '', 'scientific');
for (const [name, language] of [
  ['Séné africain', 'fr'],
  ['Séné du Sénégal', 'fr'],
  ['Dog senna', 'en'],
  ['Italian senna', 'en'],
  ['Spanish senna', 'en'],
  ['سنا الكلب', 'ar'],
])
  addName('sene-africain', name, language, 'evidence-plant-pharmacopoeia-20261006');
for (const name of ['Balibali', "M'bali mbali"])
  addName(
    'sene-africain',
    name,
    'bm',
    'evidence-plant-pharmacopoeia-20261006',
    ['MLI'],
    'Appellation bambara de la pharmacopée africaine ; contexte malien recoupé avec l’herbier INRMPT.',
    'local',
  );
addName(
  'sene-africain',
  'mba bali',
  'bm',
  'evidence-plant-mali-20261006',
  ['MLI'],
  'Nom bambara relevé dans le tableau des spécimens de l’herbier INRMPT, Mali ; aucune région plus précise établie.',
  'local',
);
addName(
  'sene-africain',
  'Senna italica',
  'la',
  'evidence-plant-senna-20261006',
  [],
  '',
  'scientific',
);
for (const [countryId, country] of [
  ['MLI', 'Mali'],
  ['CMR', 'Cameroun'],
  ['UGA', 'Ouganda'],
  ['ZWE', 'Zimbabwe'],
  ['TCD', 'Tchad'],
])
  upsert('contexts', {
    id: `context-senna-presence-${countryId}`,
    productId: 'product-sene-africain',
    countryId,
    regionIds: [],
    localContext: `Présence botanique — ${country}`,
    description:
      'Pays inclus dans la distribution native de Senna italica selon Kew. Ce relevé ne prouve ni usage culinaire, ni disponibilité en boutique, ni emploi du nom bambara dans ce pays.',
    sourceId: 'source-plant-senna-20261006',
    locator: 'Distribution / Native to',
    form: 'plante / identité botanique',
    relationType: 'presence',
  });
upsert('contexts', {
  id: 'context-aloe-kitagata-cultivation',
  productId: 'product-aloe-vera',
  countryId: 'UGA',
  regionIds: [],
  localContext: 'Jardins des répondants — Kitagata, district de Sheema',
  description:
    'Culture domestique rapportée dans une enquête locale menée en août 2012 dans l’ouest de l’Ouganda. La portée est celle des répondants de Kitagata ; aucun usage alimentaire national ou résultat clinique n’est déduit.',
  sourceId: 'source-plant-uganda-20261006',
  locator: 'Results, culture dans les jardins / plantations des répondants',
  form: 'plante / identité botanique',
  relationType: 'cultivation',
});
await writeFile(file, JSON.stringify(c, null, 2) + '\n');
console.log(
  'Added Aloe vera and Senna italica, sourced names and six bounded country contexts. Zambia remains unconfirmed.',
);
