// Adds products from Côte d’Ivoire, Mali, Senegal, Guinea, Morocco and Tunisia.
// Same policy as catalogue.mjs and essentials-2026.mjs: an exact Wikidata match (P225 for a
// species, a named item for a preparation), names from Wikidata labels and aliases (CC0, no
// country inferred from a language), and Wikimedia Commons photographs under CC BY, CC BY-SA,
// CC0 or public domain only. Each photograph is checked by a person before it is published.
//
// Usage (Wikimedia allows few requests from shared addresses, so requests are grouped):
//   NODE_USE_ENV_PROXY=1 node scripts/import/ouest-nord-2026.mjs collect
//     → data/candidates/ouest-nord-2026.json and 400 px previews for the visual review
//   NODE_USE_ENV_PROXY=1 node scripts/import/ouest-nord-2026.mjs apply
//     → reads data/candidates/ouest-nord-2026-review.json and writes the accepted records
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { agent, date, pause, plain } from './common.mjs';

const mode = process.argv[2];
// [slug, labelFr, scientific names or Wikidata item, category, forms, countries]
const seeds = [
  ['riz', 'Riz', ['Oryza sativa'], 'staples', ['grains'], 'CIV MLI SEN GIN'],
  ['riz-africain', 'Riz africain', ['Oryza glaberrima'], 'staples', ['grains'], 'MLI GIN SEN'],
  [
    'mil',
    'Mil perlé',
    ['Cenchrus americanus', 'Pennisetum glaucum'],
    'staples',
    ['grains'],
    'MLI SEN',
  ],
  ['sorgho', 'Sorgho', ['Sorghum bicolor'], 'staples', ['grains'], 'MLI SEN'],
  ['fonio', 'Fonio', ['Digitaria exilis'], 'staples', ['grains'], 'GIN MLI'],
  ['voandzou', 'Voandzou', ['Vigna subterranea'], 'staples', ['graines'], 'MLI CIV'],
  ['igname-blanche', 'Igname blanche', ['Dioscorea rotundata'], 'staples', ['tubercule'], 'CIV'],
  ['ble-dur', 'Blé dur', ['Triticum durum'], 'staples', ['grains'], 'MAR TUN'],
  ['orge', 'Orge', ['Hordeum vulgare'], 'staples', ['grains'], 'MAR TUN'],
  ['pois-chiche', 'Pois chiche', ['Cicer arietinum'], 'staples', ['graines'], 'MAR TUN'],
  ['lentille', 'Lentille', ['Lens culinaris'], 'staples', ['graines'], 'MAR TUN'],
  ['feve', 'Fève', ['Vicia faba'], 'staples', ['graines'], 'MAR TUN'],
  ['souchet', 'Souchet', ['Cyperus esculentus'], 'staples', ['tubercules'], 'MLI MAR'],
  ['haricot', 'Haricot commun', ['Phaseolus vulgaris'], 'staples', ['graines'], 'MAR CIV'],
  ['banane-dessert', 'Banane dessert', ['Musa acuminata'], 'fruits', ['fruits'], 'CIV GIN'],
  ['pasteque', 'Pastèque', ['Citrullus lanatus'], 'fruits', ['fruits'], 'SEN MAR'],
  [
    'egusi-pistache',
    'Pistache (graines de courge)',
    ['Citrullus mucosospermus'],
    'spices',
    ['graines'],
    'CIV',
  ],
  ['datte', 'Datte', ['Phoenix dactylifera'], 'fruits', ['fruits'], 'TUN MAR'],
  ['figue', 'Figue', ['Ficus carica'], 'fruits', ['fruits'], 'MAR TUN'],
  [
    'figue-barbarie',
    'Figue de Barbarie',
    ['Opuntia ficus-indica'],
    'fruits',
    ['fruits'],
    'MAR TUN',
  ],
  ['grenade', 'Grenade', ['Punica granatum'], 'fruits', ['fruits'], 'MAR TUN'],
  ['olive', 'Olive', ['Olea europaea'], 'fruits', ['fruits', 'huile'], 'TUN MAR'],
  [
    'argan',
    'Argan — amandes et huile',
    ['Argania spinosa', 'Sideroxylon spinosum'],
    'fruits',
    ['amandes', 'huile'],
    'MAR',
  ],
  ['amande', 'Amande', ['Prunus dulcis', 'Prunus amygdalus'], 'fruits', ['amandes'], 'MAR TUN'],
  ['citron', 'Citron', ['Citrus × limon', 'Citrus limon'], 'fruits', ['fruits'], 'MAR'],
  [
    'citron-vert',
    'Citron vert',
    ['Citrus × aurantiifolia', 'Citrus aurantiifolia'],
    'fruits',
    ['fruits'],
    'SEN CIV',
  ],
  [
    'bigarade',
    'Orange amère (bigarade)',
    ['Citrus × aurantium', 'Citrus aurantium'],
    'fruits',
    ['fruits', 'fleurs'],
    'MAR TUN',
  ],
  ['orange', 'Orange', ['Citrus × sinensis', 'Citrus sinensis'], 'fruits', ['fruits'], 'MAR'],
  ['papaye', 'Papaye', ['Carica papaya'], 'fruits', ['fruits'], 'CIV'],
  ['corossol', 'Corossol', ['Annona muricata'], 'fruits', ['fruits'], 'CIV GIN'],
  ['ananas', 'Ananas', ['Ananas comosus'], 'fruits', ['fruits'], 'CIV GIN'],
  ['noix-coco', 'Noix de coco', ['Cocos nucifera'], 'fruits', ['fruits'], 'CIV SEN'],
  ['kola', 'Noix de kola', ['Cola nitida'], 'fruits', ['noix'], 'CIV GIN MLI'],
  ['madd', 'Madd', ['Saba senegalensis'], 'fruits', ['fruits'], 'SEN MLI GIN'],
  ['ditax', 'Ditax', ['Detarium senegalense'], 'fruits', ['fruits'], 'SEN'],
  ['jujube', 'Jujube (sidem)', ['Ziziphus mauritiana'], 'fruits', ['fruits'], 'SEN MLI'],
  [
    'anacarde',
    'Noix de cajou et pomme cajou',
    ['Anacardium occidentale'],
    'fruits',
    ['noix', 'fruits'],
    'CIV GIN SEN',
  ],
  ['goyave', 'Goyave', ['Psidium guajava'], 'fruits', ['fruits'], 'CIV GIN'],
  ['caroube', 'Caroube', ['Ceratonia siliqua'], 'fruits', ['gousses'], 'MAR TUN'],
  ['soump', 'Dattier du désert (soump)', ['Balanites aegyptiaca'], 'fruits', ['fruits'], 'SEN MLI'],
  ['zgougou', 'Pin d’Alep — graines (zgougou)', ['Pinus halepensis'], 'spices', ['graines'], 'TUN'],
  ['avocat', 'Avocat', ['Persea americana'], 'fruits', ['fruits'], 'CIV GIN MAR'],
  ['coing', 'Coing', ['Cydonia oblonga'], 'fruits', ['fruits'], 'MAR TUN'],
  ['abricot', 'Abricot', ['Prunus armeniaca'], 'fruits', ['fruits'], 'MAR TUN'],
  ['arbouse', 'Arbouse', ['Arbutus unedo'], 'fruits', ['fruits'], 'MAR TUN'],
  ['cacao', 'Cacao', ['Theobroma cacao'], 'fruits', ['fèves'], 'CIV'],
  ['cafe-robusta', 'Café robusta', ['Coffea canephora'], 'preparations', ['grains'], 'CIV GIN'],
  ['poivron', 'Poivron et piment doux', ['Capsicum annuum'], 'vegetables', ['frais'], 'MAR TUN'],
  ['navet', 'Navet', ['Brassica rapa'], 'vegetables', ['frais'], 'MAR'],
  ['courgette', 'Courgette', ['Cucurbita pepo'], 'vegetables', ['frais'], 'MAR TUN'],
  ['celeri', 'Céleri', ['Apium graveolens'], 'vegetables', ['frais'], 'MAR'],
  ['artichaut', 'Artichaut et cardon', ['Cynara cardunculus'], 'vegetables', ['frais'], 'MAR TUN'],
  ['mauve', 'Mauve (khobbiza)', ['Malva sylvestris'], 'vegetables', ['feuilles'], 'MAR'],
  ['betterave', 'Betterave', ['Beta vulgaris'], 'vegetables', ['frais'], 'MAR TUN'],
  ['persil', 'Persil', ['Petroselinum crispum'], 'herbs', ['frais'], 'MAR TUN'],
  ['verveine', 'Verveine odorante (louiza)', ['Aloysia citrodora'], 'herbs', ['feuilles'], 'MAR'],
  [
    'origan-maroc',
    'Origan du Maroc (zaatar)',
    ['Origanum compactum'],
    'herbs',
    ['feuilles'],
    'MAR',
  ],
  ['thym', 'Thym', ['Thymus vulgaris'], 'herbs', ['feuilles'], 'MAR TUN'],
  ['marjolaine', 'Marjolaine', ['Origanum majorana'], 'herbs', ['feuilles'], 'MAR'],
  ['sauge', 'Sauge officinale', ['Salvia officinalis'], 'herbs', ['feuilles'], 'MAR'],
  [
    'romarin',
    'Romarin',
    ['Salvia rosmarinus', 'Rosmarinus officinalis'],
    'herbs',
    ['feuilles'],
    'MAR TUN',
  ],
  ['laurier', 'Laurier-sauce', ['Laurus nobilis'], 'herbs', ['feuilles'], 'MAR TUN'],
  ['citronnelle', 'Citronnelle', ['Cymbopogon citratus'], 'herbs', ['feuilles'], 'CIV GIN'],
  ['kinkeliba', 'Kinkéliba', ['Combretum micranthum'], 'herbs', ['feuilles'], 'SEN MLI GIN'],
  [
    'rose-damas',
    'Rose de Damas',
    ['Rosa × damascena', 'Rosa damascena'],
    'herbs',
    ['fleurs'],
    'MAR',
  ],
  ['basilic', 'Basilic', ['Ocimum basilicum'], 'herbs', ['feuilles'], 'MAR TUN'],
  ['the-gambie', 'Thé de Gambie', ['Lippia multiflora'], 'herbs', ['feuilles'], 'CIV GIN'],
  ['cannelle', 'Cannelle', ['Cinnamomum verum'], 'spices', ['écorce'], 'MAR TUN'],
  ['poivre-noir', 'Poivre noir', ['Piper nigrum'], 'spices', ['grains'], 'MAR TUN SEN'],
  ['anis-vert', 'Anis vert', ['Pimpinella anisum'], 'spices', ['graines'], 'MAR TUN'],
  ['carvi', 'Carvi', ['Carum carvi'], 'spices', ['graines'], 'TUN'],
  ['nigelle', 'Nigelle', ['Nigella sativa'], 'spices', ['graines'], 'MAR TUN'],
  [
    'gomme-arabique',
    'Gomme arabique',
    ['Senegalia senegal', 'Acacia senegal'],
    'spices',
    ['gomme'],
    'SEN MLI',
  ],
  ['capre', 'Câpre', ['Capparis spinosa'], 'spices', ['boutons floraux'], 'MAR TUN'],
  ['ras-el-hanout', 'Ras el hanout', 'Q1067261', 'spices', ['mélange'], 'MAR TUN'],
  ['attieke', 'Attiéké', 'Q2870132', 'preparations', ['semoule de manioc'], 'CIV'],
  ['couscous', 'Couscous (semoule)', 'Q76605', 'preparations', ['semoule'], 'MAR TUN'],
  ['smen', 'Smen', 'Q2397413', 'preparations', ['beurre'], 'MAR'],
  ['bsissa', 'Bsissa', 'Q2527136', 'preparations', ['farine'], 'TUN'],
  ['citron-confit', 'Citron confit', 'Q2723408', 'preparations', ['confit'], 'MAR'],
  ['cafe-touba', 'Café Touba', 'Q2756864', 'preparations', ['moulu'], 'SEN'],
  ['gari', 'Gari', 'Q1494252', 'preparations', ['semoule de manioc'], 'CIV GIN'],
  ['huile-palme', 'Huile de palme', 'Q231458', 'preparations', ['huile'], 'CIV GIN'],
  ['beurre-karite', 'Beurre de karité', 'Q495857', 'preparations', ['beurre'], 'MLI CIV GIN'],
  [
    'eau-fleur-oranger',
    'Eau de fleur d’oranger',
    'Q902582',
    'preparations',
    ['eau florale'],
    'MAR TUN',
  ],
  ['eau-rose', 'Eau de rose', 'Q900450', 'preparations', ['eau florale'], 'MAR'],
  ['degue', 'Dégué (thiakry)', 'Q16935381', 'preparations', ['préparation'], 'MLI SEN'],
  ['khlii', 'Khlii', 'Q2892007', 'preparations', ['viande séchée'], 'MAR'],
  [
    'the-vert',
    'Thé vert gunpowder',
    'Q1079875',
    'preparations',
    ['feuilles roulées'],
    'MAR SEN MLI',
  ],
  ['thiof', 'Mérou blanc (thiof)', ['Epinephelus aeneus'], 'fish', ['frais'], 'SEN'],
  [
    'ethmalose',
    'Ethmalose (bonga)',
    ['Ethmalosa fimbriata'],
    'fish',
    ['frais', 'fumé'],
    'SEN GIN CIV',
  ],
  ['listao', 'Listao (bonite)', ['Katsuwonus pelamis'], 'fish', ['frais'], 'SEN CIV'],
  ['albacore', 'Thon albacore', ['Thunnus albacares'], 'fish', ['frais'], 'SEN CIV'],
  ['machoiron', 'Mâchoiron', ['Chrysichthys nigrodigitatus'], 'fish', ['frais', 'fumé'], 'CIV'],
  ['carpe-rouge', 'Carpe rouge (vivaneau)', ['Lutjanus agennes'], 'fish', ['frais'], 'CIV'],
  ['anchois', 'Anchois', ['Engraulis encrasicolus'], 'fish', ['frais', 'salé'], 'MAR TUN'],
  ['sardine', 'Sardine', ['Sardina pilchardus'], 'fish', ['frais'], 'MAR'],
  ['poulpe', 'Poulpe', ['Octopus vulgaris'], 'fish', ['frais'], 'MAR SEN'],
  ['chinchard', 'Chinchard', ['Trachurus trecae'], 'fish', ['frais'], 'SEN CIV'],
  ['mulet', 'Mulet', ['Mugil cephalus'], 'fish', ['frais'], 'SEN TUN'],
  ['gros-capitaine', 'Gros capitaine', ['Polydactylus quadrifilis'], 'fish', ['frais'], 'CIV GIN'],
  ['dorade', 'Dorade royale', ['Sparus aurata'], 'fish', ['frais'], 'TUN MAR'],
  ['crevette', 'Crevette rose du large', ['Penaeus notialis'], 'fish', ['frais'], 'SEN'],
];
// Wikidata languages useful for these six countries; the language never establishes a country.
const languages = {
  fr: '',
  en: '',
  ar: '',
  wo: '',
  bm: '',
  ff: '',
  dyu: 'Dioula',
  sus: 'Soussou',
  mnk: 'Mandinka',
  snk: 'Soninké',
  ary: '',
  aeb: 'Arabe tunisien',
  zgh: 'Tamazight standard marocain',
  shi: 'Tachelhit',
  tzm: 'Tamazight du Maroc central',
  rif: 'Rifain',
  kab: '',
  ha: '',
  yo: '',
};
const candidatesFile = 'data/candidates/ouest-nord-2026.json';
const reviewFile = 'data/candidates/ouest-nord-2026-review.json';
const previewDir = 'data/candidates/ouest-nord-2026-previews';

