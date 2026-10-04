import { request, json, plain } from './common.mjs';
const queries = {
  gombo: 'okra pods food',
  gingembre: 'ginger rhizomes',
  curcuma: 'turmeric powder',
  'piment-frutescens': 'Tabasco peppers',
  'piment-chinense': 'Habanero chile fruits',
  coriandre: 'coriander leaves bunch',
  fenugrec: 'fenugreek seeds',
  fenouil: 'fennel seeds',
  'clou-girofle': 'cloves spice dried',
  cardamome: 'green cardamom pods',
  muscade: 'nutmeg spice nuts',
  sesame: 'sesame seeds',
  tamarin: 'tamarind pods',
  ail: 'garlic bulbs cloves',
  oignon: 'onions bulbs',
  aubergine: 'eggplant vegetable fruits',
  'aubergine-africaine': 'Solanum aethiopicum fruits',
  'aubergine-gboma': 'Solanum macrocarpon fruits',
  tomate: 'tomatoes fruit market',
  amarante: 'amaranth leaves vegetable market',
  'oseille-guinee': 'dried hibiscus sabdariffa calyces',
  niebe: 'cowpea seeds beans',
  'patate-douce': 'sweet potato tubers',
  manioc: 'cassava roots market',
  taro: 'taro corms',
  moringa: 'moringa leaves food',
  corchorus: 'molokhia leaves market',
  chou: 'cabbage head',
  carotte: 'carrots roots',
  concombre: 'cucumber fruits',
  'courge-mosquee': 'butternut squash fruits',
  laitue: 'lettuce head',
  epinard: 'spinach leaves bunch',
  'tilapia-nil': 'Oreochromis niloticus fish market',
  'tilapia-mozambique': 'Oreochromis mossambicus fish',
  'sardinelle-ronde': 'Sardinella aurita fish',
  'sardinelle-plate': 'Sardinella maderensis fish',
  'maquereau-atlantique': 'Scomber scombrus fish market',
  'maquereau-espagnol': 'Scomber colias fish',
  'perche-nil': 'Lates niloticus fish market',
  njansang: 'Ricinodendron heudelotii seeds',
  eru: 'Gnetum africanum leaves market',
  soumbala: 'soumbala',
  safran: 'saffron threads',
  baobab: 'baobab leaves food',
  cumin: 'cumin seeds',
  menthe: 'mint leaves bunch',
};
const out = {};
for (const [slug, query] of Object.entries(queries)) {
  const url =
    'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: '5',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '400',
    });
  try {
    const response = await request(url);
    out[slug] = Object.values(response.query?.pages || {})
      .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
      .filter(
        (p) =>
          p.info &&
          /^(CC BY|CC0|Public domain)/i.test(plain(p.info.extmetadata?.LicenseShortName?.value)) &&
          /\.(jpe?g|png)$/i.test(p.title),
      );
    console.log(slug + ': ' + out[slug].map((p) => p.title).join(' | '));
  } catch (e) {
    out[slug] = [];
    console.log(slug + ': ' + e.message);
  }
}
await json('data/research/shop-photo-candidates.json', out);
