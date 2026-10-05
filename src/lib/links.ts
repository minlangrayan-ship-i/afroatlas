export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (path = '') =>
  /^https:\/\//.test(path)
    ? path
    : `${base}/${path.replace(/^\//, '').replace(/(\?[^#]*)\/$/, '$1')}`;
export function productLink(slug: string, query = '') {
  const url = new URL(href(`produits/${slug}/`), 'https://afroatlas.invalid');
  for (const [key, value] of new URLSearchParams(query)) url.searchParams.set(key, value);
  return url.pathname + url.search + url.hash;
}
