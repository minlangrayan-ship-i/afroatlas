import { request, json } from './common.mjs';
const result = {};
for (const [slug, query] of Object.entries({
  njansang: 'akpi',
  njansang2: 'njansang',
  njansang3: 'Ricinodendron',
  corchorus: 'molokhia leaves',
  ndole: 'bitterleaf leaves food',
  amarante: 'Amaranthus cruentus leaves market',
  niebe: 'black eyed peas',
  muscade: 'nutmeg nuts',
  menthe: 'Mentha spicata leaves',
  'oseille-guinee': 'Hibiscus sabdariffa dried',
  chou: 'cabbage vegetable',
  'aubergine-gboma': 'gboma',
  'perche-nil': 'Nile perch fish caught',
})) {
  try {
    const r = await request(
      'https://commons.wikimedia.org/w/api.php?' +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          generator: 'search',
          gsrsearch: query,
          gsrnamespace: '6',
          gsrlimit: '8',
          prop: 'imageinfo',
          iiprop: 'url|extmetadata',
          iiurlwidth: '400',
        }),
    );
    result[slug] = Object.values(r.query?.pages || {}).map((p) => ({
      title: p.title,
      info: p.imageinfo?.[0],
    }));
    console.log(slug + ': ' + result[slug].map((p) => p.title).join(' | '));
  } catch (e) {
    console.log(e.message);
  }
}
await json('data/research/extra-photo-candidates.json', result);
