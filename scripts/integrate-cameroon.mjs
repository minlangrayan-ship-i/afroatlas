// Deterministic integration of the owner's documentary corpus into the existing static site.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseCameroonText, isUnspecified } from './import/cameroon-text.mjs';
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);
const norm = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const file = 'src/data/published/catalogue.json';
const c = JSON.parse(await readFile(file, 'utf8'));
const corpus = parseCameroonText(await readFile('data/research/cameroon-source.txt', 'utf8'));
if (
  JSON.stringify(corpus.counts) !==
  JSON.stringify({ products: 35, names: 110, usages: 116, sources: 20, presences: 9 })
)
  throw Error('Corpus integrity changed');
const geography = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const date = '2026-10-05';
const put = (key, row) => {
  const i = c[key].findIndex((x) => x.id === row.id);
  if (i < 0) c[key].push(row);
  else c[key][i] = row;
};
const regionNames = {
  Centre: 'Centre',
  'Extrême-Nord': 'Far North',
  Nord: 'North',
  'Nord-Ouest': 'North-West',
  Adamaoua: 'Adamaoua',
  Est: 'East',
  Sud: 'South',
  'Sud-Ouest': 'South-West',
  Ouest: 'West',
  Littoral: 'Littoral',
};
const regionId = (label) => {
  const french = Object.keys(regionNames).find((n) => norm(n) === norm(label));
  const r = geography.regions.find(
    (r) => r.countryISO3 === 'CMR' && r.name === regionNames[french],
  );
  if (!r) throw Error('Unknown region ' + label);
  return r.id;
};
const sourceId = (id) => 'cm-corpus-' + id;
const references = (usage) =>
  [...usage.references.matchAll(/(src-[\w-]+)\s+—\s+(.+?)(?=;\s*src-|$)/g)].map((m) => ({
    sourceId: sourceId(m[1]),
    locator: m[2],
  }));
for (const s of corpus.sources)
  put('sources', {
    id: sourceId(s.id),
    title: s.title,
    publisher: s.publisher,
    url: s.url,
    licenseId: s.license,
    retrievedAt: date,
    datasetVersion: 'Corpus fourni par le propriétaire, version 0.1',
    accessNote: s.limitations,
  });