async function cached(key, load) {
  await mkdir('data/raw/cache', { recursive: true });
  const file = `data/raw/cache/${createHash('sha256').update(key).digest('hex')}.${key.startsWith('bin:') ? 'bin' : 'json'}`;
  try {
    const raw = await readFile(file);
    return key.startsWith('bin:') ? raw : JSON.parse(raw.toString());
  } catch {}
  const value = await load();
  await writeFile(file, Buffer.isBuffer(value) ? value : JSON.stringify(value));
  return value;
}
// Wikimedia answers 429 with a Retry-After delay to shared addresses: wait as asked.
async function fetchPolitely(url, init = {}, { attempts = 8, maxWait = 120000 } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { 'User-Agent': agent, ...(init.headers || {}) },
      signal: AbortSignal.timeout(90000),
    });
    if (response.status === 429 || response.status >= 500) {
      const wait = Number(response.headers.get('retry-after') || 10) * 1000;
      if (wait > maxWait)
        throw new Error(`HTTP ${response.status}, attente demandée ${wait / 1000} s`);
      console.log(`  attente ${wait / 1000} s (HTTP ${response.status})`);
      await pause(wait + 1000);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
    return response;
  }
  throw new Error(`Trop de refus : ${url}`);
}
const sparql = (query) =>
  cached(`sparql:${query}`, async () => {
    const response = await fetchPolitely('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ query }),
    });
    return (await response.json()).results.bindings;
  });
