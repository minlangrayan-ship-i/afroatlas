export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (path = '') =>
  /^https:\/\//.test(path)
    ? path
    : `${base}/${path.replace(/^\//, '').replace(/(\?[^#]*)\/$/, '$1')}`;
export const interfaceLocales = ['fr', 'en', 'ar'] as const;
/** The same page in another interface language: French at the root, /en/ and /ar/ prefixes. */
export function localizedPath(pathname: string, locale: string) {
  const root = `${base}/`;
  if (!pathname.startsWith(root)) return pathname;
  const rest = pathname.slice(root.length).replace(/^(en|ar)(\/|$)/, '');
  return root + (locale === 'en' || locale === 'ar' ? `${locale}/` : '') + rest;
}
/** Interface language the current HTML file was generated in. */
export const builtLocale = () =>
  typeof document === 'undefined' ? 'fr' : document.documentElement.dataset.builtLocale || 'fr';
export function productLink(slug: string, query = '') {
  const url = new URL(href(`produits/${slug}/`), 'https://afroatlas.invalid');
  for (const [key, value] of new URLSearchParams(query)) url.searchParams.set(key, value);
  const locale = url.searchParams.get('lang') || builtLocale();
  url.searchParams.delete('lang');
  return localizedPath(url.pathname, locale) + url.search + url.hash;
}
