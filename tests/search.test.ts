import { describe, it, expect } from 'vitest';
import { cardProducts, catalogue } from '../src/lib/catalogue';
import { normalize, searchProducts, emptyFilters, readFilters } from '../src/lib/search';
import { draftSchema } from '../src/lib/schema';
describe('documented catalogue search', () => {
  it('normalizes accents, case and spaces without identifying unrelated foods', () => {
    expect(normalize('  ÉPINARD  ')).toBe('epinard');
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'EPINARD' })[0].product.slug).toBe(
      'epinard',
    );
  });
  it('prioritizes exact names and finds a moderate typo', () => {
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'gingembre' })[0].product.slug).toBe(
      'gingembre',
    );
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'gingembr' })[0].product.slug).toBe(
      'gingembre',
    );
  });
  it('finds a scientific name and an actual documented alias', () => {
    expect(
      searchProducts(cardProducts, { ...emptyFilters, q: 'Oreochromis niloticus' })[0].product.slug,
    ).toBe('tilapia-nil');
    const alias = catalogue.names.find(
      (n) => n.productId === 'product-gombo' && n.languageCode === 'en',
    )!;
    expect(
      searchProducts(cardProducts, { ...emptyFilters, q: alias.name }).some(
        (r) => r.product.id === alias.productId,
      ),
    ).toBe(true);
  });
  it('keeps multiple piment candidates separate', () => {
    const result = searchProducts(cardProducts, { ...emptyFilters, q: 'piment' });
    expect(
      result.filter((r) => r.product.slug.startsWith('piment-')).length,
    ).toBeGreaterThanOrEqual(2);
    expect(new Set(result.map((r) => r.product.id)).size).toBe(result.length);
  });
  it('does not turn a language into evidence of country or region usage', () => {
    expect(
      searchProducts(cardProducts, { ...emptyFilters, country: 'CMR', language: 'fr' }),
    ).toEqual([]);
    expect(searchProducts(cardProducts, { ...emptyFilters, region: 'unproven-region' })).toEqual(
      [],
    );
  });
  it('combines category and language, preserves URL filters and empties', () => {
    const f = readFilters('?category=fish&language=en&q=tilapia');
    const result = searchProducts(cardProducts, f);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.product.categoryId === 'fish')).toBe(true);
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'zzzzzzzzzzzz' })).toEqual([]);
  });
  it('requires a separately evidenced reference link', () => {
    expect(searchProducts(cardProducts, { ...emptyFilters, commercial: '1' }, [])).toEqual([]);
  });
  it('rejects a contribution without an identifiable URL', () => {
    expect(
      draftSchema.safeParse({
        version: 1,
        proposedFields: {
          product: 'Gombo',
          name: 'name',
          country: 'CMR',
          region: '',
          language: 'fr',
        },
        evidenceUrl: 'not a url',
        comment: '',
        createdAt: new Date().toISOString(),
      }).success,
    ).toBe(false);
  });
});