// Fallback when the Commons API refuses us: the file page's wikitext names the licence
// templates and the author. Only unambiguous licence templates are accepted.
const licenceTemplates = [
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-sa-4\.0/i,
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-sa-(?:3\.0|all)/i,
    'CC BY-SA 3.0',
    'https://creativecommons.org/licenses/by-sa/3.0',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-sa-2\.5/i,
    'CC BY-SA 2.5',
    'https://creativecommons.org/licenses/by-sa/2.5',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-sa-2\.0/i,
    'CC BY-SA 2.0',
    'https://creativecommons.org/licenses/by-sa/2.0',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-4\.0/i,
    'CC BY 4.0',
    'https://creativecommons.org/licenses/by/4.0',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-3\.0/i,
    'CC BY 3.0',
    'https://creativecommons.org/licenses/by/3.0',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-2\.5/i,
    'CC BY 2.5',
    'https://creativecommons.org/licenses/by/2.5',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?cc-by-2\.0/i,
    'CC BY 2.0',
    'https://creativecommons.org/licenses/by/2.0',
  ],
  [
    /\{\{\s*(?:self\s*\|[^}]*?)?(?:cc-zero|cc0)/i,
    'CC0',
    'https://creativecommons.org/publicdomain/zero/1.0/',
  ],
  [
    /\{\{\s*PD-(?:self|user|author|old)/i,
    'Public domain',
    'https://creativecommons.org/publicdomain/mark/1.0/',
  ],
];
async function fromFilePage(title) {
  const page = `https://commons.wikimedia.org/wiki/File:${title.replace(/ /g, '_')}`;
  let text;
  try {
    text = await cached(`raw:${title}`, async () => {
      const url = `https://commons.wikimedia.org/w/index.php?title=${encodeURIComponent(`File:${title}`)}&action=raw`;
      return { text: await (await fetchPolitely(url)).text() };
    });
  } catch {
    return null;
  }
  const wikitext = text.text;
  if (/cc-by-nc|cc-by-nd|cc-by-sa-nc|noncommercial|fair use|non-free/i.test(wikitext)) return null;
  const licence = licenceTemplates.find(([pattern]) => pattern.test(wikitext));
  if (!licence) return null;
  const field = (name) =>
    wikitext.match(
      new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n|]*(?:\\[\\[[^\\]]*\\]\\][^\\n|]*)*)`, 'i'),
    )?.[1] || '';
  const clean = (v) =>
    plain(
      v
        .replace(/\[\[(?:User|Utilisateur):[^|\]]*\|([^\]]*)\]\]/gi, '$1')
        .replace(/\[\[(?:User|Utilisateur):([^\]]*)\]\]/gi, '$1')
        .replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, '$1')
        .replace(/\[\[([^\]]*)\]\]/g, '$1')
        .replace(/\[https?:\S+\s+([^\]]*)\]/g, '$1')
        .replace(/\{\{[^}]*\}\}/g, ''),
    );
  const artist = clean(field('author') || field('Author'));
  if (!artist) return null;
  return {
    title,
    license: licence[1],
    licenseUrl: licence[2],
    artist,
    credit: '',
    attributionRequired: '',
    description: clean(field('description')).slice(0, 300),
    descriptionUrl: page,
    // Special:FilePath redirects to the 960 px thumbnail on upload.wikimedia.org.
    thumbUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace(/ /g, '_'))}?width=960`,
    viaFilePage: true,
  };
}
function readCommons(data, info) {
  const normalized = new Map((data.query.normalized || []).map((n) => [n.to, n.from]));
  for (const page of Object.values(data.query.pages)) {
    const ii = page.imageinfo?.[0];
    if (!ii) continue;
    const title = (normalized.get(page.title) || page.title).replace(/^File:/, '');
    const meta = ii.extmetadata || {};
    info.set(title, {
      title,
      license: plain(meta.LicenseShortName?.value),
      licenseUrl: plain(meta.LicenseUrl?.value),
      artist: plain(meta.Artist?.value),
      credit: plain(meta.Credit?.value),
      attributionRequired: plain(meta.AttributionRequired?.value),
      description: plain(meta.ImageDescription?.value).slice(0, 300),
      descriptionUrl: ii.descriptionurl,
      thumbUrl: ii.thumburl,
      width: ii.width,
      height: ii.height,
    });
  }
}
const value = (row, key) => row[key]?.value;
const qid = (uri) => uri.split('/').pop();
const fileName = (uri) => decodeURIComponent(uri.split('/').pop()).replace(/_/g, ' ');

