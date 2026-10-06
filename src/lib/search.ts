import Fuse from 'fuse.js';
import type { CardProduct } from './catalogue';
import { countries, europeanContexts, languageNames } from '../data/countries';
import regions from '../data/published/regions.json';
import { languageKey, nameLanguage, contextualNames, regionLabel } from './presentation';
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’‘ʼ`]/g, "'")
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
  const filters = Object.fromEntries(
    Object.keys(emptyFilters).map((key) => [key, params.get(key) || '']),
  ) as Filters;
  filters.language = languageKey(filters.language);
  if (
    filters.region &&
    filters.country &&
    !regions.some((r) => r.id === filters.region && r.countryISO3 === filters.country)
  )
    filters.region = '';
  return filters;
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
          .flatMap((r) => [r.name, regionLabel(r)]),
        ...p.names.flatMap((n) => [
          n.localContext,
          n.languageLabel || '',
          languageNames[n.languageCode || ''] || '',
          n.languageCode || '',
        ]),
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
          contextualNames(p.names, filters.country, filters.region).some(
            (n) => nameLanguage(n) === languageKey(filters.language),
          )) &&
        (!filters.form || p.formTypes.includes(filters.form)) &&
        (!filters.commercial || linkedIds.includes(p.id)),
    )
    .map(({ product, score }) => {
      const matched =
        product.names.find((n) => normalize(n.name) === query) ||
        product.names.find((n) => normalize(n.name).includes(query));
      const exact = product.searchTerms.includes(query);
      const primaryExact = [product.labelFr, product.labelEn || '', product.labelAr || ''].some(
        (t) => normalize(t) === query,
      );
      const prefix = query && product.searchTerms.some((t) => t.startsWith(query));
      return {
        product,
        score: primaryExact ? -4 : exact ? -3 : prefix ? -2 : score,
        matchType: primaryExact ? 'exact' : exact ? 'alias' : prefix ? 'prefix' : 'approximate',
        match: query
          ? matched
            ? matched.nameType === 'input'
              ? `Variante de saisie « ${matched.name} » ; nom traditionnel non attesté`
              : `Trouvé grâce à l’appellation « ${matched.name} »`
            : normalize(product.scientificName || '').includes(query)
              ? 'Trouvé grâce au nom scientifique'
              : exact
                ? 'Trouvé grâce au contexte géographique ou à la langue documentée'
                : 'Nom approchant ; confirmez l’identité sur la fiche'
          : '',
      };
    })
    .sort((a, b) => a.score - b.score || a.product.labelFr.localeCompare(b.product.labelFr, 'fr'));
}
