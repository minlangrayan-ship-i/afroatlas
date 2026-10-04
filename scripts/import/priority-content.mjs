import { readFile, copyFile, access } from 'node:fs/promises';
import { request, json, date } from './common.mjs';
const file = 'src/data/published/catalogue.json';
const c = JSON.parse(await readFile(file, 'utf8'));
const geo = JSON.parse(await readFile('src/data/published/geography.json', 'utf8'));
// Original, short factual summaries. No copied article prose or article photographs.
const sources = [
  [
    'prota-gnetum',
    'PROTA — Gnetum africanum',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Gnetum_africanum_(PROTA)',
    'Conditions PROTA / Pl@ntUse ; texte non reproduit',
  ],
  [
    'prota-corchorus',
    'PROTA — Corchorus olitorius',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Corchorus_olitorius_(PROTA)',
    'Conditions PROTA / Pl@ntUse ; texte non reproduit',
  ],
  [
    'prota-hibiscus',
    'PROTA — Hibiscus sabdariffa',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Hibiscus_sabdariffa_(PROTA)',
    'Conditions PROTA / Pl@ntUse ; texte non reproduit',
  ],
  [
    'prota-baobab',
    'PROTA — Adansonia digitata',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Adansonia_digitata_(PROTA)',
    'Conditions PROTA / Pl@ntUse ; texte non reproduit',
  ],
  [
    'prota-ndole',
    'PROTA — Vernonia amygdalina',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Vernonia_amygdalina_(PROTA)',
    'Conditions PROTA / Pl@ntUse ; texte non reproduit',
  ],
  [
    'prota-njansang',
    'PROTA — Ricinodendron heudelotii',
    'PROTA / Pl@ntUse',
    'https://plantuse.plantnet.org/en/Ricinodendron_heudelotii_(PROTA)',
    'Conditions PROTA / Pl@ntUse ; texte non reproduit',
  ],
  [
    'fao-mali',
    'Mali — de la terre à la table',
    'Slow Food / PDF hébergé par FAO',
    'https://www.fao.org/fileadmin/templates/olq/files/generaldoc/Mali.pdf',
    'Licence ouverte non établie ; faits référencés, texte et images non reproduits',
  ],
  [
    'fao-netetou',
    'Agroforestry parklands in sub-Saharan Africa — Box 2.2',
    'FAO',
    'https://www.fao.org/4/X3940E/X3940E03.htm',
    'Conditions FAO ; faits référencés, texte non reproduit',
  ],
  [
    'rabat-names',
    'An ethnobotanical survey of medicinal plants used for diabetes treatment in Rabat, Morocco — Table 2',
    'Journal of Herbal Medicine / Elsevier',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6441794/',
    'CC BY-NC-ND 4.0 ; seuls faits et noms cités, aucune adaptation du texte',
  ],
  [
    'saffron-taliouine',
    'Saffron of Taliouine and new extension areas in Morocco',
    'Khoulati & Abousalim / Discover Food',
    'https://doi.org/10.1007/s44187-024-00119-2',
    'CC BY 4.0',
  ],
  [
    'tai-akpi',
    'Gestion durable des ressources naturelles dans l’espace Taï',
    'CHM Côte d’Ivoire — rapport institutionnel',
    'https://ci.chm-cbd.net/sites/ci/files/2022-04/Gestion%20durable%20des%20ressources%20naturelles%20dans%20l%27espace%20Ta%C3%AF.pdf',
    'Licence ouverte non établie ; faits référencés, texte et images non reproduits',
  ],
  [
    'fao-bissap-leaves',
    'Senegal — Annual Agricultural Survey 2021–2022 : Bissap-feuille',
    'FAO Microdata / enquête agricole sénégalaise',
    'https://microdata.fao.org/index.php/catalog/2418/variable/V3202?name=Q2_22A_0__4',
    'Conditions FAO Microdata ; intitulé de variable cité, données individuelles non importées',
  ],
  [
    'fao-eru',
    'Gnetum domestication for livelihood improvement and conservation',
    'FAO / World Forestry Congress',
    'https://www.fao.org/4/XII/0671-B5.htm',
    'Conditions FAO ; faits référencés, texte non reproduit',
  ],
];
for (const [id, title, publisher, url, licenseId] of sources) {
  if (!c.sources.some((s) => s.id === id))
    c.sources.push({
      id,
      title,
      publisher,
      url,
      licenseId,
      retrievedAt: date,
      datasetVersion: 'Édition indiquée sur la source ; consultation 2026-10-04',
    });
}
const newSeeds = [
  ['eru', 'Eru — feuilles de Gnetum', 'Gnetum africanum', 'vegetables', 'prota-gnetum', 'frais'],
  [
    'njansang',
    'Njansang / akpi — amandes',
    'Ricinodendron heudelotii',
    'spices',
    'prota-njansang',
    'graines',
  ],
  [
    'soumbala',
    'Soumbala — condiment fermenté',
    'Parkia biglobosa',
    'spices',
    'fao-netetou',
    'fermenté',
  ],
  [
    'baobab',
    'Baobab — poudre de feuilles',
    'Adansonia digitata',
    'vegetables',
    'prota-baobab',
    'poudre',
  ],
  ['safran', 'Safran — stigmates séchés', 'Crocus sativus', 'spices', 'saffron-taliouine', 'séché'],
  ['cumin', 'Cumin — graines', 'Cuminum cyminum', 'spices', 'saffron-taliouine', 'graines'],
  ['menthe', 'Menthe verte — feuilles', 'Mentha spicata', 'vegetables', 'rabat-names', 'frais'],
  [
    'ndole',
    'Vernonie — feuilles pour le ndolé',
    'Vernonia amygdalina',
    'vegetables',
    'prota-ndole',
    'frais',
  ],
  [
    'bissap-feuilles',
    'Hibiscus — feuilles alimentaires',
    'Hibiscus sabdariffa',
    'vegetables',
    'fao-bissap-leaves',
    'frais',
  ],
  [
    'gombo-poudre',
    'Gombo — poudre de fruits séchés',
    'Abelmoschus esculentus',
    'vegetables',
    'fao-mali',
    'poudre',
  ],
];
for (const [slug, labelFr, scientificName, categoryId, sid, form] of newSeeds) {
  if (c.products.some((p) => p.slug === slug)) continue;
  let entity;
  try {
    const search = await request(
      'https://www.wikidata.org/w/api.php?' +
        new URLSearchParams({
          action: 'wbsearchentities',
          search: scientificName,
          language: 'en',
          limit: '5',
          format: 'json',
        }),
    );
    for (const match of search.search || []) {
      const r = await request(`https://www.wikidata.org/wiki/Special:EntityData/${match.id}.json`);
      const e = r.entities[match.id];
      if (e.claims?.P225?.some((p) => p.mainsnak.datavalue?.value === scientificName)) {
        entity = e;
        break;
      }
    }
  } catch (e) {
    console.log('Taxon lookup gap ' + slug);
  }
  const id = `product-${slug}`;
  let sourceIds = ['cumin', 'menthe'].includes(slug) ? [] : [sid];
  if (entity) {
    const sourceId = `wikidata-${entity.id}`;
    sourceIds.push(sourceId);
    if (!c.sources.some((s) => s.id === sourceId))
      c.sources.push({
        id: sourceId,
        title: `Wikidata · ${entity.id}`,
        publisher: 'Wikidata',
        url: `https://www.wikidata.org/wiki/${entity.id}`,
        licenseId: 'CC0-1.0',
        retrievedAt: date,
        datasetVersion: String(entity.lastrevid),
      });
    for (const lang of ['fr', 'en', 'ar', 'wo', 'bm']) {
      for (const [i, a] of [
        { value: entity.labels?.[lang]?.value, locator: `labels.${lang}.value` },
        ...(entity.aliases?.[lang] || [])
          .slice(0, 8)
          .map((a, i) => ({ ...a, locator: `aliases.${lang}[${i}].value` })),
      ].entries()) {
        if (!a.value) continue;
        const eid = `evidence-${slug}-${lang}-${i}`;
        c.evidence.push({
          id: eid,
          sourceId,
          assertionType: 'name',
          locator: a.locator,
          shortNote:
            'Libellé linguistique de l’espèce ; pas de contexte national ou de forme transformée établi.',
          checkedAt: null,
          checkedBy: null,
        });
        c.names.push({
          id: `name-${slug}-${lang}-${i}`,
          productId: id,
          formId: null,
          name: a.value,
          normalizedName: a.value
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase(),
          languageCode: lang,
          countryIds: [],
          regionIds: [],
          culturalAreaIds: [],
          localContext: 'Espèce uniquement ; le nom de la forme transformée peut différer',
          status: 'documented',
          evidenceIds: [eid],
        });
      }
    }
  }
  // Explicit placeholder metadata, never a generated or misleading photograph.
  const imageId = `photo-gap-${slug}`;
  c.images.push({
    id: imageId,
    localPath: '/favicon.svg',
    smallPath: '/favicon.svg',
    width: 100,
    height: 100,
    altFr: 'Photographie de cette forme non documentée',
    creator: 'Sans photographie principale',
    sourcePageUrl: c.sources.find((s) => s.id === sid).url,
    licenseId: 'Non applicable',
    licenseUrl: 'https://creativecommons.org/',
    attribution: 'Aucune photographie publiée pour cette forme',
    modifications: 'Aucun',
    retrievedAt: date,
    title: 'Photographie recherchée',
    description: 'Lacune photographique',
    role: 'complementary',
    depictedForm: form,
  });
  c.products.push({
    id,
    slug,
    labelFr,
    labelEn: entity?.labels?.en?.value || null,
    description: `${labelFr}. Forme de cette fiche : ${form}. Les noms de l’espèce et ceux d’un condiment ou d’un plat sont distingués dans les preuves.`,
    categoryId,
    entityType: slug === 'soumbala' ? 'ingredient' : 'taxon',
    scientificName,
    taxonId: entity?.id || null,
    sourceIds,
    imageId,
    formTypes: [form],
    verifiedAt: date,
    usage: null,
    editorialNote:
      'Les variantes de forme ne sont pas interchangeables. La photographie illustre uniquement la forme indiquée ; sa provenance ne prouve pas un usage local.',
  });
}
// Re-runnable enrichment: replace only our own facts, preserve all pre-existing names.
c.names = c.names.filter((n) => !n.id.startsWith('context-name-'));
c.evidence = c.evidence.filter((e) => !e.id.startsWith('context-evidence-'));
c.contexts = [];
const region = (iso, text) =>
  geo.regions.find(
    (r) =>
      r.countryISO3 === iso &&
      r.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .includes(text),
  )?.id;
