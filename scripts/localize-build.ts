// Writes /en/ and /ar/ copies of every generated French page, translated with the same
// hand-written dictionary as the interface (src/lib/i18n.ts). Documentary names, sources and
// texts marked data-no-translate are never translated. Adds hreflang and updates the sitemap.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseHTML } from 'linkedom';
import { translate, type Locale } from '../src/lib/i18n';

const site = new URL(process.env.SITE_URL || 'https://minlangrayan-ship-i.github.io/afroatlas/');
const base = site.pathname.endsWith('/') ? site.pathname : `${site.pathname}/`;
const origin = site.origin;
const locales = ['en', 'ar'] as const;
const ogLocale = { fr: 'fr_FR', en: 'en_US', ar: 'ar_AR' };
// Same exclusions as src/lib/locale-client.ts and src/lib/locale-react.tsx.
const excluded =
  'script,style,[data-no-translate],.scientific,.evidence-locator,.photo-credit,.hero-credit,.geo-credit,.card-names';
const assets = /\.(json|webp|pdf|svg|png|jpg|jpeg|mp4|vtt|xml|txt|css|js)$/i;
const missingLabel = {
  en: { static: 'English name not documented', island: 'Nom anglais non documenté' },
  ar: { static: 'الاسم العربي غير موثق', island: 'Nom arabe non documenté' },
};

async function htmlFiles(path = 'dist'): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = `${path}/${entry.name}`;
    if (entry.isDirectory()) {
      if (path === 'dist' && (locales as readonly string[]).includes(entry.name)) continue;
      files.push(...(await htmlFiles(full)));
    } else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

/** /afroatlas/produits/gombo/ → /afroatlas/en/produits/gombo/ */
function localizePath(pathname: string, locale: Locale) {
  if (!pathname.startsWith(base) || assets.test(pathname)) return pathname;
  const rest = pathname.slice(base.length).replace(/^(en|ar)(\/|$)/, '');
  if (/^(images|assets|data|_astro)\//.test(rest) || rest === 'favicon.svg') return pathname;
  return base + (locale === 'fr' ? '' : `${locale}/`) + rest;
}
function localizeUrl(value: string, locale: Locale) {
  if (!value || value.startsWith('#') || /^(mailto|tel|javascript):/.test(value)) return value;
  const absolute = /^https?:\/\//.test(value);
  const url = new URL(value, origin);
  if (url.origin !== origin) return value;
  url.searchParams.delete('lang');
  url.pathname = localizePath(url.pathname, locale);
  return absolute ? url.href : url.pathname + url.search + url.hash;
}

function translateDocument(document: Document, locale: 'en' | 'ar') {
  const html = document.documentElement;
  html.setAttribute('lang', locale);
  html.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  html.setAttribute('data-built-locale', locale);
  const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
  const texts: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) texts.push(node as Text);
  // The parser splits text at entities (« Légumes &amp; feuilles »); browsers keep one node.
  for (const text of texts) {
    while (text.parentNode && text.nextSibling?.nodeType === 3) {
      const next = text.nextSibling as Text;
      text.data += next.data;
      next.remove();
    }
  }
  for (const text of texts) {
    if (!text.parentNode) continue;
    const parent = text.parentElement;
    if (!parent || parent.closest(excluded) || !text.data.trim()) continue;
    // Same call as React's localize(): surrounding whitespace is kept by translate().
    const translated = translate(text.data, locale);
    if (translated !== text.data) text.data = translated;
  }
  for (const element of document.querySelectorAll('[data-product-label]')) {
    const island = !!element.closest('astro-island');
    const value = element.getAttribute(`data-${locale}`) || '';
    element.textContent =
      value ||
      (island ? translate(missingLabel[locale].island, locale) : missingLabel[locale].static);
    element.setAttribute('dir', 'auto');
  }
  for (const element of document.querySelectorAll('[placeholder],[aria-label],[title],[label]')) {
    if (element.closest(excluded)) continue;
    for (const name of ['placeholder', 'aria-label', 'title', 'label']) {
      const value = element.getAttribute(name);
      if (value && (name !== 'label' || element.closest('astro-island')))
        element.setAttribute(name, translate(value, locale));
    }
  }
  // Lists sorted by their translated label (sortLabels, sortedRegions, languageOptions) are
  // re-sorted the same way, so React hydrates the markup it would render itself.
  const parents = new Set(
    [...document.querySelectorAll('[data-sort]')].map((element) => element.parentElement!),
  );
  const sortKey = (element: Element) => {
    const walker = document.createTreeWalker(element, 4);
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      if ((node as Text).data.trim()) return translate((node as Text).data, locale);
    return '';
  };
  for (const parent of parents) {
    const children = [...parent.children];
    const sorted = children.filter((child) => child.hasAttribute('data-sort'));
    const slots = sorted.map((child) => children.indexOf(child));
    const ordered = [...sorted].sort((a, b) => sortKey(a).localeCompare(sortKey(b), locale));
    const placeholders = slots.map(() => document.createComment(''));
    slots.forEach((_, i) => sorted[i].replaceWith(placeholders[i]));
    placeholders.forEach((placeholder, i) => placeholder.replaceWith(ordered[i]));
  }
  for (const a of document.querySelectorAll('a[href]'))
    a.setAttribute('href', localizeUrl(a.getAttribute('href')!, locale));
  for (const form of document.querySelectorAll('form[action]'))
    form.setAttribute('action', localizeUrl(form.getAttribute('action')!, locale));
  for (const button of document.querySelectorAll('[data-locale]'))
    button.setAttribute('aria-pressed', String(button.getAttribute('data-locale') === locale));
}

