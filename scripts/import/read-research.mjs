import { request, plain } from './common.mjs';
const taxa = [
  'Ricinodendron_heudelotii',
  'Gnetum_africanum',
  'Corchorus_olitorius',
  'Adansonia_digitata',
  'Vernonia_amygdalina',
];
for (const taxon of taxa) {
  try {
    const bytes = await request(`https://plantuse.plantnet.org/en/${taxon}_(PROTA)`, {
      binary: true,
    });
    const html = bytes.toString();
    const start = html.search(/id="(?:Vernacular_names|Noms_vernaculaires)"/);
    const end = html.search(/id="(?:Properties|Propriétés)"/);
    console.log(
      taxon + ': ' + plain(html.slice(start > 0 ? start : 0, end > start ? end : start + 14000)),
    );
  } catch (e) {
    console.log(taxon + ': ' + e.message);
  }
}
