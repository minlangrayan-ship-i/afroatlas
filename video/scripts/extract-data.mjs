// Extrait du site les chiffres, exemples, sources et cartes utilisés dans les vidéos.
// Rien n'est saisi à la main : si les données du site changent, relancer ce script
// (il est appelé par `npm run render:all`) met les vidéos à jour.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { geoArea, geoMercator, geoPath } from 'd3-geo';

const racine = new URL('../../', import.meta.url);
const lire = async (chemin) => JSON.parse(await readFile(new URL(chemin, racine), 'utf8'));
const catalogue = await lire('src/data/published/catalogue.json');
const geographie = await lire('src/data/published/geography.json');
const monde = await lire('src/data/published/world.json');

const { products, names, sources, evidence, images, contexts = [] } = catalogue;
const sourceDe = (nom) => {
  const preuve = evidence.find((e) => e.id === nom.evidenceIds[0]);
  return sources.find((s) => s.id === preuve?.sourceId);
};
const langueDe = (n) => n.languageLabel || n.languageId || n.languageCode || '';

// ---------- Chiffres réels ----------
const pays = new Set([...names.flatMap((n) => n.countryIds), ...contexts.map((c) => c.countryId)]);
const nomsCmr = names.filter((n) => n.countryIds.includes('CMR'));
const etiquettes = { bas: 'Bassa', dua: 'Douala', ewo: 'Ewondo', fan: 'Fang', bum: 'Boulou' };
const languesCmr = [
  ...new Set(
    nomsCmr
      .map((n) => etiquettes[langueDe(n)] || langueDe(n))
      .filter((l) => l && !['Français', 'Anglais', 'fr', 'en', 'local-und'].includes(l)),
  ),
].sort((a, b) => a.localeCompare(b, 'fr'));
const regionsCmr = geographie.regions.filter((r) => r.countryISO3 === 'CMR');
const regionsDocumentees = new Set([
  ...nomsCmr.flatMap((n) => n.regionIds),
  ...contexts.filter((c) => c.countryId === 'CMR').flatMap((c) => c.regionIds),
]);
const sourcesCmr = new Set(nomsCmr.map((n) => sourceDe(n)?.id).filter(Boolean));
const chiffres = {
  fiches: products.length,
  appellations: names.length,
  sources: sources.length,
  langues: new Set(names.map(langueDe).filter(Boolean)).size,
  photos: products.filter((p) => images.find((i) => i.id === p.imageId)?.role === 'primary').length,
  pays: pays.size,
  cmrAppellations: nomsCmr.length,
  cmrProduits: new Set(nomsCmr.map((n) => n.productId)).size,
  cmrLangues: languesCmr,
  cmrSources: sourcesCmr.size,
  cmrRegions: regionsCmr.length,
  cmrRegionsDocumentees: regionsCmr.filter((r) => regionsDocumentees.has(r.id)).length,
};

// ---------- Exemples de démonstration ----------
function exemple(slug, ordre) {
  const produit = products.find((p) => p.slug === slug);
  const tous = names.filter((n) => n.productId === produit.id && n.countryIds.includes('CMR'));
  // Une entrée par nom, avec toutes ses langues (ex. njangsang : Bassa, Douala).
  const groupes = new Map();
  for (const n of tous) {
    const cle = n.name.toLowerCase();
    const langue = etiquettes[langueDe(n)] || langueDe(n);
    if (!groupes.has(cle)) groupes.set(cle, { nom: n.name, langues: [] });
    if (!groupes.get(cle).langues.includes(langue)) groupes.get(cle).langues.push(langue);
  }
  const liste = [...groupes.values()].sort(
    (a, b) => (ordre.indexOf(a.nom) + 1 || 99) - (ordre.indexOf(b.nom) + 1 || 99),
  );
  const source = sourceDe(tous[0]);
  const preuve = evidence.find((e) => e.id === tous[0].evidenceIds[0]);
  const image = images.find((i) => i.id === produit.imageId);
  return {
    slug,
    titre: produit.labelFr,
    scientifique: produit.scientificName,
    noms: liste,
    source: { titre: source.title, editeur: source.publisher, emplacement: preuve.locator },
    photo: { fichier: image.localPath.split('/').pop(), credit: `${image.creator} · ${image.licenseId}` },
  };
}
const demo = {
  njangsang: exemple('ricinodendron-plante', [
    'njangsang', 'essang', 'essessang', 'isangé', 'esangasanga', 'oryok', 'nzonell',
  ]),
  safou: exemple('safoutier', ['sao', 'sah', 'assa', 'odou', 'wom']),
};

