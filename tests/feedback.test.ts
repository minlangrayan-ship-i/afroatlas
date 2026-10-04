import { describe, it, expect } from 'vitest';
import { catalogue, cardProducts, imageFor } from '../src/lib/catalogue';
import { searchProducts, emptyFilters, normalize } from '../src/lib/search';
import { countries } from '../src/data/countries';
const results = (q: string, country = '') =>
  searchProducts(cardProducts, { ...emptyFilters, q, country });
describe('documentary enrichment and uncertain identities', () => {
  it('keeps waterleaf and spinach distinct, including the input variant', () => {
    for (const query of ['waterleaf', 'Wataleaf', 'Talinum triangulare'])
      expect(results(query).map((r) => r.product.slug)).toEqual(['waterleaf']);
    expect(results('Spinacia oleracea').map((r) => r.product.slug)).toEqual(['epinard']);
    expect(catalogue.names.find((n) => n.name === 'Wataleaf')?.nameType).toBe('input');
  });
  it('preserves three folere forms instead of merging them', () => {
    expect(normalize('  FOLÉRÉ—FEUILLES ')).toBe('folere feuilles');
    expect(new Set(results('foléré').map((r) => r.product.slug))).toEqual(
      new Set(['bissap-feuilles', 'oseille-guinee', 'folere-boisson']),
    );
  });
  it('does not guess the species behind unresolved oral names', () => {
    expect(results('muse')).toEqual([]);
    expect(results('masso')).toEqual([]);
  });
  it('does not assign commercial groups to a single species', () => {
    expect(results('managu')[0].product.scientificNames!.length).toBeGreaterThan(1);
    expect(results('terere').map((r) => r.product.slug)).toEqual(['amarantes-feuilles']);
    expect(new Set(results('kunde').map((r) => r.product.slug))).toEqual(
      new Set(['niebe', 'niebe-feuilles']),
    );
  });
  it('adds countries and only documents relevant geographic identities', () => {
    for (const iso of ['GAB', 'GNQ', 'KEN', 'NER', 'NGA'])
      expect(countries.some((c) => c.ISO3 === iso)).toBe(true);
    expect(results('Nkumu', 'GAB').map((r) => r.product.slug)).toEqual(['eru']);
    expect(results('Okok', 'GNQ').map((r) => r.product.slug)).toEqual(['eru']);
    expect(results('ail', 'CMR')).toEqual([]);
  });
  it('matches the corrected primary images to the consumed part and preserves the old file', () => {
    for (const slug of ['epinard', 'pebe']) {
      const photo = imageFor('product-' + slug);
      expect(photo.role).toBe('primary');
      expect(photo.depictedProductId).toBe('product-' + slug);
      expect(photo.visuallyCheckedAt).toBe('2026-10-04');
      expect(photo.licenseUrl).toContain('creativecommons.org');
    }
    expect(catalogue.images.find((i) => i.id === 'shop-photo-epinard')?.role).toBe('complementary');
    expect(imageFor('product-oseille-guinee').depictedPart).toBe('calices');
  });
});