function name(
  slug,
  value,
  language,
  country,
  localContext,
  sid,
  locator,
  regionText = '',
  form = null,
) {
  const productId = `product-${slug}`,
    i = c.names.filter((n) => n.id.startsWith('context-name-')).length,
    eid = `context-evidence-${i}`;
  const rid = regionText ? region(country, regionText) : null;
  c.evidence.push({
    id: eid,
    sourceId: sid,
    assertionType: 'name',
    locator,
    shortNote: `Nom cité dans le périmètre : ${localContext}. Aucune généralisation nationale.`,
    checkedAt: date,
    checkedBy: null,
  });
  c.names.push({
    id: `context-name-${i}`,
    productId,
    formId: form,
    name: value,
    normalizedName: value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase(),
    languageCode: language,
    countryIds: [country],
    regionIds: rid ? [rid] : [],
    culturalAreaIds: [],
    localContext,
    status: 'documented',
    evidenceIds: [eid],
  });
  const p = c.products.find((p) => p.id === productId);
  if (!p.sourceIds.includes(sid)) p.sourceIds.push(sid);
}
function context(slug, country, localContext, description, sid, locator, form, regionText = '') {
  const productId = `product-${slug}`,
    rid = regionText ? region(country, regionText) : null;
  c.contexts.push({
    id: `context-${c.contexts.length}`,
    productId,
    countryId: country,
    regionIds: rid ? [rid] : [],
    localContext,
    description,
    sourceId: sid,
    locator,
    form,
  });
  const p = c.products.find((p) => p.id === productId);
  if (!p.sourceIds.includes(sid)) p.sourceIds.push(sid);
}
// Rabat survey: names only, NO medicinal claims, recipes or dietary advice imported.
for (const [slug, value] of [
  ['coriandre', 'Kasbour'],
  ['fenugrec', 'Helba'],
  ['oignon', 'Bessela'],
  ['gombo', 'Mloukhia'],
  ['clou-girofle', 'Kronfel'],
  ['clou-girofle', 'Oud newwar'],
  ['curcuma', 'Al-kharkoum'],
  ['gingembre', 'Skenjbir'],
])
  name(
    slug,
    value,
    'local-und',
    'MAR',
    'Enquête auprès de patients à Rabat ; nom cité, usage culinaire non établi',
    'rabat-names',
    'Table 2 — nom local / taxon',
    'rabat',
  );
