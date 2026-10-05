import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { catalogue, cardProducts } from '../src/lib/catalogue';
import { emptyFilters, searchProducts } from '../src/lib/search';
const corpus = JSON.parse(readFileSync('data/research/cameroon-corpus.json', 'utf8'));
const geography = JSON.parse(readFileSync('src/data/published/geography.json', 'utf8'));
const region = (name: string) =>
  geography.regions.find(
    (r: { name: string; countryISO3: string }) => r.name === name && r.countryISO3 === 'CMR',
  ).id;
const result = (q: string, selected = '') =>
  searchProducts(cardProducts, { ...emptyFilters, q, region: selected });
describe('Cameroon corpus integration', () => {
  it('retains the supplied lexical counts and all usage proofs', () => {
    expect(corpus.counts).toEqual({
      products: 35,
      names: 110,
      usages: 116,
      sources: 20,
      presences: 9,
    });
    expect(
      corpus.usages.every((u: { integration: { targetEvidenceIds: string[] } }) =>
        u.integration.targetEvidenceIds.every((id) => catalogue.evidence.some((e) => e.id === id)),
      ),
    ).toBe(true);
    expect(Object.keys(corpus.integration.mapping)).toHaveLength(35);
  });
  it('maps existing identities without duplicating existing species records', () => {
    expect(corpus.integration.mapping['p-fish-tilapia'].slug).toBe('tilapia-nil');
    expect(corpus.integration.mapping['p-fish-sardinella'].slug).toBe('sardinelle-plate');
    expect(corpus.integration.mapping['p-gnetum-leaves'].slug).toBe('eru');
    expect(corpus.integration.addedProducts).toBe(25);
    expect(corpus.integration.enrichedProducts).toBe(10);
  });
  it('preserves both exact silure identities without guessing a species', () => {
    expect(new Set(result('silure').map((r) => r.product.slug))).toEqual(
      new Set(['silure-clarias', 'silure-heterobranchus']),
    );
  });
  it('finds regional names with strict geographic filtering', () => {
    expect(result('messep', region('Centre')).map((r) => r.product.slug)).toEqual([
      'basilic-tropical',
    ]);
    expect(result('messep', region('South')).map((r) => r.product.slug)).toEqual([
      'basilic-tropical',
    ]);
    expect(result('messep', region('Littoral'))).toEqual([]);
    expect(result('njama njama', region('North-West')).map((r) => r.product.slug)).toEqual([
      'njama-njama',
    ]);
    expect(result('njama njama', region('West')).map((r) => r.product.slug)).toEqual([
      'njama-njama',
    ]);
  });
  it('uses the exact tilapia name supplied by the corpus and does not invent Gabonese usage', () => {
    expect(result('tilapia').map((r) => r.product.slug)).toEqual(['tilapia-nil']);
    expect(
      searchProducts(cardProducts, { ...emptyFilters, q: 'tilapia', country: 'CMR' }),
    ).toHaveLength(1);
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'tilapia', country: 'GAB' })).toEqual(
      [],
    );
  });
  it('keeps plant names, edible parts and preparations independent', () => {
    expect(result('ding').map((r) => r.product.slug)).toEqual(['monodora-plante']);
    expect(result('kpem').map((r) => r.product.slug)).toEqual(['kpem']);
    expect(catalogue.products.find((p) => p.slug === 'kpem')?.entityType).toBe('prepared-dish');
    expect(
      catalogue.names
        .filter((n) => n.productId === 'product-manioc-feuilles')
        .some((n) => n.name === 'Kpem'),
    ).toBe(false);
    expect(catalogue.products.find((p) => p.slug === 'njansang')?.documentaryScope).toBe(
      'edible_part',
    );
  });
  it('separates historical northern Cameroon from current administrative regions', () => {
    const historical = catalogue.names.filter((n) => n.geographicScope === 'historical_area');
    expect(historical.length).toBeGreaterThan(0);
    expect(
      historical.every(
        (n) => n.regionIds.length === 0 && n.culturalAreaIds.includes('cm-historical-north-1954'),
      ),
    ).toBe(true);
    expect(result('Tekku tekkude', region('North'))).toEqual([]);
  });
  it('does not treat presence or cultivation as proof of regional naming', () => {
    const monodora = cardProducts.find((p) => p.slug === 'monodora-plante')!;
    expect(
      monodora.contexts.some(
        (c) => c.relationType === 'presence' && c.regionIds.includes(region('South-West')),
      ),
    ).toBe(true);
    expect(result('ding', region('South-West'))).toEqual([]);
  });
  it('keeps language labels without fabricating language codes or reviewer validation', () => {
    const usage = catalogue.names.find(
      (n) => n.name === 'ding' && n.productId === 'product-monodora-plante',
    )!;
    expect(usage.languageLabel).toBe('Ewondo');
    expect(usage.languageCode).toBeNull();
    expect(usage.languageId).toBe('cm-language-ewondo');
    expect(
      searchProducts(cardProducts, { ...emptyFilters, q: 'ding', language: 'cm-language-ewondo' }),
    ).toHaveLength(1);
    expect(
      catalogue.evidence
        .filter((e) => e.id.startsWith('cm-text-use-'))
        .every((e) => e.checkedBy === null),
    ).toBe(true);
  });
});
