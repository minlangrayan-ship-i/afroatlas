// Reviewed editorial migration. Idempotent; preserves existing identifiers and URLs.
import { readFile, writeFile } from 'node:fs/promises';
const file = 'src/data/published/catalogue.json';
const c = JSON.parse(await readFile(file, 'utf8'));
const date = '2026-10-04';
const geo = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
const cmrRegion = (name) => geo.regions.find((r) => r.countryISO3 === 'CMR' && r.name === name).id;
const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[-‐‑–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const put = (key, row) => {
  const i = c[key].findIndex((x) => x.id === row.id);
  if (i < 0) c[key].push(row);
  else c[key][i] = row;
};
const source = (
  id,
  title,
  publisher,
  url,
  licenseId = 'Consultable publiquement ; licence ouverte non établie ; résumé original uniquement',
) =>
  put('sources', {
    id: 'feedback-' + id,
    title,
    publisher,
    url,
    licenseId,
    retrievedAt: date,
    datasetVersion: 'Consultation éditoriale du ' + date,
  });
const sources = [
  [
    'water-prota',
    'Talinum triangulare — PROTA',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Talinum_fruticosum_(PROTA)',
  ],
  [
    'water-kew',
    'Talinum triangulare : synonyme de Talinum fruticosum',
    'Kew POWO',
    'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:1022555-2',
  ],
  [
    'water-bio',
    'Waterleaf (New)',
    'Infonet Biovision',
    'https://infonet-biovision.org/indigenous-plants/waterleaf-new',
  ],
  [
    'hib-minresi',
    'Écho de la recherche n°37, mars 2018 — Foléré',
    'MINRESI Cameroun',
    'https://minresi.gov.cm/wp-content/uploads/2023/09/echo-mars-2018.pdf',
  ],
  [
    'hib-study',
    'Roselle grown in Sudano-Sahelian Cameroon',
    'Wouokoue et al., International Journal of Agronomy, 2025',
    'https://onlinelibrary.wiley.com/doi/10.1155/ioa/5568972',
  ],
  [
    'hib-drink',
    'Technologie du jus de foléré à Maroua, Mokolo et Mora',
    'IJIAS, 2014',
    'https://issr-journals.org/links/papers.php?application=pdf&article=IJIAS-14-256-07&journal=ijias',
    'CC BY ; version non précisée dans le document',
  ],
  [
    'spice-thesis',
    'Épices du Cameroun — thèse Abdou Bouba Armand, 2009',
    'INPL / Université de Ngaoundéré',
    'https://docnum.univ-lorraine.fr/public/INPL_2009_ABDOU_BOUBA_A.pdf',
  ],
  [
    'pebe-prosea',
    'Monodora myristica — graines condimentaires',
    'PROSEA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Monodora_myristica_(PROSEA)',
  ],
  ['pebe-eppo', 'Monodora myristica (MDOMY)', 'EPPO', 'https://gd.eppo.int/taxon/MDOMY'],
  [
    'atlas',
    'Atlas des aliments de consommation au Cameroun — pèbè, oseille',
    'RSD Institute',
    'https://rsd-institute.org/wp-content/uploads/2023/08/Atlas-Design-FR-17-avril-2021_compressed.pdf',
  ],
  [
    'forest-study',
    'Forest foods in twelve villages of eastern and southern Cameroon',
    'Fungo et al., Public Health Nutrition, 2016',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10270934/',
  ],
  [
    'rondelle-report',
    'Chaînes de valeur PFNL — fiche produit 3 Rondelle',
    'CTFC Cameroun',
    'https://www.foretcommunale-cameroun.org/download/rapportchainesvaleurspfnl.pdf',
  ],
  ['tetra-eppo', 'Tetrapleura tetraptera (TLTTE)', 'EPPO', 'https://gd.eppo.int/taxon/TLTTE'],
  [
    'tetra-iita',
    'Tetrapleura tetraptera — fruit à quatre ailes',
    'IITA',
    'https://forestcenter.iita.org/wp-content/uploads/2018/01/Tetrapleura-tetraptera.pdf',
  ],
  ['maniguette', 'Aframomum melegueta (AFRME)', 'EPPO', 'https://gd.eppo.int/taxon/AFRME'],
  ['piper-eppo', 'Piper guineense (PIPGU)', 'EPPO', 'https://gd.eppo.int/taxon/PIPGU'],
  [
    'codex-spices',
    'Codex — classification des épices, graines de grains de paradis',
    'FAO / Codex Alimentarius',
    'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/en/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FMeetings%252FCX-736-04%252FCRDS%252Fsc04_crd03x.pdf',
  ],
  [
    'managu',
    'African Nightshade (Revised)',
    'Infonet Biovision',
    'https://infonet-biovision.org/indigenous-plants/african-nightshade-revised',
  ],
  [
    'amaranth',
    'Amaranth (Revised)',
    'Infonet Biovision',
    'https://infonet-biovision.org/indigenous-plants/amaranth-revised',
  ],
  [
    'suba',
    'Indigenous vegetables production and utilization in Suba district',
    'Ouma / Infonet Biovision',
    'https://infonet-biovision.org/sites/default/files/pdf/indigenous_veg_production_suba_district_ouma.pdf',
  ],
  [
    'cowpea',
    'Cowpea (Revised)',
    'Infonet Biovision',
    'https://infonet-biovision.org/indigenous-plants/cowpea-revised',
  ],
  [
    'cassava',
    'Cassava Leaves (New)',
    'Infonet Biovision',
    'https://infonet-biovision.org/indigenous-plants/cassava-leaves-new',
  ],
  [
    'kale',
    'Cabbage, Kales, other Brassicas',
    'Infonet Biovision',
    'https://infonet-biovision.org/crops-fruits-vegetables/cabbagekalesother-brassicas-revised',
  ],
  ['macabo', 'Xanthosoma sagittifolium (XATSA)', 'EPPO', 'https://gd.eppo.int/taxon/XATSA'],
  [
    'maize',
    'Zea mays (PROTA)',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Zea_mays_(PROTA)',
  ],
  [
    'groundnut',
    'Arachis hypogaea (PROTA)',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Arachis_hypogaea_(PROTA)',
  ],
  [
    'yam',
    'Yam — Dioscorea alata',
    'Infonet Biovision',
    'https://infonet-biovision.org/crops-fruits-vegetables/yam',
  ],
  [
    'gnetum',
    'Gnetum (New)',
    'Infonet Biovision',
    'https://www.infonet-biovision.org/indigenous-plants/gnetum-new',
  ],
  [
    'gabon',
    'Manuel de domestication des produits forestiers non ligneux, tome 1',
    'ICRAF, 2008',
    'https://www.cifor-icraf.org/publications/downloads/Publications/PDFS/B16168.pdf',
  ],
  [
    'gnq',
    'Produits forestiers non ligneux en Guinée équatoriale',
    'FAO / Sunderland et Obama',
    'https://www.fao.org/4/X2161F/x2161f23.htm',
  ],
  [
    'typing',
    'Retour utilisateur : Wataleaf, muse et masso',
    'Propriétaire AfroAtlas',
    'https://github.com/minlangrayan-ship-i/afroatlas/blob/main/docs/RESEARCH_FEEDBACK.md',
    'Retour utilisateur ; ne prouve pas une appellation traditionnelle',
  ],
];
sources.forEach((s) => source(...s));
const sid = (s) => 'feedback-' + s;
const evidence = (id, s, kind, locator, note) => {
  put('evidence', {
    id: 'feedback-evidence-' + id,
    sourceId: sid(s),
    assertionType: kind,
    locator,
    shortNote: note,
    checkedAt: date,
    checkedBy: 'Revue documentaire assistée par IA ; pas de validation botanique sur spécimen',
  });
  return 'feedback-evidence-' + id;
};
const inventory = [];
const newProduct = (
  slug,
  labelFr,
  labelEn,
  scientificName,
  part,
  form,
  category,
  description,
  ss,
  locator,
  entityType = 'ingredient',
) => {
  const id = 'product-' + slug;
  put('images', {
    id: 'photo-gap-' + slug,
    localPath: '/favicon.svg',
    smallPath: '/favicon.svg',
    width: 100,
    height: 100,
    altFr: 'Photo fiable de cette forme à venir',
    creator: 'Sans photographie principale',
    sourcePageUrl: c.sources.find((s) => s.id === sid(ss[0])).url,
    licenseId: 'Non applicable',
    licenseUrl: 'https://creativecommons.org/',
    attribution: 'Aucune photographie publiée pour cette forme',
    modifications: 'Aucun',
    retrievedAt: date,
    title: 'Photographie recherchée',
    description: 'Photo de produit récolté ou vendu recherchée ; aucun substitut générique',
    role: 'complementary',
    depictedForm: form,
  });
  put('products', {
    id,
    slug,
    labelFr,
    labelEn,
    labelAr: null,
    description,
    categoryId: category,
    entityType,
    scientificName,
    taxonId: null,
    sourceIds: ss.map(sid),
    imageId: 'photo-gap-' + slug,
    formTypes: [form],
    verifiedAt: date,
    usage: description,
    editorialNote:
      'Les appellations ci-dessous sont limitées à leur contexte. Photo fiable de la forme vendue à venir.',
    consumedPart: part,
    verificationStatus: 'documented',
  });
  put('forms', {
    id: 'form-' + slug + '-' + form,
    productId: id,
    formType: form,
    description: part,
    sourceIds: ss.map(sid),
  });
  c.products.find((p) => p.id === id).identityEvidenceIds = ss.map((s) =>
    evidence(slug + '-identity-' + s, s, 'product-identity-and-part', locator, description),
  );
  inventory.push({
    productId: id,
    action: 'added',
    part,
    form,
    sourceIds: ss.map(sid),
    locator,
    status: 'documented',
    photo: 'pending',
  });
  return id;
};
newProduct(
  'waterleaf',
  'Waterleaf — feuilles de talinum',
  'Waterleaf',
  'Talinum fruticosum',
  'feuilles et jeunes pousses',
  'frais',
  'vegetables',
  'Légume-feuille succulent, distinct de l’épinard Spinacia oleracea. Talinum triangulare est traité comme synonyme par Kew. PROTA décrit son association avec les feuilles d’eru au Cameroun.',
  ['water-kew', 'water-prota', 'water-bio'],
  'Kew : statut taxonomique ; PROTA : Vernacular names / Uses',
);
newProduct(
  'pebe',
  'Pèbè — fausse muscade',
  'Calabash nutmeg',
  'Monodora myristica',
  'graines / amandes',
  'graines',
  'spices',
  'Graines aromatiques de Monodora myristica utilisées comme condiment. Elles sont distinctes de la noix de muscade Myristica fragrans.',
  ['pebe-prosea', 'pebe-eppo', 'spice-thesis', 'atlas'],
  'PROSEA Uses ; thèse p.81, tableau 2 ; Atlas VI.10',
);
newProduct(
  'rondelle',
  'Rondelle — graines aromatiques',
  null,
  'Afrostyrax lepidophyllus',
  'graines',
  'graines',
  'spices',
  'Condiment cité comme rondelle dans l’enquête de Fungo et al. menée dans douze villages de l’Est et du Sud camerounais. Ne pas confondre avec le fruit à quatre côtés.',
  ['forest-study'],
  'Tableau des aliments forestiers consommés ; rondelle',
);
newProduct(
  'quatre-cotes',
  'Quatre côtés — fruit condimentaire',
  'Aidan fruit',
  'Tetrapleura tetraptera',
  'fruit à quatre ailes',
  'séché',
  'spices',
  'Fruit à quatre ailes employé comme condiment dans l’enquête camerounaise de 2009. La fiche porte sur le fruit, pas sur les graines isolées.',
  ['spice-thesis', 'tetra-eppo', 'tetra-iita'],
  'Thèse p.46 et p.81, tableau 2 ; IITA Fruits/seeds',
);
newProduct(
  'maniguette',
  'Maniguette — grains de paradis',
  'Melegueta pepper',
  'Aframomum melegueta',
  'graines',
  'graines',
  'spices',
  'Épice de la famille des Zingiberaceae. EPPO atteste les noms maniguette et poivre de Guinée. Ce dernier nom peut désigner d’autres épices et ne suffit pas à identifier un achat.',
  ['maniguette'],
  'EPPO Common names',
);
newProduct(
  'poivre-sauvage',
  'Poivre sauvage — fruits de Piper guineense',
  null,
  'Piper guineense',
  'fruits',
  'séché',
  'spices',
  'Fruits de Piper guineense recensés parmi les épices de la sauce jaune dans l’enquête camerounaise de 2009. Espèce distincte de la maniguette.',
  ['spice-thesis'],
  'p.81, tableau 2, Piper guineense',
);
newProduct(
  'poivre-ethiopie',
  'Poivre d’Éthiopie — fruits de Xylopia',
  null,
  'Xylopia aethiopica',
  'fruits',
  'séché',
  'spices',
  'Fruits de Xylopia aethiopica cités comme poivre d’Éthiopie dans le tableau des épices camerounaises. Il ne s’agit pas de graines de maniguette.',
  ['spice-thesis'],
  'p.81, tableau 2, Xylopia aethiopica',
);
newProduct(
  'managu',
  'Managu — morelles alimentaires',
  'African nightshade',
  'Solanum spp.',
  'feuilles',
  'frais',
  'vegetables',
  'Nom kikuyu documenté pour un groupe de morelles alimentaires. Infonet distingue notamment S. americanum, S. scabrum et S. villosum ; le nom managu ne permet pas de choisir une espèce unique.',
  ['managu'],
  'Scientific Name / Local Names / Introduction',
  'commercial-category',
);
newProduct(
  'amarantes-feuilles',
  'Amarantes — feuilles alimentaires',
  'Amaranth leaves',
  'Amaranthus spp.',
  'feuilles',
  'frais',
  'vegetables',
  'Groupe de légumes-feuilles de plusieurs espèces d’Amaranthus. Terere est documenté en kikuyu ; il ne doit pas être attribué exclusivement à Amaranthus cruentus.',
  ['amaranth'],
  'Scientific Name / Local Names',
  'commercial-category',
);
newProduct(
  'saga',
  'Saga — feuilles de gynandropsis',
  'Spider plant',
  'Gynandropsis gynandra',
  'feuilles',
  'frais',
  'vegetables',
  'Légume-feuille présenté dans le guide de production du district de Suba au Kenya. Le guide emploie le nom scientifique Gynandropsis gynandra et le nom swahili saga.',
  ['suba'],
  'Fiche Spider plant / Local names',
);
newProduct(
  'niebe-feuilles',
  'Niébé — feuilles alimentaires',
  'Cowpea leaves',
  'Vigna unguiculata',
  'feuilles et pousses tendres',
  'frais',
  'vegetables',
  'Feuilles consommées comme légume, séparées ici des graines de niébé. Le nom kunde est attesté au Kenya en swahili et dans plusieurs communautés ; la forme doit être précisée.',
  ['cowpea'],
  'Other Local names : Kenya / Introduction',
);
newProduct(
  'manioc-feuilles',
  'Manioc — feuilles alimentaires',
  'Cassava leaves',
  'Manihot esculenta',
  'feuilles',
  'frais',
  'vegetables',
  'Feuilles de manioc utilisées en cuisine après préparation adaptée. Cette fiche est distincte des racines et des produits transformés ; elle ne constitue pas une recette de préparation.',
  ['cassava'],
  'Scientific Name / Uses',
);
newProduct(
  'sukuma-feuilles',
  'Sukuma — feuilles de chou non pommé',
  null,
  'Brassica oleracea (Acephala Group)',
  'feuilles',
  'frais',
  'vegetables',
  'Feuilles de chou non pommé présentées au Kenya par Infonet. Sukuma wiki peut aussi désigner le plat préparé : cette fiche concerne les feuilles, pas une recette.',
  ['kale'],
  'Photo et légende Sukuma — Brassica oleracea (Acephala Group), Kenya',
);
newProduct(
  'macabo',
  'Macabo — cormes de Xanthosoma',
  'Tannia',
  'Xanthosoma sagittifolium',
  'cormes et cormelles',
  'frais',
  'vegetables',
  'Aracée cultivée pour ses organes souterrains alimentaires. EPPO avertit que ce nom botanique couvre parfois plusieurs xanthosomas cultivés. Distinct du taro Colocasia esculenta.',
  ['macabo'],
  'Notes / Common names',
);
newProduct(
  'mais',
  'Maïs — grains',
  'Maize',
  'Zea mays',
  'grains',
  'graines',
  'vegetables',
  'Céréale dont les grains sont consommés entiers ou transformés. Le maïs brut, sa farine et les bouillies comme l’ugali ne sont pas des produits identiques.',
  ['maize'],
  'Vernacular names / Uses',
);
newProduct(
  'arachide',
  'Arachide — graines',
  'Groundnut',
  'Arachis hypogaea',
  'graines',
  'graines',
  'vegetables',
  'Graines alimentaires d’Arachis hypogaea. La fiche distingue la graine brute de la pâte, de l’huile et des préparations grillées.',
  ['groundnut'],
  'Vernacular names / Uses',
);
newProduct(
  'igname-alata',
  'Igname ailée — tubercule',
  'Water yam',
  'Dioscorea alata',
  'tubercule',
  'frais',
  'vegetables',
  'Tubercule de Dioscorea alata. Le mot igname désigne plusieurs espèces : cette fiche ne représente pas toutes les ignames. Infonet documente sa commercialisation à Korhogo en Côte d’Ivoire.',
  ['yam'],
  'Scientific Name / Yam marketing, Korogho, Côte d’Ivoire, juin 1999',
);
newProduct(
  'folere-boisson',
  'Foléré / bissap — boisson d’hibiscus',
  null,
  'Hibiscus sabdariffa',
  'calices utilisés dans une boisson',
  'boisson',
  'vegetables',
  'Boisson issue des calices d’Hibiscus sabdariffa, étudiée à Maroua, Mokolo et Mora. Distincte des feuilles alimentaires et des calices vendus secs. Aucune qualité d’emblème national officiel n’est affirmée.',
  ['hib-drink', 'hib-minresi'],
  'Article : jus de foléré ; MINRESI p.11',
  'prepared-dish',
);
const get = (slug) => c.products.find((p) => p.slug === slug);
const update = (slug, fields) => {
  Object.assign(get(slug), fields);
  inventory.push({
    productId: get(slug).id,
    action: 'enriched',
    part: get(slug).consumedPart,
    form: get(slug).formTypes,
    status: 'documented',
    sourceIds: get(slug).sourceIds,
  });
};
update('oseille-guinee', {
  labelFr: 'Bissap / foléré — calices d’hibiscus séchés',
  description:
    'Calices séchés d’Hibiscus sabdariffa utilisés pour préparer des boissons. Ils sont distincts des feuilles alimentaires et de la boisson déjà préparée.',
  consumedPart: 'calices',
  entityType: 'ingredient',
  sourceIds: [
    ...new Set([...get('oseille-guinee').sourceIds, sid('hib-minresi'), sid('hib-study')]),
  ],
  editorialNote:
    'Calices rouges séchés, pas « feuilles violettes ». Les appellations de la plante peuvent désigner plusieurs parties : précisez calices, feuilles ou boisson.',
});
update('bissap-feuilles', {
  labelFr: 'Foléré / oseille de Guinée — feuilles alimentaires',
  consumedPart: 'feuilles',
  entityType: 'ingredient',
  description:
    'Feuilles d’Hibiscus sabdariffa employées comme légume. Cette partie est distincte des calices rouges séchés servant aux boissons.',
  sourceIds: [
    ...new Set([...get('bissap-feuilles').sourceIds, sid('hib-minresi'), sid('hib-study')]),
  ],
});
update('epinard', {
  description:
    'Feuilles de Spinacia oleracea, l’épinard classique. Le waterleaf (Talinum fruticosum) et les légumes appelés « spinach » dans d’autres contextes ne sont pas cette espèce.',
  consumedPart: 'feuilles',
  labelEn: 'Spinach',
  editorialNote:
    'Ancienne photographie écartée : identification botanique insuffisante malgré sa légende « spinach ». Nouvelle photographie de feuilles récoltées, vérifiée visuellement et sourcée.',
});
update('eru', {
  scientificNames: ['Gnetum africanum', 'Gnetum buchholzianum'],
  consumedPart: 'feuilles',
  description:
    'Feuilles alimentaires commercialisées sous des noms comme eru ou okok. Deux espèces proches, Gnetum africanum et Gnetum buchholzianum, sont concernées ; le nom commercial ne garantit pas l’espèce.',
  sourceIds: [...new Set([...get('eru').sourceIds, sid('gnetum'), sid('gabon'), sid('gnq')])],
});
get('managu').scientificNames = ['Solanum americanum', 'Solanum scabrum', 'Solanum villosum'];
const alias = (
  slug,
  name,
  languageCode,
  country,
  s,
  context = '',
  nameType = 'local',
  otherSources = [],
) => {
  const id = slug + '-' + norm(name).replace(/[^\p{L}\p{N}]+/gu, '-') + '-' + (country || 'global');
  const proof = evidence(
    id,
    s,
    nameType === 'input' ? 'input-variant' : 'name',
    context || 'Appellations / noms vernaculaires',
    name,
  );
  const more = otherSources.map((ss) =>
    evidence(id + '-' + ss, ss, 'name-cross-check', context || 'Appellations', name),
  );
  put('names', {
    id: 'feedback-name-' + id,
    productId: 'product-' + slug,
    formId: null,
    name,
    normalizedName: norm(name),
    languageCode,
    countryIds: country ? [country] : [],
    regionIds: [],
    culturalAreaIds: [],
    status: 'documented',
    evidenceIds: [proof, ...more],
    localContext: context,
    nameType,
  });
};
for (const slug of ['oseille-guinee', 'bissap-feuilles', 'folere-boisson']) {
  alias(
    slug,
    'Foléré',
    'local-und',
    'CMR',
    'hib-minresi',
    'Nom de la plante et de préparations ; préciser la partie. Extrême-Nord documenté par Bayoi et al. 2014.',
    'local',
    ['hib-drink'],
  );
  alias(
    slug,
    'Folere',
    null,
    null,
    'hib-study',
    'Variante sans accents employée dans la littérature ; ne précise pas la partie.',
    'spelling',
  );
}
alias(
  'waterleaf',
  'Waterleaf',
  'en',
  null,
  'water-prota',
  'Nom anglais ; pas un nom national camerounais.',
  'common',
);
alias(
  'waterleaf',
  'Wataleaf',
  null,
  null,
  'typing',
  'Variante de saisie issue du retour utilisateur ; pas une appellation traditionnelle attestée.',
  'input',
);
alias(
  'waterleaf',
  'Talinum triangulare',
  null,
  null,
  'water-kew',
  'Synonyme scientifique de Talinum fruticosum.',
  'scientific',
);
for (const n of ['Grassé', 'Pourpier tropical'])
  alias('waterleaf', n, 'fr', null, 'water-bio', 'Nom français documenté.', 'common');
for (const n of ['bolki', 'belok-sup'])
  alias(
    'waterleaf',
    n,
    'local-und',
    'CMR',
    'water-prota',
    'Cameroun dans PROTA ; langue et région non précisées.',
  );
alias(
  'waterleaf',
  'Gbure',
  'yo',
  'NGA',
  'water-bio',
  'Yoruba ; usage au sud du Nigeria décrit par PROTA.',
);
alias('pebe', 'Pèbè', 'local-und', 'CMR', 'atlas', 'Atlas des aliments au Cameroun, VI.10.');
alias(
  'pebe',
  'Fausse noix muscade',
  'fr',
  null,
  'pebe-prosea',
  'Nom de l’épice ; distinct de Myristica fragrans.',
  'common',
);
alias(
  'rondelle',
  'Rondelle',
  'fr',
  'CMR',
  'forest-study',
  'Enquête dans douze villages de l’Est et du Sud ; langue vernaculaire non précisée.',
);
alias(
  'quatre-cotes',
  'Quatre côtés',
  'fr',
  null,
  'spice-thesis',
  'Libellé descriptif du fruit à quatre ailes ; pas la rondelle.',
  'common',
);
for (const [n, lang, context] of [
  ['Essèssé', 'dua', 'Douala'],
  ['Sasâs', 'bas', 'Bassa'],
  ['Akwa', 'ewo', 'Ewondo'],
  ['Sepan', 'local-und', 'Bangangté'],
])
  alias(
    'quatre-cotes',
    n,
    lang,
    'CMR',
    'spice-thesis',
    context + ' ; p.46, orthographe de la thèse.',
  );
alias('quatre-cotes', 'Aridan', 'yo', 'NGA', 'tetra-iita', 'Yoruba dans la fiche IITA.');
alias(
  'maniguette',
  'Maniguette',
  'fr',
  null,
  'maniguette',
  'EPPO ; espèce Aframomum melegueta.',
  'common',
);
alias(
  'maniguette',
  'Poivre de Guinée',
  'fr',
  null,
  'maniguette',
  'Nom ambigu ; comparer la forme et l’espèce.',
  'common',
);
alias(
  'poivre-sauvage',
  'Poivre sauvage',
  'fr',
  'CMR',
  'spice-thesis',
  'p.81, tableau 2 ; fruits de Piper guineense.',
  'common',
);
alias(
  'poivre-sauvage',
  'Poivrier de Guinée',
  'fr',
  null,
  'piper-eppo',
  'Nom de la plante dans EPPO ; comparer aux graines de maniguette.',
  'common',
);
alias(
  'poivre-ethiopie',
  'Poivre d’Éthiopie',
  'fr',
  'CMR',
  'spice-thesis',
  'p.81, tableau 2 ; fruits de Xylopia aethiopica.',
  'common',
);
alias(
  'managu',
  'Managu',
  'ki',
  'KEN',
  'managu',
  'Nom kikuyu du groupe des morelles alimentaires, sans espèce unique.',
);
alias('managu', 'Osuga', 'luo', 'KEN', 'managu', 'Nom luo du groupe des morelles alimentaires.');
alias('managu', 'Mnavu', 'sw', 'KEN', 'managu', 'Nom swahili ; plusieurs espèces.');
alias(
  'amarantes-feuilles',
  'Terere',
  'ki',
  'KEN',
  'amaranth',
  'Kikuyu ; groupe Amaranthus spp., pas exclusivement A. cruentus.',
);
alias(
  'amarantes-feuilles',
  'Mchicha',
  'sw',
  'KEN',
  'amaranth',
  'Swahili ; plusieurs amarantes alimentaires.',
);
alias(
  'amarantes-feuilles',
  'Folong',
  'local-und',
  'CMR',
  'amaranth',
  'Bulu et Ewondo dans la source ; plusieurs espèces possibles.',
);
alias('saga', 'Saga', 'sw', 'KEN', 'suba', 'Swahili ; guide de production du district de Suba.');
alias(
  'saga',
  'Chinsaga',
  'local-und',
  'KEN',
  'suba',
  'Kisii dans le guide ; ne pas étendre à toutes les communautés.',
);
alias(
  'niebe-feuilles',
  'Kunde',
  'sw',
  'KEN',
  'cowpea',
  'Nom de la plante ; préciser feuilles plutôt que graines.',
);
alias(
  'niebe',
  'Kunde',
  'sw',
  'KEN',
  'cowpea',
  'Nom de la plante ; préciser graines plutôt que feuilles.',
);
alias(
  'sukuma-feuilles',
  'Sukuma wiki',
  null,
  'KEN',
  'kale',
  'Terme également employé pour le plat ; fiche consacrée aux feuilles.',
);
alias(
  'macabo',
  'Macabo',
  'fr',
  null,
  'macabo',
  'EPPO ; Xanthosoma cultivés, distinct de Colocasia esculenta.',
  'common',
);
alias(
  'mais',
  'Muhindi',
  'sw',
  null,
  'maize',
  'Nom swahili attesté sans périmètre national déduit.',
);
alias(
  'eru',
  'Nkumu',
  'local-und',
  'GAB',
  'gabon',
  'Gabon dans le tableau du manuel ICRAF ; langue non précisée.',
);
alias(
  'eru',
  'Okok',
  'fan',
  'GNQ',
  'gnetum',
  'Fang en Guinée équatoriale ; Sunderland & Obama 2000 cité par Infonet.',
);
alias(
  'eru',
  'Gnetum buchholzianum',
  null,
  null,
  'gnetum',
  'Autre espèce concernée par la même catégorie alimentaire.',
  'scientific',
);
alias(
  'folere-boisson',
  'Oyoro',
  'local-und',
  'CMR',
  'hib-drink',
  'Nom de la boisson au Nord camerounais, introduction p.787.',
);
alias(
  'folere-boisson',
  'Bissap',
  null,
  null,
  'hib-drink',
  'Boisson ; ne pas confondre avec les feuilles ou les calices secs.',
  'common',
);
get('maniguette').sourceIds.push(sid('codex-spices'));
evidence(
  'maniguette-seeds',
  'codex-spices',
  'product-part',
  'Tableau grains de paradis / Aframomum melegueta',
  'Graines employées comme épice',
);
const context = (slug, country, s, label, description, relationType = 'consumption') =>
  put('contexts', {
    id: 'feedback-context-' + slug + '-' + country,
    productId: 'product-' + slug,
    countryId: country,
    regionIds: [],
    localContext: label,
    description,
    sourceId: sid(s),
    locator: label,
    form: get(slug).formTypes[0],
    relationType,
  });
context(
  'waterleaf',
  'CMR',
  'water-prota',
  'Cameroun — association waterleaf / eru',
  'PROTA décrit les pousses de waterleaf associées aux feuilles d’eru et au fufu. La source ne précise pas une région.',
  'recipe-use',
);
context(
  'eru',
  'GNQ',
  'gnq',
  'Malabo — marché documenté par FAO',
  'La FAO décrit la disponibilité de feuilles de Gnetum au marché de Malabo ; cela ne prouve pas un usage identique dans tout le pays.',
);
context(
  'eru',
  'GAB',
  'gabon',
  'Gabon — nkumu dans le manuel ICRAF',
  'Le manuel relie le nom nkumu au Gabon ; il ne documente pas une région ni une recette précise.',
  'local-name',
);
context(
  'igname-alata',
  'CIV',
  'yam',
  'Korhogo — commercialisation, juin 1999',
  'La légende Infonet situe la vente de tubercules de Dioscorea alata à Korhogo. Observation historique, sans généralisation nationale.',
);
for (const slug of ['pebe', 'quatre-cotes', 'poivre-sauvage', 'poivre-ethiopie'])
  context(
    slug,
    'CMR',
    'spice-thesis',
    'Enquête sauce jaune, 2009, tableau 2',
    'Épice recensée dans l’enquête. Les recettes varient entre régions et ménages ; aucune composition nationale uniforme n’est déduite.',
    'recipe-use',
  );
for (const slug of ['managu', 'amarantes-feuilles', 'niebe-feuilles'])
  context(
    slug,
    'KEN',
    slug === 'managu' ? 'managu' : slug === 'amarantes-feuilles' ? 'amaranth' : 'cowpea',
    'Kenya — communautés précisées dans les appellations',
    'Légume-feuille décrit par Infonet ; les noms sont limités aux langues documentées.',
  );
context(
  'saga',
  'KEN',
  'suba',
  'District de Suba — guide de production',
  'Guide de production et utilisation des légumes indigènes du district de Suba.',
);
context(
  'sukuma-feuilles',
  'KEN',
  'kale',
  'Kenya — chou non pommé',
  'La source décrit des feuilles de Brassica oleracea (Acephala Group) ; pas une identité avec le chou pommé.',
);
context(
  'folere-boisson',
  'CMR',
  'hib-drink',
  'Maroua, Mokolo et Mora',
  'Boisson étudiée dans trois villes de l’Extrême-Nord ; pas un statut d’emblème officiel.',
);
c.contexts.find((ctx) => ctx.id === 'feedback-context-folere-boisson-CMR').regionIds = [
  cmrRegion('Far North'),
];
for (const name of c.names.filter((n) => n.id.startsWith('feedback-name-') && n.name === 'Foléré'))
  name.regionIds = [cmrRegion('Far North')];
context(
  'rondelle',
  'CMR',
  'forest-study',
  'Douze villages de l’Est et du Sud — enquête 2016',
  'La rondelle figure dans le relevé des aliments forestiers consommés par les ménages enquêtés.',
);
c.contexts.find((ctx) => ctx.id === 'feedback-context-rondelle-CMR').regionIds = [
  cmrRegion('East'),
  cmrRegion('South'),
];
for (const slug of ['mais', 'arachide', 'igname-alata', 'macabo']) get(slug).categoryId = 'staples';
const link = (a, b, relationType, s) => {
  const id = evidence(
    'relation-' + a + '-' + b,
    s,
    'product-relation',
    'Espèce et partie / forme consommée',
    'Produits distincts mais liés',
  );
  if (!c.relations.some((r) => r.fromId === 'product-' + a && r.toId === 'product-' + b))
    c.relations.push({
      fromId: 'product-' + a,
      toId: 'product-' + b,
      relationType,
      evidenceIds: [id],
    });
};
for (const [a, b, s] of [
  ['oseille-guinee', 'bissap-feuilles', 'hib-minresi'],
  ['oseille-guinee', 'folere-boisson', 'hib-drink'],
  ['niebe', 'niebe-feuilles', 'cowpea'],
  ['manioc', 'manioc-feuilles', 'cassava'],
  ['chou', 'sukuma-feuilles', 'kale'],
  ['amarante', 'amarantes-feuilles', 'amaranth'],
  ['taro', 'macabo', 'macabo'],
  ['waterleaf', 'epinard', 'water-kew'],
])
  link(a, b, 'related-product', s);
// Sort contextual and newly checked names first; retain all historical assertions.
c.names.sort(
  (a, b) => Number(b.id.startsWith('feedback-name-')) - Number(a.id.startsWith('feedback-name-')),
);
// Replace doubtful spinach image without deleting its historical asset or record.
const old = c.images.find((i) => i.id === 'shop-photo-epinard');
old.role = 'complementary';
old.visualCheckResult =
  'Écartée de l’affichage : légende générique spinach, espèce non confirmée ; ne pas réattribuer arbitrairement.';
old.visuallyCheckedAt = date;
put('images', {
  id: 'reviewed-photo-epinard',
  localPath: '/images/epinard-reviewed-960.webp',
  smallPath: '/images/epinard-reviewed-400.webp',
  width: 960,
  height: 766,
  altFr: 'Feuilles fraîches récoltées de Spinacia oleracea, épinard classique',
  creator: 'Tiia Monto',
  sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Spinach_leaves.png',
  licenseId: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  attribution: 'Tiia Monto · Spinach leaves.png · CC BY-SA 4.0',
  modifications: 'Redimensionnement et conversion WebP, transparence préservée, aucun recadrage',
  retrievedAt: date,
  title: 'Spinach leaves.png',
  description:
    'Feuilles récoltées identifiées comme épinard sur Commons et utilisées par la page Spinacia oleracea',
  role: 'primary',
  depictedForm: 'frais',
  depictedPart: 'feuilles',
  depictedProductId: 'product-epinard',
  visuallyCheckedAt: date,
  visualCheckResult:
    'Feuilles récoltées ; morphologie compatible et identification de la page source vérifiée. Pas une expertise sur spécimen.',
});
get('epinard').imageId = 'reviewed-photo-epinard';
const hibImage = c.images.find((i) => i.id === 'shop-photo-oseille-guinee');
Object.assign(hibImage, {
  altFr: 'Calices rouges séchés d’Hibiscus sabdariffa pour infusion, pas des feuilles',
  depictedPart: 'calices',
  depictedProductId: 'product-oseille-guinee',
});
Object.assign(hibImage, {
  visuallyCheckedAt: date,
  visualCheckResult: 'Calices rouges séchés inspectés ; forme conforme, pas des feuilles.',
});
put('images', {
  id: 'reviewed-photo-pebe',
  localPath: '/images/pebe-reviewed-960.webp',
  smallPath: '/images/pebe-reviewed-400.webp',
  width: 960,
  height: 530,
  altFr: 'Graines de Monodora myristica : une graine entière et une ouverte montrant son amande',
  creator: 'Slashme',
  sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Monodora_myristica_seeds.png',
  licenseId: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  attribution: 'Slashme · Monodora myristica seeds.png · CC BY-SA 4.0',
  modifications:
    'Redimensionnement et conversion WebP ; aucun recadrage ; transparence originale conservée',
  retrievedAt: date,
  title: 'Monodora myristica seeds.png',
  description:
    'Photographie de graines achetées auprès d’un fournisseur ; une entière et une ouverte',
  role: 'primary',
  depictedForm: 'graines',
  depictedPart: 'graines / amandes',
  depictedProductId: 'product-pebe',
  visuallyCheckedAt: date,
  visualCheckResult:
    'Graine entière et amande visibles ; identification source Monodora myristica et licence confirmées. Artefacts de détourages présents dans l’original.',
});
get('pebe').imageId = 'reviewed-photo-pebe';
get('pebe').editorialNote =
  'Photographie de graines achetées à un fournisseur : une entière, une ouverte. Elle ne représente pas la poudre. Crédit Slashme, CC BY-SA 4.0.';
inventory.find((p) => p.productId === 'product-pebe').photo = 'primary-visually-checked';
await writeFile(file, JSON.stringify(c, null, 2) + '\n');
await writeFile(
  'data/research/feedback-inventory.json',
  JSON.stringify(
    {
      consultedAt: date,
      method:
        'Résumés originaux ; références reliées aux assertions ; pas de copie intégrale de publications',
      sources: sources.map((s) => ({
        id: sid(s[0]),
        url: s[3],
        consultedAt: date,
        access:
          s[0] === 'rondelle-report'
            ? '403 ; non utilisé comme preuve'
            : s[0] === 'atlas'
              ? 'Extraits indexés VI.10 consultés ; téléchargement PDF indisponible'
              : s[0] === 'hib-study'
                ? 'Page/abstract consulté ; extraction supplémentaire instable'
                : 'Page ou document consulté',
      })),
      products: inventory.map((row) => ({
        ...row,
        scientificNames: c.products.find((p) => p.id === row.productId)?.scientificNames || [],
        aliases: c.names
          .filter((n) => n.productId === row.productId)
          .map((n) => ({
            name: n.name,
            type: n.nameType || 'unspecified',
            language: n.languageCode,
            countryIds: n.countryIds,
            regionIds: n.regionIds,
            context: n.localContext,
            status: n.status,
            evidenceIds: n.evidenceIds,
          })),
        contexts: c.contexts.filter((ctx) => ctx.productId === row.productId),
      })),
      pending: [
        {
          term: 'muse',
          reason:
            'Aucune identification botanique fiable ; contexte de recette et communauté demandé',
        },
        { term: 'masso', reason: 'Résultats principalement patronymes ; aucune espèce attribuée' },
        {
          term: 'country onion',
          reason: 'Alias de rondelle à corroborer par une seconde source accessible',
        },
        {
          term: 'prekese',
          reason:
            'Nom twi probable ; sources prioritaires inaccessibles, pas publié comme alias vérifié',
        },
        {
          term: 'plantain',
          reason: 'Fiche propre et identification du groupe cultivé à documenter',
        },
        {
          term: 'nététou / dawadawa / iru',
          reason:
            'Ne pas présumer même matière première ou procédé ; fiche soumbala existante conservée',
        },
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Editorial enrichment written:',
  inventory.length,
  'product actions; total',
  c.products.length,
);