name(
  'soumbala',
  'soumbala',
  'local-und',
  'MLI',
  'Mali, mention nationale dans la source',
  'fao-netetou',
  'Box 2.2 — Parkia',
);
name(
  'soumbala',
  'soumbala',
  'local-und',
  'BFA',
  'Burkina Faso, mention nationale dans la source',
  'fao-netetou',
  'Box 2.2 — Parkia',
);
name(
  'soumbala',
  'nététou',
  'local-und',
  'SEN',
  'Sénégal ; filière de Fogny / Basse Casamance étudiée',
  'fao-netetou',
  'Box 2.2 — transformation et commercialisation',
);
context(
  'soumbala',
  'SEN',
  'Fogny (Basse Casamance) et débouché à Dakar',
  'Condiment fermenté ; une filière locale et des formes pâte, poudre et cubes sont étudiées. La photo de boulettes ne représente pas ces trois formes.',
  'fao-netetou',
  'Box 2.2',
  'fermenté',
);
context(
  'soumbala',
  'MLI',
  'Mali',
  'Condiment utilisé avec le riz et les légumes-feuilles.',
  'fao-mali',
  'p. 17 imprimée / PDF page 17',
  'fermenté',
);
name(
  'baobab',
  'oroupounnà',
  'local-und',
  'MLI',
  'Pays Dogon ; langue précise non indiquée',
  'fao-mali',
  'Condiments du pays Dogon — PDF page 15',
  '',
  'form-baobab-poudre',
);
name(
  'gombo-poudre',
  'gangadjou',
  'local-und',
  'MLI',
  'Pays Dogon ; langue précise non indiquée',
  'fao-mali',
  'Condiments du pays Dogon — PDF page 15',
  '',
  'form-gombo-poudre-poudre',
);
context(
  'baobab',
  'MLI',
  'Pays Dogon',
  'Poudre de feuilles entrant dans des sauces pour céréales.',
  'fao-mali',
  'Condiments du pays Dogon — PDF page 15',
  'poudre',
);
context(
  'gombo-poudre',
  'MLI',
  'Pays Dogon',
  'Condiment de fruits de gombo séchés et moulus.',
  'fao-mali',
  'Condiments du pays Dogon — PDF page 15',
  'poudre',
);
for (const [slug, text, page, form] of [
  [
    'gombo',
    'Fruits en sauces ; feuilles consommées aussi, sur une forme distincte.',
    '22',
    'frais',
  ],
  [
    'niebe',
    'Graines consommées entières ou transformées ; la farine nécessite une forme distincte.',
    '21',
    'graines',
  ],
  [
    'moringa',
    'Feuilles consommées avec céréales ; séchées, elles peuvent être réduites en poudre.',
    '22',
    'poudre',
  ],
  ['sesame', 'Graines grillées utilisées dans le meni, avec du miel.', '18', 'graines'],
  ['gingembre', 'Boisson proposée dans les marchés.', '18', 'frais'],
  ['tamarin', 'Boisson proposée dans les marchés.', '18', 'gousses'],
])
  context(
    slug,
    'MLI',
    'Mali, sans région établie pour cette mention',
    text,
    'fao-mali',
    `PDF page ${page}`,
    form,
  );
