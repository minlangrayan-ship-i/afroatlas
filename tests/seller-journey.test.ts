import { describe, it, expect } from 'vitest';
import { cardProducts, catalogue } from '../src/lib/catalogue';
import { emptyFilters, readFilters, searchProducts } from '../src/lib/search';
import { destinationNames } from '../src/lib/destination';
import { commonNames } from '../src/lib/destination';
import {
  languageOptions,
  nameLanguage,
  languageKey,
  compatibleLanguage,
  regionLabel,
  evidenceLabel,
  assertionLabel,
  ambiguousChoices,
} from '../src/lib/presentation';
import regions from '../src/data/published/regions.json';
import { translate } from '../src/lib/i18n';

describe('reliable seller journey', () => {
  it('offers four hibiscus identities and two okra forms without treating the query as an equivalence', () => {
    const accented = searchProducts(cardProducts, { ...emptyFilters, q: 'foléré' }).map(
      (r) => r.product,
    );
    expect(accented.map((p) => p.id)).toEqual(
      searchProducts(cardProducts, { ...emptyFilters, q: 'folere' }).map((r) => r.product.id),
    );
    expect(accented).toHaveLength(4);
    expect(ambiguousChoices(accented)).toBe(true);
    const okra = searchProducts(cardProducts, { ...emptyFilters, q: 'gombo' }).map(
      (r) => r.product,
    );
    expect(okra.map((p) => p.slug).sort()).toEqual(['gombo', 'gombo-poudre']);
    expect(ambiguousChoices(okra)).toBe(true);
    expect(cardProducts.find((p) => p.slug === 'folere-boisson')?.categoryId).toBe('preparations');
  });
  it('does not promote the Senegal drink evidence to a name for the dried calyces', () => {
    const calyces = cardProducts.find((p) => p.slug === 'oseille-guinee')!;
    expect(destinationNames(calyces.names, { country: 'SEN', region: '', language: '' })).toEqual(
      [],
    );
    expect(calyces.contexts.find((c) => c.countryId === 'SEN')?.description).toContain(
      'boisson appelée bissap',
    );
    const common = commonNames(calyces.names);
    expect(new Set(common.map((n) => n.languageCode)).size).toBe(common.length);
    expect(common.some((n) => n.languageCode === 'en')).toBe(true);
  });
  it('deduplicates only explicitly identified languages, preserves old IDs and never guesses language from geography', () => {
    const languages = languageOptions(catalogue.names);
    for (const [id, label] of [
      ['bas', 'Bassa'],
      ['dua', 'Douala'],
      ['ewo', 'Ewondo'],
      ['fan', 'Fang'],
    ]) {
      expect(languages.filter((l) => l.label === label)).toEqual([{ id, label }]);
    }
    expect(languages.find((l) => l.id === 'la')?.label).toBe('Latin');
    expect(languageKey('cm-language-ewondo')).toBe('ewo');
    expect(languageKey('cm-language-bakoko')).toBe('cm-language-bakoko');
    const plant = cardProducts.find((p) => p.slug === 'monodora-plante')!;
    const n = plant.names.find((n) => n.languageId === 'cm-language-ewondo')!;
    expect(nameLanguage(n)).toBe('ewo');
    expect(n.languageId).toBe('cm-language-ewondo');
    expect(languageOptions(plant.names, 'FRA')).toEqual([]);
  });
  it('requires the country, region and language on the same assertion', () => {
    const frenchWithoutCountry = cardProducts.find((p) => p.slug === 'gombo')!;
    const fixture = {
      ...frenchWithoutCountry,
      names: [
        {
          ...frenchWithoutCountry.names.find((n) => n.languageCode === 'fr')!,
          countryIds: [],
          regionIds: [],
        },
        {
          ...frenchWithoutCountry.names[0],
          languageCode: 'ewo',
          countryIds: ['CMR'],
          regionIds: ['r-centre'],
        },
      ],
      contexts: [],
    };
    expect(searchProducts([fixture], { ...emptyFilters, country: 'CMR', language: 'fr' })).toEqual(
      [],
    );
    expect(
      searchProducts([fixture], {
        ...emptyFilters,
        country: 'CMR',
        region: 'r-centre',
        language: 'cm-language-ewondo',
      }),
    ).toHaveLength(1);
    expect(compatibleLanguage('ewo', fixture.names, 'SEN')).toBe('');
  });
  it('sorts translated options and displays French, English and Arabic region labels without changing identifiers', () => {
    for (const locale of ['fr', 'en', 'ar'] as const) {
      const labels = languageOptions(catalogue.names, '', '', locale).map((l) =>
        translate(l.label, locale),
      );
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, locale)));
    }
    const north = regions.find((r) => r.countryISO3 === 'CMR' && r.name === 'Far North')!;
    expect(regionLabel(north)).toBe('Extrême-Nord');
    expect(translate(regionLabel(north), 'en')).toBe('Far North');
    expect(translate(regionLabel(north), 'ar')).toBe('أقصى الشمال');
    expect(north.name).toBe('Far North');
    expect(
      readFilters('?country=SEN&region=' + north.id + '&language=cm-language-ewondo').region,
    ).toBe('');
  });
  it('presents understandable evidence labels while preserving raw provenance and honest editorial status', () => {
    expect(evidenceLabel('aliases.fr[0].value')).toBe('Alias français dans la source');
    expect(evidenceLabel('labels.fr.value')).toBe('Nom français dans la source');
    expect(evidenceLabel('commercial_group')).toBe('Groupe alimentaire');
    expect(evidenceLabel('Uses')).toBe('Usages');
    const imported = catalogue.names.find(
      (n) => n.status === 'documented' && !n.countryIds.length,
    )!;
    expect(assertionLabel(imported)).toBe('Alias linguistique — géographie non établie');
    expect(assertionLabel({ ...imported, status: 'reviewed' })).toBe(
      'Validation éditoriale humaine',
    );
    expect(assertionLabel({ ...imported, nameType: 'scientific' })).toBe(
      'Nom scientifique documenté',
    );
    expect(catalogue.evidence.some((e) => e.locator === 'labels.fr.value')).toBe(true);
  });
});