async function collect() {
  const taxa = seeds.flatMap(([, , names]) => (Array.isArray(names) ? names : []));
  const items = seeds.filter(([, , names]) => !Array.isArray(names)).map(([, , q]) => q);
  const found = await sparql(`SELECT ?item ?sci ?img WHERE {
    { VALUES ?sci { ${taxa.map((t) => JSON.stringify(t)).join(' ')} } ?item wdt:P225 ?sci . }
    UNION { VALUES ?item { ${items.map((q) => `wd:${q}`).join(' ')} } }
    OPTIONAL { ?item wdt:P18 ?img }
  }`);
  const entities = new Map();
  for (const row of found) {
    const id = qid(value(row, 'item'));
    const entry = entities.get(id) || { id, scientific: value(row, 'sci') || null, images: [] };
    const img = value(row, 'img');
    if (img && !entry.images.includes(fileName(img))) entry.images.push(fileName(img));
    entities.set(id, entry);
  }
  const ids = [...entities.keys()];
  const words = await sparql(`SELECT ?item ?label ?alias ?desc ?rev WHERE {
    VALUES ?item { ${ids.map((q) => `wd:${q}`).join(' ')} }
    ?item schema:version ?rev .
    { ?item rdfs:label ?label FILTER(LANG(?label) IN (${Object.keys(languages)
      .map((l) => `"${l}"`)
      .join(',')})) }
    UNION { ?item skos:altLabel ?alias FILTER(LANG(?alias) IN (${Object.keys(languages)
      .map((l) => `"${l}"`)
      .join(',')})) }
    UNION { ?item schema:description ?desc FILTER(LANG(?desc) = "fr") }
  }`);
  // Lexeme senses (L…-S…) can carry a P225 value too: only items describe products.
  for (const id of ids) if (!/^Q\d+$/.test(id)) entities.delete(id);
  for (const row of words) {
    const entry = entities.get(qid(value(row, 'item')));
    if (!entry) continue;
    entry.revision = value(row, 'rev');
    entry.labels ||= {};
    entry.aliases ||= {};
    if (row.label) entry.labels[row.label['xml:lang']] = row.label.value;
    if (row.alias) (entry.aliases[row.alias['xml:lang']] ||= []).push(row.alias.value);
    if (row.desc) entry.descriptionFr = row.desc.value;
  }
  // Photograph metadata, 50 files per request.
  const files = [...new Set([...entities.values()].flatMap((e) => e.images))];
  const info = new Map();
  // Metadata already received in earlier runs is reused whatever the batch it came in.
  const { readdir } = await import('node:fs/promises');
  for (const name of await readdir('data/raw/cache')) {
    if (!name.endsWith('.json')) continue;
    let data;
    try {
      data = JSON.parse(await readFile(`data/raw/cache/${name}`, 'utf8'));
    } catch {
      continue;
    }
    if (data?.query?.pages) readCommons(data, info);
  }
  const missing = files.filter((f) => !info.has(f));
  console.log(`  métadonnées en cache : ${files.length - missing.length}/${files.length}`);
  for (let i = 0; i < missing.length; i += 50) {
    const titles = missing.slice(i, i + 50).map((f) => `File:${f}`);
    let data;
    try {
      data = await cached(`commons:${titles.join('|')}`, async () => {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=960&titles=${encodeURIComponent(titles.join('|'))}`;
        return (await fetchPolitely(url, {}, { attempts: 3, maxWait: 60000 })).json();
      });
    } catch (error) {
      // The API refuses shared addresses for long periods: read each file page instead.
      console.log(`  API Commons indisponible (${error.message}) : lecture des pages`);
      for (const title of titles) {
        const meta = await fromFilePage(title.replace(/^File:/, ''));
        if (meta) info.set(meta.title, meta);
        await pause(800);
      }
      continue;
    }
    readCommons(data, info);
    await pause(1500);
  }
  const accepted = (l) => /^(CC BY|CC0|Public domain)/i.test(l) && !/NC|ND/i.test(l);
  const report = [];
  await mkdir(previewDir, { recursive: true });
  for (const [slug, labelFr, names, categoryId, formTypes, countries] of seeds) {
    // A scientific name can match several items: keep the one with photographs.
    const entity = Array.isArray(names)
      ? names
          .map(
            (n) =>
              [...entities.values()]
                .filter((e) => e.scientific === n)
                .sort((a, b) => b.images.length - a.images.length)[0],
          )
          .find(Boolean)
      : entities.get(names);
    if (!entity) {
      report.push({ slug, labelFr, gap: 'Aucune entité Wikidata exacte' });
      continue;
    }
    const photos = [];
    // Two candidates per product at most, one download every 8 s: the thumbnail server
    // bans faster clients for ten minutes.
    for (const title of entity.images) {
      if (photos.length >= 2) break;
      const meta = info.get(title);
      if (!meta || !accepted(meta.license) || /\.(svg|pdf|tiff?|gif|webm|ogv)$/i.test(title))
        continue;
      const preview = `${previewDir}/${slug}-${photos.length}.jpg`;
      let downloaded = false;
      const bytes = await cached(`bin:${meta.thumbUrl}`, async () => {
        downloaded = true;
        const response = await fetchPolitely(meta.thumbUrl, {}, { attempts: 6, maxWait: 700000 });
        return Buffer.from(await response.arrayBuffer());
      });
      await sharp(bytes).rotate().resize({ width: 400 }).jpeg({ quality: 78 }).toFile(preview);
      photos.push({ ...meta, preview });
      if (downloaded) await pause(8000);
    }
    report.push({ slug, labelFr, categoryId, formTypes, countries, entity, photos });
    console.log(
      `${photos.length ? 'OK ' : 'NO '} ${slug} ${entity.id} · ${photos.length} photo(s)`,
    );
  }
  await writeFile(candidatesFile, JSON.stringify({ date, report }, null, 2) + '\n');
}

const normalize = (v) =>
  v
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
async function apply() {
  const { report } = JSON.parse(await readFile(candidatesFile, 'utf8'));
  const review = JSON.parse(await readFile(reviewFile, 'utf8'));
  const file = 'src/data/published/catalogue.json';
  const catalogue = JSON.parse(await readFile(file, 'utf8'));
  const upsert = (key, row) => {
    const i = catalogue[key].findIndex((r) => r.id === row.id);
    if (i >= 0) catalogue[key][i] = row;
    else catalogue[key].push(row);
  };
  let added = 0;
  for (const entry of report) {
    const decision = review[entry.slug];
    if (!decision || decision.reject) continue;
    const { entity } = entry;
    if (catalogue.products.some((p) => p.taxonId === entity.id && p.slug !== entry.slug))
      throw new Error(`${entry.slug}: entité déjà décrite (${entity.id})`);
    const photo = entry.photos[decision.photo];
    const bytes = await cached(`bin:${photo.thumbUrl}`, async () =>
      Buffer.from(await (await fetchPolitely(photo.thumbUrl)).arrayBuffer()),
    );
    const large = `public/images/${entry.slug}-960.webp`;
    const small = `public/images/${entry.slug}-400.webp`;
    const out = await sharp(bytes)
      .rotate()
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(large);
    await sharp(bytes)
      .rotate()
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(small);
    const webp = await readFile(large);
    const id = `product-${entry.slug}`;
    const sourceId = `wikidata-${entity.id}`;
    upsert('sources', {
      id: sourceId,
      title: `Wikidata · ${entity.id}`,
      publisher: 'Wikidata',
      url: `https://www.wikidata.org/wiki/${entity.id}`,
      licenseId: 'CC0-1.0',
      retrievedAt: date,
      datasetVersion: String(entity.revision || date),
    });
    const imageId = `photo-${entry.slug}`;
    upsert('images', {
      id: imageId,
      localPath: `/images/${entry.slug}-960.webp`,
      smallPath: `/images/${entry.slug}-400.webp`,
      width: out.width,
      height: out.height,
      altFr: `${entry.labelFr} — ${decision.depictedPart}`,
      creator: photo.artist || 'Auteur indiqué sur la page source',
      sourcePageUrl: photo.descriptionUrl,
      licenseId: photo.license,
      licenseUrl:
        photo.licenseUrl.replace(/^http:/, 'https:') ||
        'https://creativecommons.org/publicdomain/mark/1.0/',
      attribution: `${photo.artist || 'Auteur indiqué sur la page source'} · ${photo.title} · ${photo.license}`,
      modifications: 'Redimensionnement, orientation EXIF et conversion WebP ; aucun recadrage',
      retrievedAt: date,
      title: photo.title,
      description: photo.description,
      role: decision.role,
      depictedForm: decision.depictedForm,
      depictedPart: decision.depictedPart,
      depictedProductId: id,
      visuallyCheckedAt: date,
      visualCheckResult: decision.check,
      verificationStatus: 'visually_checked',
      metadataCheckedAt: date,
      format: 'webp',
      fileSize: webp.length,
      sha256: createHash('sha256').update(webp).digest('hex'),
      sortOrder: 0,
    });
    for (const [lang, languageLabel] of Object.entries(languages)) {
      const values = [entity.labels?.[lang], ...(entity.aliases?.[lang] || []).slice(0, 8)];
      const seen = new Set();
      values.forEach((name, i) => {
        if (!name || seen.has(normalize(name))) return;
        seen.add(normalize(name));
        const eid = `evidence-${entry.slug}-${lang}-${i}`;
        const locator = i === 0 ? `labels.${lang}.value` : `aliases.${lang}[${i - 1}].value`;
        upsert('evidence', {
          id: eid,
          sourceId,
          assertionType: 'name',
          locator,
          shortNote:
            'Libellé ou alias linguistique Wikidata ; aucun usage par pays, région ou boutique établi.',
          checkedAt: null,
          checkedBy: null,
        });
        upsert('names', {
          id: `name-${entry.slug}-${lang}-${i}`,
          productId: id,
          formId: null,
          name,
          normalizedName: normalize(name),
          languageCode: lang,
          countryIds: [],
          regionIds: [],
          culturalAreaIds: [],
          status: 'documented',
          evidenceIds: [eid],
          localContext: '',
          ...(name === entity.scientific ? { nameType: 'scientific' } : {}),
          ...(languageLabel ? { languageLabel } : {}),
        });
      });
    }
    const scientific = entity.scientific;
    const descriptionFr = entity.descriptionFr
      ? `${entity.descriptionFr.charAt(0).toUpperCase()}${entity.descriptionFr.slice(1)} (description Wikidata).`
      : `Fiche d’identification ${/^[AEIOUY]/i.test(scientific || '') ? 'd’' : 'de '}${scientific}. Les appellations ci-dessous sont documentées linguistiquement ; leur usage géographique et culinaire reste à préciser.`;
    upsert('products', {
      id,
      slug: entry.slug,
      labelFr: entry.labelFr,
      labelEn: entity.labels?.en || null,
      labelAr: entity.labels?.ar || null,
      description: descriptionFr,
      categoryId: entry.categoryId,
      entityType: scientific ? 'taxon' : decision.entityType || 'ingredient',
      scientificName: scientific,
      taxonId: entity.id,
      sourceIds: [sourceId],
      imageId,
      formTypes: entry.formTypes,
      verifiedAt: date,
      usage: null,
      editorialNote:
        decision.role === 'primary'
          ? `Photographie principale : ${decision.depictedForm}. Elle ne représente pas les autres formes ni une provenance nationale.`
          : 'La photographie montre l’espèce ou la plante ; la forme vendue en boutique reste à documenter.',
      documentaryScope: scientific ? 'organism' : 'preparation',
    });
    added++;
  }
  await writeFile(file, JSON.stringify(catalogue, null, 2) + '\n');
  console.log(`${added} fiches ajoutées ou mises à jour.`);
}

if (mode === 'collect') await collect();
else if (mode === 'apply') await apply();
else console.log('Usage : collect | apply');
