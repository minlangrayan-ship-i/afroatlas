import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const empty = (value) => !value || value === 'sans objet' || value.startsWith('non documenté');
const fields = {
  'ID PRODUIT': 'productId',
  'NOM DE RÉFÉRENCE': 'label',
  'CATÉGORIE(S)': 'categories',
  'IDENTITÉ SCIENTIFIQUE, SI ÉTABLIE': 'scientificName',
  'PARTIE OU FORME CONCERNÉE': 'referent',
  APPELLATION: 'name',
  'VARIANTES ORTHOGRAPHIQUES': 'variants',
  LANGUE: 'language',
  'COMMUNAUTÉ SELON LA SOURCE': 'community',
  PAYS: 'country',
  'RÉGION(S) D’USAGE ATTESTÉ': 'regions',
  'AIRE HISTORIQUE': 'historicalArea',
  'LOCALITÉ OU MARCHÉ': 'locality',
  'PORTÉE GÉOGRAPHIQUE DE LA PREUVE': 'scope',
  'STATUT DE VALIDATION': 'status',
  'SOURCE(S)': 'references',
  'NOTE DE PREUVE': 'note',
  'AMBIGUÏTÉS OU LIMITES': 'limitations',
  DESCRIPTION: 'description',
};
export function parseCameroonText(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const products = [],
    usages = [],
    sources = [],
    presences = [];
  let record,
    source,
    section = '',
    region = '';
  const finish = () => {
    if (record?.name) usages.push(record);
    record = undefined;
  };
  for (const line of lines) {
    const index = line.match(
      /^(p-[\w-]+) \| (.+) \| (organism|edible_part|preparation|commercial_group)$/,
    );
    if (index) products.push({ id: index[1], label: index[2], identity: index[3] });
    if (/^=== /.test(line)) {
      region = line.replace(/^=== | ===$/g, '');
      section = '';
    }
    if (/Présence\/production documentée/.test(line)) section = 'presence';
    const presence = line.match(/^(p-[\w-]+): (src-[\w-]+), (.+)\.$/);
    if (section === 'presence' && presence)
      presences.push({
        productId: presence[1],
        sourceId: presence[2],
        locator: presence[3],
        region,
      });
    const key = line.match(/^(.+?) : (.*)$/);
    if (key && fields[key[1]]) {
      if (key[1] === 'ID PRODUIT') {
        finish();
        record = {};
      }
      if (record) record[fields[key[1]]] = key[2];
    }
    const bibliography = line.match(/^(src-[\w-]+) — (.+)$/);
    if (bibliography) {
      finish();
      source = { id: bibliography[1], title: bibliography[2] };
      sources.push(source);
    }
    const bibliographicField = line.match(
      /^(Auteur\/organisme|Publication|URL|Licence|Limites): (.+)$/,
    );
    if (source && bibliographicField)
      source[
        {
          'Auteur/organisme': 'publisher',
          Publication: 'publication',
          URL: 'url',
          Licence: 'license',
          Limites: 'limitations',
        }[bibliographicField[1]]
      ] = bibliographicField[2];
  }
  finish();
  const unique = new Map();
  for (const usage of usages) {
    const key = JSON.stringify([
      usage.productId,
      usage.name,
      usage.language,
      usage.regions,
      usage.historicalArea,
      usage.locality,
      usage.references,
      usage.scope,
    ]);
    unique.set(key, { ...usage, id: 'cm-text-use-' + hash(key).slice(0, 16) });
  }
  const nameKeys = new Set([...unique.values()].map((u) => JSON.stringify([u.name, u.language])));
  return {
    version: 1,
    importedAt: '2026-10-05',
    provenance:
      'Document fourni par le propriétaire ; statuts du corpus conservés comme tels, sans nouvelle expertise indépendante',
    fileSha256: hash(text),
    counts: {
      products: products.length,
      names: nameKeys.size,
      usages: unique.size,
      sources: sources.length,
      presences: presences.length,
    },
    products,
    usages: [...unique.values()],
    sources,
    presences,
  };
}
export const isUnspecified = empty;
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const corpus = parseCameroonText(await readFile('data/research/cameroon-source.txt', 'utf8'));
  if (corpus.counts.products !== 35 || corpus.counts.usages !== 116 || corpus.counts.sources !== 20)
    throw new Error('Unexpected corpus counts: ' + JSON.stringify(corpus.counts));
  await writeFile('data/research/cameroon-corpus.json', JSON.stringify(corpus, null, 2) + '\n');
  console.log(corpus.counts);
}