// ---------- Photos (crédits obligatoires pour les licences CC BY / BY-SA) ----------
const montage = ['njansang', 'gombo', 'piment-chinense', 'manioc-feuilles', 'soumbala', 'tilapia-nil', 'maniguette', 'eru'];
const photos = [];
await mkdir(new URL('../public/images/', import.meta.url), { recursive: true });
for (const slug of [...montage, 'ricinodendron-plante', 'safoutier']) {
  const produit = products.find((p) => p.slug === slug);
  const image = images.find((i) => i.id === produit?.imageId);
  if (!image || image.role !== 'primary') continue;
  const fichier = image.localPath.split('/').pop();
  await copyFile(new URL(`public${image.localPath}`, racine), new URL(`../public/images/${fichier}`, import.meta.url));
  photos.push({ slug, titre: produit.labelFr, fichier, credit: `${image.creator} · ${image.licenseId}` });
}

// ---------- Cartes (tracés réels) ----------
// d3 attend des contours orientés dans le sens horaire : un polygone « à l'envers » couvrirait
// toute la sphère (carte affichée comme un carré). On inverse ces anneaux.
function reorienter(feature) {
  if (geoArea(feature) <= 2 * Math.PI) return feature;
  const inverser = (anneaux) => anneaux.map((a) => [...a].reverse());
  const g = feature.geometry;
  const coordinates = g.type === 'Polygon' ? inverser(g.coordinates) : g.coordinates.map(inverser);
  return { ...feature, geometry: { ...g, coordinates } };
}
const cameroun = { ...geographie.geometries.CMR, features: geographie.geometries.CMR.features.map(reorienter) };
const projCmr = geoMercator().fitSize([1000, 1000], cameroun);
const traceCmr = geoPath(projCmr);
const carteCameroun = cameroun.features.map((f) => {
  const region = regionsCmr.find((r) => r.id === f.properties.id);
  const [x, y] = traceCmr.centroid(f);
  return { nom: region?.name || f.properties.shapeName, d: traceCmr(f), documentee: regionsDocumentees.has(f.properties.id), x, y };
});
const afrique = { type: 'FeatureCollection', features: monde.features.filter((f) => f.properties.CONTINENT === 'Africa') };
const projAfr = geoMercator().fitSize([1000, 1000], afrique);
const traceAfr = geoPath(projAfr);
const carteAfrique = afrique.features.map((f) => ({
  iso: f.properties.ADM0_A3,
  d: traceAfr(f),
  documente: pays.has(f.properties.ADM0_A3),
}));

// ---------- Au-delà du Cameroun : noms rattachés à d'autres pays par une source ----------
const nomsPays = {
  CMR: 'Cameroun', CIV: 'Côte d’Ivoire', MLI: 'Mali', BFA: 'Burkina Faso', SEN: 'Sénégal', GAB: 'Gabon',
  GNQ: 'Guinée équatoriale', KEN: 'Kenya', NGA: 'Nigeria', MAR: 'Maroc', TCD: 'Tchad', UGA: 'Ouganda', ZWE: 'Zimbabwe',
};
function exemplePays(iso, nom, slug) {
  // Le produit est précisé : un même nom peut désigner plusieurs fiches (feuilles, calices…).
  const fiche = products.find((p) => p.slug === slug);
  const n = names.find(
    (x) => x.productId === fiche?.id && x.countryIds.includes(iso) && x.name.toLowerCase() === nom.toLowerCase(),
  );
  if (!n) throw new Error(`Nom « ${nom} » non rattaché à ${iso} dans les données : exemple refusé.`);
  const produit = products.find((p) => p.id === n.productId);
  return { iso, pays: nomsPays[iso], nom: n.name, produit: produit.labelFr, langue: etiquettes[langueDe(n)] || langueDe(n) };
}
const ailleurs = [
  exemplePays('MLI', 'soumbala', 'soumbala'),
  exemplePays('SEN', 'nététou', 'soumbala'),
  exemplePays('CMR', 'foléré', 'bissap-feuilles'),
  exemplePays('SEN', 'bissap-feuille', 'bissap-feuilles'),
];

