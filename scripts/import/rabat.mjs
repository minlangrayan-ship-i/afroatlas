import { request, plain } from './common.mjs';
const xml = (
  await request('https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6441794/fullTextXML', {
    binary: true,
  })
).toString();
console.log(plain(xml.match(/<permissions>[\s\S]*?<\/permissions>/)?.[0]));
const table =
  xml.match(/<table-wrap[^>]*id="tbl2"[\s\S]*?<\/table-wrap>/)?.[0] ||
  xml.match(/<table-wrap[\s\S]*?Kasbour[\s\S]*?<\/table-wrap>/)?.[0];
console.log(plain(table));