name(
  'eru',
  'eru',
  'local-und',
  'CMR',
  'Cameroun ; nom couvrant G. africanum ET G. buchholzianum',
  'fao-eru',
  'Introduction et contexte Bayangi',
);
context(
  'eru',
  'CMR',
  'Idenau ; Campo près de Kribi ; marché Mfoundi à Yaoundé',
  'Feuilles vendues et découpées ; le commerce peut mélanger deux espèces de Gnetum. Le nom eru ne suffit pas à les distinguer.',
  'prota-gnetum',
  'Uses / Production and international trade',
  'frais',
);
context(
  'eru',
  'CMR',
  'Bayangi — communauté citée par la source',
  'Feuilles alimentaires utilisées dans des repas traditionnels. Aucun rattachement administratif déduit du nom de la communauté.',
  'fao-eru',
  'Introduction',
  'frais',
);
name(
  'njansang',
  'ndjanssang',
  'local-und',
  'CMR',
  'Export depuis le Cameroun, selon PROTA',
  'prota-njansang',
  'Production and international trade',
);
context(
  'njansang',
  'CMR',
  'Zone forestière humide du Cameroun',
  'Amandes séchées broyées pour épaissir sauces et soupes.',
  'prota-njansang',
  'Uses / Production and international trade',
  'graines',
);
name(
  'ndole',
  'ndole',
  'fr',
  'CMR',
  'Cameroun ; nom du plat, distingué du nom botanique des feuilles',
  'prota-ndole',
  'Uses',
);
context(
  'ndole',
  'CMR',
  'Cameroun, mention nationale',
  'Feuilles traitées cuisinées avec arachides et viande ou crevettes ; le plat et les feuilles ne sont pas une même forme.',
  'prota-ndole',
  'Uses',
  'frais',
);
for (const country of ['CIV', 'CMR'])
  context(
    'corchorus',
    country,
    'Mention nationale, sans région précisée',
    'Corchorus olitorius est cité comme légume-feuille important. Les feuilles cuites donnent une texture mucilagineuse ; aucune appellation locale nationale n’est déduite.',
    'prota-corchorus',
    'Origin and geographic distribution / Uses',
    'frais',
  );
