import Fuse from 'fuse.js';
import type { CardProduct } from './catalogue';
import { countries, europeanContexts } from '../data/countries';
import regions from '../data/published/regions.json';
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[-‐‑–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export type Filters = {
  q: string;
  category: string;
  country: string;
  region: string;
  language: string;
  form: string;
  commercial: string;
};
export const emptyFilters: Filters = {
  q: '',
  category: '',
  country: '',
  region: '',
  language: '',
  form: '',
  commercial: '',
};
export function readFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    Object.keys(emptyFilters).map((key) => [key, params.get(key) || '']),
  ) as Filters;
}
export function searchProducts(
  products: CardProduct[],
  filters: Filters,
  linkedIds: string[] = [],
) {
  const query = normalize(filters.q);
  // Oral feedback is not enough to identify a species; do not replace it with a fuzzy guess.
  if (['muse', 'masso'].includes(query)) return [];
  const index = products.map((p) => ({
    ...p,
    searchTerms:
      // Include new approved names as well as the static catalogue.
      [
        p.labelFr,
        p.labelEn || '',
        p.labelAr || '',
        p.scientificName || '',
        ...(p.scientificNames || []),
        ...p.names.map((n) => n.name),
        ...[...countries, ...europeanContexts]
          .filter(
            (c) =>
              p.names.some((n) => n.countryIds.includes(c.ISO3)) ||
              p.contexts.some((ctx) => ctx.countryId === c.ISO3),
          )
          .flatMap((c) => [c.nameFr, c.ISO2, c.ISO3]),
        ...regions
          .filter(
            (r) =>
              p.names.some((n) => n.regionIds.includes(r.id)) ||
              p.contexts.some((ctx) => ctx.regionIds.includes(r.id)),
          )
          .map((r) => r.name),
        ...p.names.map((n) => n.localContext),
        ...p.contexts.map((c) => c.localContext),
      ].map(normalize),
  }));
  const fuzzy = query
    ? new Fuse(index, {
        keys: ['searchTerms'],
        threshold: 0.32,
        ignoreLocation: true,
        includeScore: true,
        minMatchCharLength: 2,
      })
        .search(query)
        .map((result) => ({ product: result.item, score: result.score || 0 }))
    : index.map((product) => ({ product, score: 0 }));
  const hasLiteralMatch =
    query.length >= 3 &&
    fuzzy.some(({ product }) => product.searchTerms.some((t) => t.includes(query)));
  const hasExactMatch = !!query && fuzzy.some(({ product }) => product.searchTerms.includes(query));
  return fuzzy
    .filter(({ product }) => !hasExactMatch || product.searchTerms.includes(query))
    .filter(({ product }) => !hasLiteralMatch || product.searchTerms.some((t) => t.includes(query)))
    .filter(
      ({ product: p }) =>
        (!filters.category || p.categoryId === filters.category) &&
        (!filters.country ||
          p.names.some((n) => n.countryIds.includes(filters.country)) ||
          p.contexts.some((c) => c.countryId === filters.country)) &&
        (!filters.region ||
          p.names.some((n) => n.regionIds.includes(filters.region)) ||
          p.contexts.some(
            (c) =>
              c.regionIds.includes(filters.region) &&
              !['presence', 'cultivation'].includes(c.relationType || ''),
          )) &&
        (!filters.language ||
          p.names.some((n) => (n.languageCode || n.languageId) === filters.language)) &&
        (!filters.form || p.formTypes.includes(filters.form)) &&
        (!filters.commercial || linkedIds.includes(p.id)),
    )
    .map(({ product, score }) => {
      const matched =
        product.names.find((n) => normalize(n.name) === query) ||
        product.names.find((n) => normalize(n.name).includes(query));
      const exact = product.searchTerms.includes(query);
      return {
        product,
        score: exact ? -1 : score,
        match: query
          ? matched
            ? matched.nameType === 'input'
              ? `Variante de saisie « ${matched.name} » ; nom traditionnel non attesté`
              : `Trouvé grâce à l’appellation « ${matched.name} »`
            : normalize(product.scientificName || '').includes(query)
              ? 'Trouvé grâce au nom scientifique'
              : 'Nom approchant ; confirmez l’identité sur la fiche'
          : '',
      };
    })
    .sort((a, b) => a.score - b.score || a.product.labelFr.localeCompare(b.product.labelFr, 'fr'));
}