// Existing species-level records are reused. Profiles explicitly restricted to a consumed part remain separate from the organism.
const existing = {
  'p-njangsa-seeds': 'njansang',
  'p-fish-tilapia': 'tilapia-nil',
  'p-fish-sardinella': 'sardinelle-plate',
  'p-gnetum-leaves': 'eru',
  'p-folere-drink': 'folere-boisson',
  'p-cassava': 'manioc',
  'p-onion': 'oignon',
  'p-sweetpotato': 'patate-douce',
  'p-cowpea': 'niebe',
  'p-tamarind': 'tamarin',
};
const slugs = {
  'p-monodora': 'monodora-plante',
  'p-ricino': 'ricinodendron-plante',
  'p-dacryodes': 'safoutier',
  'p-irvingia': 'irvingia-plante',
  'p-fish-clarias': 'silure-clarias',
  'p-fish-heterobranchus': 'silure-heterobranchus',
  'p-fish-carp': 'carpe-commune',
  'p-fish-heterotis': 'kanga',
  'p-fish-hemichromis': 'poisson-panthere',
  'p-fish-parachanna': 'poisson-vipere',
  'p-fish-cod': 'morue',
  'p-fish-mackerel': 'maquereaux-groupe',
  'p-fish-croaker': 'courbines-groupe',
  'p-fish-barbus': 'barbus-groupe',
  'p-hibiscus': 'hibiscus-plante',
  'p-maize': 'mais-plante',
  'p-yam': 'ignames-groupe',
  'p-potato': 'pomme-de-terre',
  'p-plantain': 'bananes-a-cuire',
  'p-ocimum': 'basilic-tropical',
  'p-njama-leaves': 'njama-njama',
  'p-kpem': 'kpem',
  'p-baobab': 'baobab-plante',
  'p-mango': 'manguier',
  'p-purslane': 'pourpier',
};
const mapping = {};
const historicalId = 'cm-historical-north-1954';
put('culturalAreas', {
  id: historicalId,
  label: 'Nord Cameroun — aire historique (1954)',
  description:
    'Périmètre historique de la source Malzy ; aucune équivalence avec la région Nord actuelle ni attribution linguistique automatique.',
  sourceIds: [sourceId('src-malzy')],
});
const incomingNames = new Map();
for (const original of corpus.products) {
  const uses = corpus.usages.filter((u) => u.productId === original.id);
  const slug = existing[original.id] || slugs[original.id];
  if (!slug) throw Error('Mapping missing ' + original.id);
  let p = c.products.find((p) => p.slug === slug);
  const added = !existing[original.id];
  const scientific = isUnspecified(uses[0].scientificName) ? null : uses[0].scientificName;
  const category = original.id.startsWith('p-fish-')
    ? 'fish'
    : original.identity === 'preparation'
      ? 'preparations'
      : ['p-monodora', 'p-ricino', 'p-njangsa-seeds'].includes(original.id)
        ? 'spices'
        : ['p-dacryodes', 'p-irvingia', 'p-mango', 'p-tamarind', 'p-baobab'].includes(original.id)
          ? 'fruits'
          : original.id === 'p-ocimum'
            ? 'herbs'
            : ['p-maize', 'p-yam', 'p-potato', 'p-plantain'].includes(original.id)
              ? 'staples'
              : 'vegetables';
  if (!p) {
    const form =
      original.identity === 'preparation'
        ? original.id === 'p-kpem'
          ? 'préparé'
          : 'boisson'
        : original.identity === 'edible_part'
          ? 'frais'
          : original.id.startsWith('p-fish-')
            ? 'poisson / groupe commercial'
            : 'plante / identité botanique';
    const imageId = 'cm-photo-pending-' + original.id;
    put('images', {
      id: imageId,
      localPath: '/images/product-form-pending.svg',
      smallPath: '/images/product-form-pending.svg',
      width: 960,
      height: 640,
      altFr: 'Photographie de la forme à documenter',
      creator: 'AfroAtlas',
      sourcePageUrl: 'https://minlangrayan-ship-i.github.io/afroatlas/methodologie/',
      licenseId: 'Non applicable',
      licenseUrl: 'https://minlangrayan-ship-i.github.io/afroatlas/methodologie/',
      attribution: 'Emplacement neutre, sans photographie',
      modifications: 'Sans objet',
      retrievedAt: date,
      title: 'Photographie à documenter',
      description: 'Aucune image empruntée au corpus ni générée.',
      role: 'complementary',
      depictedForm: 'non documentée',
    });
    p = {
      id: 'product-' + slug,
      slug,
      labelFr: original.label,
      labelEn: null,
      labelAr: null,
      description: uses[0].description,
      categoryId: category,
      entityType: {
        organism: 'taxon',
        edible_part: 'ingredient',
        preparation: 'prepared-dish',
        commercial_group: 'commercial-category',
      }[original.identity],
      scientificName: scientific,
      taxonId: null,
      sourceIds: [],
      imageId,
      formTypes: [form],
      verifiedAt: date,
      usage: null,
      editorialNote:
        'Corpus documentaire fourni par le propriétaire. La portée de chaque nom est précisée dans sa preuve ; photographie fiable à documenter.',
      consumedPart:
        original.identity === 'organism'
          ? 'plante / organisme ; partie alimentaire non précisée'
          : uses[0].referent,
      verificationStatus: 'documented',
    };
    put('products', p);
    put('forms', {
      id: 'cm-form-' + original.id,
      productId: p.id,
      formType: form,
      description:
        'Forme ou identité couverte par le corpus, sans extrapolation à toutes les formes vendues.',
      sourceIds: [...new Set(uses.flatMap((u) => references(u).map((r) => r.sourceId)))],
    });
  }
  p.documentaryScope = original.identity;
  p.corpusIds = [...new Set([...(p.corpusIds || []), original.id])];
  p.sourceIds = [
    ...new Set([...p.sourceIds, ...uses.flatMap((u) => references(u).map((r) => r.sourceId))]),
  ];
  if (original.id === 'p-njangsa-seeds') {
    p.entityType = 'ingredient';
    p.consumedPart = 'graines / amandes';
  }
  if (original.id === 'p-gnetum-leaves') p.entityType = 'commercial-category';
  mapping[original.id] = {
    productId: p.id,
    slug,
    action: added ? 'added' : 'enriched',
    originalScientificName: scientific,
    documentaryScope: original.identity,
  };
  for (const u of uses) {
    const evidenceIds = references(u).map((r, i) => {
      const id = u.id + '-evidence-' + i;
      put('evidence', {
        id,
        sourceId: r.sourceId,
        assertionType: 'name-usage',
        locator: r.locator,
        shortNote: u.note + ' ' + u.limitations,
        checkedAt: null,
        checkedBy: null,
      });
      return id;
    });
    const lang = isUnspecified(u.language) ? null : u.language;
    const code = lang === 'Français' ? 'fr' : lang === 'Anglais' ? 'en' : null;
    const nameId = 'cm-corpus-name-' + hash(JSON.stringify([original.id, u.name, lang]));
    let assertion = incomingNames.get(nameId);
    const regions = isUnspecified(u.regions) ? [] : u.regions.split(/;\s*/).map(regionId);
    const historical = !isUnspecified(u.historicalArea);
    const localContext = [
      !isUnspecified(u.community) ? 'Communauté : ' + u.community : '',
      !isUnspecified(u.locality) ? u.locality : '',
      historical ? u.historicalArea : '',
      u.limitations,
    ]
      .filter(Boolean)
      .join(' · ');
    if (!assertion) {
      assertion = {
        id: nameId,
        productId: p.id,
        formId: null,
        name: u.name,
        normalizedName: u.name
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .replace(/[-‐‑–—]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        languageCode: code,
        languageLabel: lang || undefined,
        languageId: lang && !code ? 'cm-language-' + norm(lang) : undefined,
        countryIds: ['CMR'],
        regionIds: [],
        culturalAreaIds: historical ? [historicalId] : [],
        status: 'documented',
        evidenceIds: [],
        localContext: '',
        nameType: code ? 'common' : 'local',
        referent: u.referent,
        geographicScope: u.scope,
        limitations: u.limitations,
      };
      incomingNames.set(nameId, assertion);
    }
    assertion.evidenceIds = [...new Set([...assertion.evidenceIds, ...evidenceIds])];
    assertion.regionIds = [...new Set([...assertion.regionIds, ...regions])];
    assertion.localContext = [
      ...new Set([...assertion.localContext.split(' | ').filter(Boolean), localContext]),
    ].join(' | ');
    const converted = {
      ...mapping[original.id],
      targetNameId: nameId,
      targetEvidenceIds: evidenceIds,
      targetRegionIds: regions,
    };
    u.integration = converted;
    if (!isUnspecified(u.variants))
      for (const variant of u.variants.split(/;\s*/))
        put('names', {
          ...assertion,
          id: nameId + '-variant-' + hash(variant),
          name: variant,
          normalizedName: variant.toLowerCase(),
          nameType: 'spelling',
          localContext: localContext + ' · Variante documentée dans le corpus',
          evidenceIds,
        });
  }
}
for (const n of incomingNames.values()) put('names', n);
for (const presence of corpus.presences) {
  put('contexts', {
    id: 'cm-presence-' + hash(JSON.stringify(presence)),
    productId: mapping[presence.productId].productId,
    countryId: 'CMR',
    regionIds: [regionId(presence.region)],
    localContext: presence.region + ' — présence / production',
    description:
      'Présence ou production mentionnée dans la source ; aucune appellation locale ni usage national déduit.',
    sourceId: sourceId(presence.sourceId),
    locator: presence.locator,
    form: 'non précisée',
    relationType: 'presence',
  });
}
// Explicit plant/part/preparation relations; these never transfer a name to the other endpoint.
for (const [original, related] of [
  ['p-monodora', 'pebe'],
  ['p-ricino', 'njansang'],
  ['p-hibiscus', 'oseille-guinee'],
  ['p-hibiscus', 'bissap-feuilles'],
  ['p-hibiscus', 'folere-boisson'],
  ['p-maize', 'mais'],
  ['p-baobab', 'baobab'],
  ['p-cassava', 'manioc-feuilles'],
  ['p-cassava', 'kpem'],
  ['p-yam', 'igname-alata'],
  ['p-njama-leaves', 'managu'],
]) {
  const to = c.products.find((p) => p.slug === related);
  const evidenceIds = [...incomingNames.values()]
    .filter((n) => n.productId === mapping[original].productId)
    .flatMap((n) => n.evidenceIds);
  const specific =
    original === 'p-cassava' && related === 'kpem'
      ? [...incomingNames.values()].find((n) => n.productId === mapping['p-kpem'].productId)
          .evidenceIds
      : evidenceIds;
  if (to && !c.relations.some((r) => r.fromId === mapping[original].productId && r.toId === to.id))
    c.relations.push({
      fromId: mapping[original].productId,
      toId: to.id,
      relationType: 'related-product',
      evidenceIds: [specific[0]],
    });
}
// Preserve raw records; normalized integration is a separate view.
corpus.integration = {
  mapping,
  addedProducts: Object.values(mapping).filter((m) => m.action === 'added').length,
  enrichedProducts: Object.values(mapping).filter((m) => m.action === 'enriched').length,
  nameAssertions: incomingNames.size,
  limitations:
    'Statuts importés comme documented ; pas de nouvelle expertise de chacune des 20 références. Langues sans code ISO vérifié : identifiants internes cm-language-*. Aires historiques séparées.',
};
await writeFile('data/research/cameroon-corpus.json', JSON.stringify(corpus, null, 2) + '\n');
await writeFile(file, JSON.stringify(c, null, 2) + '\n');
console.log(
  'Integrated Cameroon corpus:',
  corpus.counts,
  'new products:',
  corpus.integration.addedProducts,
  'enriched:',
  corpus.integration.enrichedProducts,
  'total:',
  c.products.length,
);