function localizeHead(document: Document, locale: 'en' | 'ar', canonical: string) {
  const meta = (name: string) => document.querySelector(`meta[name="${name}"]`);
  const title = meta(`afroatlas-title-${locale}`)?.getAttribute('content');
  const description = meta(`afroatlas-description-${locale}`)?.getAttribute('content');
  const current = document.querySelector('title')!;
  const [frTitle, brand] = current.textContent!.split(' — ');
  const nextTitle = `${title || translate(frTitle, locale)} — ${brand || 'AfroAtlas'}`;
  current.textContent = nextTitle;
  const frDescription = meta('description')?.getAttribute('content') || '';
  const nextDescription = description || translate(frDescription, locale);
  meta('description')?.setAttribute('content', nextDescription);
  for (const [selector, value] of [
    ['meta[property="og:title"]', nextTitle],
    ['meta[name="twitter:title"]', nextTitle],
    ['meta[property="og:description"]', nextDescription],
    ['meta[name="twitter:description"]', nextDescription],
    ['meta[property="og:url"]', canonical],
    ['meta[property="og:locale"]', ogLocale[locale]],
  ])
    document.querySelector(selector)?.setAttribute('content', value);
  document.querySelector('link[rel=canonical]')?.setAttribute('href', canonical);
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (ld) {
    const data = JSON.parse(ld.textContent!);
    const walk = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(walk);
      if (!value || typeof value !== 'object') return value;
      const out: Record<string, unknown> = {};
      for (const [key, v] of Object.entries(value)) {
        if ((key === 'url' || key === 'item' || key === '@id') && typeof v === 'string') {
          const [path, hash] = v.split('#');
          out[key] = localizeUrl(path, locale) + (hash !== undefined ? `#${hash}` : '');
        } else if (key === 'inLanguage') out[key] = locale;
        else out[key] = walk(v);
      }
      return out;
    };
    ld.textContent = JSON.stringify(walk(data)).replace(/</g, '\\u003c');
  }
}

function cleanHead(document: Document) {
  for (const element of document.querySelectorAll(
    'meta[name^="afroatlas-title-"],meta[name^="afroatlas-description-"]',
  ))
    element.remove();
}
function addAlternates(document: Document, canonicals: Record<Locale, string>) {
  const canonical = document.querySelector('link[rel=canonical]')!;
  for (const [hreflang, url] of [
    ['fr', canonicals.fr],
    ['en', canonicals.en],
    ['ar', canonicals.ar],
    ['x-default', canonicals.fr],
  ]) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', url);
    canonical.after(link);
  }
}

const indexable: Record<Locale, string>[] = [];
let written = 0;
for (const file of await htmlFiles()) {
  const source = await readFile(file, 'utf8');
  const frDoc = parseHTML(source).document;
  if (frDoc.querySelector('meta[name="afroatlas-untranslated"]')) {
    cleanHead(frDoc);
    await writeFile(file, '<!DOCTYPE html>' + frDoc.documentElement.outerHTML);
    continue;
  }
  const frCanonical = frDoc.querySelector('link[rel=canonical]')!.getAttribute('href')!;
  const canonicals = {
    fr: frCanonical,
    en: localizeUrl(frCanonical, 'en'),
    ar: localizeUrl(frCanonical, 'ar'),
  };
  const robots = frDoc.querySelector('meta[name=robots]')?.getAttribute('content') || '';
  const indexed = !robots.startsWith('noindex');
  if (indexed) indexable.push(canonicals);
  for (const locale of locales) {
    const { document } = parseHTML(source);
    translateDocument(document, locale);
    localizeHead(document, locale, canonicals[locale]);
    cleanHead(document);
    if (indexed) addAlternates(document, canonicals);
    const target = file.replace(/^dist\//, `dist/${locale}/`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, '<!DOCTYPE html>' + document.documentElement.outerHTML);
    written++;
  }
  cleanHead(frDoc);
  if (indexed) addAlternates(frDoc, canonicals);
  await writeFile(file, '<!DOCTYPE html>' + frDoc.documentElement.outerHTML);
}

// One sitemap entry per language version, each listing its alternates.
const sitemapFile = 'dist/sitemap-0.xml';
const sitemap = await readFile(sitemapFile, 'utf8');
const lastmod = sitemap.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
const known = new Set(indexable.map((c) => c.fr));
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (listed.some((url) => !known.has(url)) || listed.length !== indexable.length)
  throw new Error('The sitemap and the indexable French pages differ.');
const escape = (value: string) => value.replace(/&/g, '&amp;');
const alternates = (c: Record<Locale, string>) =>
  (['fr', 'en', 'ar'] as const)
    .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${escape(c[l])}"/>`)
    .join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${escape(c.fr)}"/>`;
const entries = indexable.flatMap((c) =>
  (['fr', 'en', 'ar'] as const).map(
    (l) =>
      `<url><loc>${escape(c[l])}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${alternates(c)}</url>`,
  ),
);
await writeFile(
  sitemapFile,
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
    entries.join('') +
    '</urlset>',
);
console.log(
  `Localized ${written} pages (en, ar); sitemap lists ${entries.length} URLs with hreflang.`,
);
