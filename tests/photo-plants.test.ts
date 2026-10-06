import { describe, it, expect } from 'vitest';
import { catalogue, cardProducts, imageFor } from '../src/lib/catalogue';
import { countries } from '../src/data/countries';
import { searchProducts, emptyFilters } from '../src/lib/search';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
describe('reviewed photographs and plant enrichment', () => {
  it('provides a real, attributed, reusable, reviewed photograph for every catalogue card', async () => {
    for (const p of cardProducts) {
      const i = p.image;
      expect(i.verificationStatus, p.slug).toBe('visually_checked');
      expect(i.localPath, p.slug).toMatch(/\.webp$/);
      expect(i.creator, p.slug).toBeTruthy();
      expect(i.sourcePageUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(i.licenseId).toMatch(/^(CC BY|CC0|Public domain)/);
      expect(i.licenseId).not.toMatch(/NC|ND/);
      const m = await sharp(await readFile(`public${i.localPath}`)).metadata();
      expect(m.width, p.slug).toBe(i.width);
      expect(m.height, p.slug).toBe(i.height);
      if (i.role === 'primary') expect(p.formTypes, p.slug).toContain(i.depictedForm);
    }
  });
  it('keeps botanical and ingredient complements separate from shop-form evidence', () => {
    const rondelle = cardProducts.find((p) => p.slug === 'rondelle')!;
    expect(rondelle.image.role).toBe('complementary');
    expect(rondelle.image.depictedPart).toContain('feuillage');
    expect(rondelle.formTypes).toEqual(['graines']);
    const kpem = cardProducts.find((p) => p.slug === 'kpem')!;
    expect(kpem.image.role).toBe('complementary');
    expect(kpem.image.depictedProductId).toBe('product-manioc-feuilles');
    expect(kpem.image.depictedPart).toContain('ne représente pas le plat');
    expect(imageFor('product-gombo-poudre').depictedForm).toBe('poudre');
  });
  it('finds Aloe vera and Mbali without fabricating a standalone local name', () => {
    expect(searchProducts(cardProducts, { ...emptyFilters, q: 'aloe vera' })[0].product.slug).toBe(
      'aloe-vera',
    );
    expect(
      searchProducts(cardProducts, { ...emptyFilters, q: 'Mbali', country: 'MLI' })[0].product.slug,
    ).toBe('sene-africain');
    const bm = catalogue.names.filter(
      (n) => n.productId === 'product-sene-africain' && n.languageCode === 'bm',
    );
    expect(bm.map((n) => n.name)).toEqual(
      expect.arrayContaining(['Balibali', "M'bali mbali", 'mba bali']),
    );
    expect(
      bm.every(
        (n) => n.countryIds.length === 1 && n.countryIds[0] === 'MLI' && !n.regionIds.length,
      ),
    ).toBe(true);
    expect(bm.some((n) => n.name === 'Mbali')).toBe(false);
  });
  it('records botanical presence with sources and leaves Zambia unconfirmed', () => {
    const contexts = catalogue.contexts.filter((c) => c.productId === 'product-sene-africain');
    expect(contexts.map((c) => c.countryId).sort()).toEqual(['CMR', 'MLI', 'TCD', 'UGA', 'ZWE']);
    expect(
      contexts.every((c) => c.relationType === 'presence' && !c.regionIds.length && c.sourceId),
    ).toBe(true);
    expect(
      searchProducts(cardProducts, { ...emptyFilters, q: 'Senna italica', country: 'ZMB' }),
    ).toEqual([]);
    expect(new Set(countries.map((c) => c.ISO3)).size).toBe(countries.length);
    expect(countries.map((c) => c.ISO3)).toEqual(
      expect.arrayContaining(['TCD', 'ZWE', 'NER', 'NGA']),
    );
  });
});
