import type { NameAssertion, Product } from './schema';
import { languageKey, nameLanguage, commonName } from './presentation';
export type Destination = { country: string; region: string; language: string };
export const emptyDestination: Destination = { country: '', region: '', language: '' };
export function readDestination(search: string): Destination {
  const p = new URLSearchParams(search);
  return {
    country: p.get('destination') || '',
    region: p.get('destinationRegion') || '',
    language: languageKey(p.get('destinationLanguage') || ''),
  };
}
export function destinationParams(value: Destination) {
  const p = new URLSearchParams();
  if (value.country) p.set('destination', value.country);
  if (value.region) p.set('destinationRegion', value.region);
  if (value.language) p.set('destinationLanguage', value.language);
  return p;
}
/** A language label, cultivation or a historical area never establishes present regional usage. */
export function destinationNames(names: NameAssertion[], destination: Destination) {
  if (!destination.country) return [];
  return names.filter(
    (n) =>
      ['documented', 'reviewed'].includes(n.status) &&
      !['input', 'scientific'].includes(n.nameType || '') &&
      n.geographicScope !== 'historical_area' &&
      n.countryIds.includes(destination.country) &&
      (!destination.region || n.regionIds.includes(destination.region)) &&
      (!destination.language || nameLanguage(n) === languageKey(destination.language)),
  );
}
export function commonNames(
  names: NameAssertion[],
  product?: Pick<Product, 'scientificName' | 'labelFr' | 'labelEn'>,
) {
  // With the product, prefer real common names (« okra ») to a Latin label filed as English.
  if (product)
    return (['fr', 'en', 'ar'] as const)
      .map((language) =>
        commonName(
          product,
          names.filter((n) => n.status !== 'candidate' && n.status !== 'rejected'),
          language,
        ),
      )
      .filter((n): n is NameAssertion => !!n);
  const seen = new Set<string>();
  return names
    .filter(
      (n) =>
        ['fr', 'en', 'ar'].includes(n.languageCode || '') &&
        !['input', 'scientific'].includes(n.nameType || '') &&
        n.status !== 'candidate' &&
        n.status !== 'rejected',
    )
    .filter((n) => {
      const key = n.languageCode || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}
