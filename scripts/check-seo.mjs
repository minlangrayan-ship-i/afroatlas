import { readdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const root = process.env.SITE_URL || 'https://minlangrayan-ship-i.github.io/afroatlas/';
async function htmlFiles(path = 'dist') {
  const files = [];
  for (const d of await readdir(path, { withFileTypes: true })) {
    if (d.isDirectory()) files.push(...(await htmlFiles(path + '/' + d.name)));
    else if (d.name.endsWith('.html')) files.push(path + '/' + d.name);
  }
  return files;
}
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const page = await browser.newPage();
const results = [];
try {
  for (const file of await htmlFiles()) {
    const html = await readFile(file, 'utf8');
    const result = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const graph = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)[
        '@graph'
      ];
      return {
        title: doc.title,
        h1: [...doc.querySelectorAll('h1')].map((n) => n.textContent.trim()),
        description: doc.querySelector('meta[name=description]')?.content,
        canonical: doc.querySelector('link[rel=canonical]')?.href,
        robots: doc.querySelector('meta[name=robots]')?.content,
        ogImage: doc.querySelector('meta[property="og:image"]')?.content,
        beacons: doc.querySelectorAll(
          'script[src="https://static.cloudflareinsights.com/beacon.min.js"]',
        ).length,
        types: graph.map((g) => g['@type']),
        hreflang: doc.querySelectorAll('link[rel=alternate][hreflang]').length,
        lang: doc.documentElement.lang,
        csp: doc.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,
      };
    }, html);
    assert.equal(result.h1.length, 1, file + ' has one H1');
    assert(result.h1[0]);
    assert(result.description?.length > 30);
    assert(result.canonical?.startsWith(root));
    assert(!result.canonical.includes('?'));
    assert(result.ogImage?.startsWith(root));
    assert.equal(result.beacons, 1);
    // Each indexable page lists fr, en, ar and x-default; utility pages list none.
    assert.equal(result.hreflang, result.robots.startsWith('noindex') ? 0 : 4, file + ' hreflang');
    assert(result.types.includes('WebSite'));
    assert(result.csp?.includes('object-src'));
    assert(!result.types.includes('Offer'));
    assert(!result.types.includes('AggregateRating'));
    if (/dist\/produits\//.test(file) && !file.includes('/communaute/'))
      assert(result.types.includes('DefinedTerm'));
    results.push({ file, ...result });
  }
  const indexed = results.filter((r) => !r.robots.startsWith('noindex'));
  assert.equal(
    new Set(indexed.map((r) => r.title)).size,
    indexed.length,
    'Unique indexed page titles',
  );
  assert.equal(
    new Set(indexed.map((r) => r.description)).size,
    indexed.length,
    'Unique indexed page descriptions',
  );
  const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
  const urls = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
    return [...doc.querySelectorAll('loc')].map((n) => n.textContent);
  }, sitemap);
  assert.deepEqual(
    new Set(urls),
    new Set(indexed.map((r) => r.canonical)),
    'Sitemap matches indexable generated content',
  );
  const report = {
    checkedAt: new Date().toISOString().slice(0, 10),
    htmlPages: results.length,
    indexablePages: indexed.length,
    sitemapUrls: urls.length,
    uniqueTitles: true,
    uniqueDescriptions: true,
    oneH1AndBeaconPerPage: true,
    canonicalWithoutParameters: true,
    noFakeCommerceMarkup: true,
    pages: results.map(({ csp, ...r }) => r),
  };
  await writeFile('data/research/seo-verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, pages: undefined }, null, 2));
} finally {
  await browser.close();
}
