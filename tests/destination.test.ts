import { describe, it, expect } from 'vitest';
import { cardProducts } from '../src/lib/catalogue';
import {
  commonNames,
  destinationNames,
  readDestination,
  destinationParams,
} from '../src/lib/destination';
import { emptyFilters, searchProducts, normalize } from '../src/lib/search';
import regions from '../src/data/published/regions.json';
import { productLink } from '../src/lib/links';
describe('asking an interlocutor for a documented product', () => {
  it('preserves query and destination independently of search filters', () => {
    const dest = { country: 'CMR', region: 'region-id', language: 'ewo' };
    expect(readDestination('?q=eru&country=SEN&' + destinationParams(dest))).toEqual(dest);
  });
  it('keeps published community identifiers when adding query and destination parameters', () => {
    const url = new URL(
      productLink('communaute/?id=accepted-entry', 'q=Okok&destination=CMR'),
      'https://example.test',
    );
    expect(url.pathname).toMatch(/produits\/communaute\/$/);
    expect(url.searchParams.get('id')).toBe('accepted-entry');
    expect(url.searchParams.get('q')).toBe('Okok');
    expect(url.searchParams.get('destination')).toBe('CMR');
  });
  it('keeps strict regional naming and two aliases of a product', () => {
    const p = cardProducts.find((p) => p.slug === 'eru')!;
    const names = destinationNames(p.names, { country: 'CMR', region: '', language: '' });
    expect(new Set(names.map((n) => n.name)).size).toBeGreaterThan(1);
    const north = regions.find((r) => r.countryISO3 === 'CMR' && r.name === 'Adamaoua')!;
    expect(destinationNames(p.names, { country: 'CMR', region: north.id, language: '' })).toEqual(
      [],
    );
  });
  it('does not infer local usage from language, cultivation, input spelling or history', () => {
    const p = cardProducts.find((p) => p.slug === 'gombo')!;
    expect(destinationNames(p.names, { country: 'FRA', region: '', language: 'fr' })).toEqual([]);
    expect(commonNames(p.names).some((n) => n.languageCode === 'fr')).toBe(true);
    const historical = cardProducts.find((p) => p.slug === 'hibiscus-plante')!;
    expect(
      destinationNames(historical.names, { country: 'CMR', region: '', language: '' }).every(
        (n) => n.geographicScope !== 'historical_area',
      ),
    ).toBe(true);
  });
  it('finds language names and normalizes apostrophes without changing source spellings', () => {
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'Ewondo' }).length).toBeGreaterThan(
      0,
    );
    expect(normalize('N’DOLÉ')).toBe(normalize("n'dole"));
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'foléré' }).length).toBeGreaterThan(
      1,
    );
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'masso' })).toEqual([]);
  });
});