// ---------- Produits de l'histoire « afroshop » : leurs noms classés par pays ----------
function produitParPays(slug) {
  const produit = products.find((p) => p.slug === slug);
  const image = images.find((i) => i.id === produit.imageId);
  const vus = new Set();
  const parPays = [];
  for (const n of names.filter((x) => x.productId === produit.id && x.countryIds.length)) {
    for (const iso of n.countryIds) {
      const cle = `${n.name.toLowerCase()}|${iso}`;
      if (vus.has(cle)) continue;
      vus.add(cle);
      const source = sourceDe(n);
      const preuve = evidence.find((e) => e.id === n.evidenceIds[0]);
      parPays.push({
        nom: n.name,
        iso,
        pays: nomsPays[iso] || iso,
        langue: etiquettes[langueDe(n)] || (langueDe(n) === 'local-und' ? '' : langueDe(n)),
        source: { titre: source?.title || '', editeur: source?.publisher || '', emplacement: preuve?.locator || '' },
      });
    }
  }
  return {
    slug,
    titre: produit.labelFr,
    scientifique: produit.scientificName,
    photo: { fichier: image.localPath.split('/').pop(), credit: `${image.creator} · ${image.licenseId}` },
    parPays,
  };
}
const histoire = { njansang: produitParPays('njansang'), soumbala: produitParPays('soumbala') };
// Les paires racontées dans la voix off doivent exister dans les données.
for (const [slug, iso, nom] of [['njansang', 'CMR', 'njangsang'], ['njansang', 'CIV', 'akpi'], ['soumbala', 'MLI', 'soumbala'], ['soumbala', 'SEN', 'nététou']])
  if (!histoire[slug].parPays.some((n) => n.iso === iso && n.nom.toLowerCase() === nom))
    throw new Error(`« ${nom} » (${iso}) absent de la fiche ${slug} : script à corriger.`);

// ---------- Carte du trajet Afrique → Europe ----------
const zone = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [[-18, -2], [30, 58]] } };
const projTrajet = geoMercator().fitSize([1000, 1000], zone);
const traceTrajet = geoPath(projTrajet);
const carteTrajet = monde.features
  .filter((f) => ['Africa', 'Europe'].includes(f.properties.CONTINENT) && f.properties.ADM0_A3 !== 'RUS')
  .map((f) => ({ iso: f.properties.ADM0_A3, d: traceTrajet(f) }))
  .filter((f) => f.d);
const villes = Object.fromEntries(
  Object.entries({ Douala: [9.7, 4.05], Paris: [2.35, 48.86], Bamako: [-8.0, 12.64], Bruxelles: [4.35, 50.85], Abidjan: [-4.01, 5.36] })
    .map(([nom, lonlat]) => [nom, projTrajet(lonlat)]),
);

const sortie = {
  genereLe: new Date().toISOString().slice(0, 10),
  chiffres,
  demo,
  ailleurs,
  histoire,
  photos,
  cartes: {
    cameroun: carteCameroun,
    camerounCredit: 'Limites : geoBoundaries 2016 · CC BY 3.0',
    afrique: carteAfrique,
    trajet: carteTrajet,
    villes,
    afriqueCredit: 'Fond de carte : Natural Earth (domaine public)',
  },
};
await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/generated/data.json', import.meta.url), JSON.stringify(sortie, null, 1));
console.log(
  `Données : ${chiffres.fiches} fiches, ${chiffres.appellations} appellations, ${chiffres.sources} sources, ` +
    `${chiffres.cmrLangues.length} langues camerounaises, ${chiffres.cmrRegionsDocumentees}/${chiffres.cmrRegions} régions, ` +
    `${chiffres.pays} pays, ${photos.length} photos.`,
);