name(
  'njansang',
  'akpi',
  'local-und',
  'CIV',
  'Espace Taï ; langue de cette occurrence non précisée',
  'tai-akpi',
  'Tableau 5, p. 21 imprimée',
);
name(
  'njansang',
  'Kôlou',
  'local-und',
  'CIV',
  'Espace Taï ; langue de cette occurrence non précisée',
  'tai-akpi',
  'Tableau 5, p. 21 imprimée',
);
context(
  'njansang',
  'CIV',
  'Espace Taï ; correspondance ADM1 non établie',
  'Amandes destinées aux sauces, conservées et commercialisées.',
  'tai-akpi',
  'Sections 1.3.2–1.3.4, p. 26–27 imprimées',
  'graines',
);
context(
  'oseille-guinee',
  'CIV',
  'Côte d’Ivoire, sans région précisée',
  'Calices séchés et moulus utilisés dans les sauces en saison sèche. La photo représente les calices séchés, pas la poudre.',
  'prota-hibiscus',
  'Uses',
  'séché',
);
context(
  'oseille-guinee',
  'SEN',
  'Sénégal, sans région précisée',
  'Calices rouges séchés utilisés pour une boisson appelée bissap ; ce nom de boisson n’est pas attribué aux feuilles.',
  'prota-hibiscus',
  'Uses',
  'séché',
);
context(
  'oseille-guinee',
  'MLI',
  'Mali, sans région précisée',
  'La source cite la boisson da bilenni. Le nom de la boisson n’est pas présenté comme nom certain des calices en boutique.',
  'prota-hibiscus',
  'Uses',
  'séché',
);
context(
  'bissap-feuilles',
  'SEN',
  'Enquête agricole nationale 2021–2022',
  'La variable Bissap-feuille distingue une récolte de feuilles. Le formulaire d’enquête ne précise ni nom wolof ni appellation régionale.',
  'fao-bissap-leaves',
  'Variable Q2_22A_0__4',
  'frais',
);
name(
  'bissap-feuilles',
  'Bissap-feuille',
  'fr',
  'SEN',
  'Libellé de variable de l’enquête agricole, pas appellation wolof vérifiée',
  'fao-bissap-leaves',
  'Variable Q2_22A_0__4',
);
context(
  'safran',
  'MAR',
  'Taliouine, région Souss-Massa',
  'L’étude porte sur le safran de Taliouine et d’autres zones de production ; le produit est constitué de stigmates séchés. La photo iranienne illustre la forme, pas l’origine marocaine.',
  'saffron-taliouine',
  'Introduction / study area',
  'séché',
  'souss',
);
name(
  'safran',
  'safran de Taliouine',
  'fr',
  'MAR',
  'Taliouine uniquement ; pas tout le pays',
  'saffron-taliouine',
  'Title / study area',
  'souss',
);
// No unproven Moroccan name is added to cumin or mint; geographical uses remain a backlog.
for (const p of c.products) {
  if (c.contexts.some((ctx) => ctx.productId === p.id))
    p.usage =
      'Consultez les contextes locaux ci-dessous : chaque usage est relié à sa propre source et à son périmètre.';
}
c.forms = c.forms || [];
for (const p of c.products) {
  const id = `form-${p.slug}-${p.formTypes[0]}`;
  if (!c.forms.some((f) => f.id === id))
    c.forms.push({
      id,
      productId: p.id,
      formType: p.formTypes[0],
      description: `Forme distincte : ${p.formTypes[0]}`,
      sourceIds: p.sourceIds,
    });
}
const photos = JSON.parse(await readFile('data/research/selected-photos.json', 'utf8'));
for (const slug of ['menthe', 'muscade']) {
  const p = c.products.find((p) => p.slug === slug);
  const old = c.images.find((i) => i.id === `shop-photo-${slug}`);
  if (old) old.role = 'complementary';
  if (p) p.imageId = slug === 'muscade' ? 'photo-muscade' : 'photo-gap-menthe';
}
for (const p of c.products) {
  if (['cumin', 'menthe'].includes(p.slug))
    p.sourceIds = p.sourceIds.filter((id) => id.startsWith('wikidata-'));
}
// These selections have passed the local contact-sheet inspection.
for (const photo of photos) {
  const p = c.products.find((p) => p.slug === photo.slug);
  if (!p) continue;
  for (const [size, target] of [
    [960, photo.localPath],
    [400, photo.smallPath],
  ]) {
    const cached = `data/research/photos/${photo.slug}-${size}.webp`;
    try {
      await access(cached);
      await copyFile(cached, `public${target}`);
    } catch {
      await access(`public${target}`);
    } // A fresh checkout retains the reviewed public assets.
  }
  c.images = c.images.filter((i) => i.id !== photo.id);
  c.images.push(photo);
  p.imageId = photo.id;
  p.formTypes = [photo.form];
  p.editorialNote = `Photographie principale : ${photo.form}. Elle ne représente pas les autres formes ni une provenance nationale. Les photographies botaniques antérieures sont conservées comme compléments documentaires.`;
}
for (const p of c.products) {
  const img = c.images.find((i) => i.id === p.imageId);
  if (img.role !== 'primary') {
    p.editorialNote =
      'Photographie de la forme vendue encore recherchée. Une vue botanique ou un spécimen ne remplace pas une photographie principale du produit.';
  }
}
for (const p of c.products) {
  const id = `form-${p.slug}-${p.formTypes[0]}`;
  if (!c.forms.some((f) => f.id === id))
    c.forms.push({
      id,
      productId: p.id,
      formType: p.formTypes[0],
      description: `Forme distincte : ${p.formTypes[0]}`,
      sourceIds: p.sourceIds,
    });
}
c.relations = c.relations || [];
for (const [from, to] of [
  ['gombo', 'gombo-poudre'],
  ['oseille-guinee', 'bissap-feuilles'],
]) {
  if (!c.relations.some((r) => r.fromId === `product-${from}` && r.toId === `product-${to}`))
    c.relations.push({
      fromId: `product-${from}`,
      toId: `product-${to}`,
      relationType: 'same-ingredient-other-form',
      evidenceIds: [],
    });
}
await json(file, c);
console.log(
  `${c.products.length} products; ${c.contexts.length} local use contexts; ${c.names.filter((n) => n.id.startsWith('context-name-')).length} sourced contextual names; ${photos.length} selected shop photographs.`,
);
