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
const nomsPays = { MLI: 'Mali', SEN: 'Sénégal', CIV: 'Côte d’Ivoire', KEN: 'Kenya', BFA: 'Burkina Faso', NGA: 'Nigeria', MAR: 'Maroc' };
function exemplePays(iso, nom) {
  const n = names.find((x) => x.countryIds.includes(iso) && x.name.toLowerCase() === nom.toLowerCase());
  if (!n) throw new Error(`Nom « ${nom} » non rattaché à ${iso} dans les données : exemple refusé.`);
  const produit = products.find((p) => p.id === n.productId);
  return { iso, pays: nomsPays[iso], nom: n.name, produit: produit.labelFr, langue: etiquettes[langueDe(n)] || langueDe(n) };
}
const ailleurs = [
  exemplePays('MLI', 'soumbala'),
  exemplePays('SEN', 'nététou'),
  exemplePays('CIV', 'akpi'),
  exemplePays('KEN', 'managu'),
];

const sortie = {
  genereLe: new Date().toISOString().slice(0, 10),
  chiffres,
  demo,
  ailleurs,
  photos,
  cartes: {
    cameroun: carteCameroun,
    camerounCredit: 'Limites : geoBoundaries 2016 · CC BY 3.0',
    afrique: carteAfrique,
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
