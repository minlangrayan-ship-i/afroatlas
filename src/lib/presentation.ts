import type { NameAssertion, Product } from './schema';
import { languageNames } from '../data/countries';
import { translate, type Locale } from './i18n';

// These imported IDs denote the same languages as their ISO codes. Keep the original assertions.
const languageAliases: Record<string, string> = {
  'cm-language-bassa': 'bas',
  'cm-language-douala': 'dua',
  'cm-language-ewondo': 'ewo',
  'cm-language-fang': 'fan',
  'cm-language-boulou': 'bum',
};
export const languageKey = (id: string) => languageAliases[id] || id;
export const nameLanguage = (name: NameAssertion) =>
  languageKey(name.languageCode || name.languageId || '');
export function sortLabels<T>(items: T[], label: (item: T) => string, locale: Locale) {
  return [...items].sort((a, b) =>
    translate(label(a), locale).localeCompare(translate(label(b), locale), locale),
  );
}
export function languageLabel(id: string, names: NameAssertion[] = []) {
  const key = languageKey(id);
  return (
    languageNames[key] ||
    names.find((n) => nameLanguage(n) === key)?.languageLabel ||
    'Langue non précisée'
  );
}
export function contextualNames(names: NameAssertion[], country = '', region = '') {
  return names.filter(
    (n) =>
      ['documented', 'reviewed'].includes(n.status) &&
      (!country || (n.countryIds.includes(country) && n.geographicScope !== 'historical_area')) &&
      (!region || n.regionIds.includes(region)),
  );
}
export function languageOptions(
  names: NameAssertion[],
  country = '',
  region = '',
  locale: Locale = 'fr',
) {
  return [...new Set(contextualNames(names, country, region).map(nameLanguage).filter(Boolean))]
    .map((id) => ({ id, label: languageLabel(id, names) }))
    .sort((a, b) => translate(a.label, locale).localeCompare(translate(b.label, locale), locale));
}
export function compatibleLanguage(
  language: string,
  names: NameAssertion[],
  country = '',
  region = '',
) {
  return languageOptions(names, country, region).some((l) => l.id === languageKey(language))
    ? languageKey(language)
    : '';
}
const cameroonRegions: Record<string, string> = {
  'Far North': 'Extrême-Nord',
  North: 'Nord',
  'North-West': 'Nord-Ouest',
  East: 'Est',
  South: 'Sud',
  'South-West': 'Sud-Ouest',
  West: 'Ouest',
  Littoral: 'Littoral',
  Centre: 'Centre',
  Adamaoua: 'Adamaoua',
};
export function regionLabel(region: { id: string; name: string; countryISO3?: string }) {
  return region.countryISO3 === 'CMR' || region.id.startsWith('region-CMR-')
    ? cameroonRegions[region.name] || region.name
    : region.name;
}
export function sortedRegions<T extends { id: string; name: string; countryISO3?: string }>(
  regions: T[],
  locale: Locale,
) {
  return [...regions].sort((a, b) =>
    translate(regionLabel(a), locale).localeCompare(translate(regionLabel(b), locale), locale),
  );
}
/** Public labels only. Raw locators remain untouched for provenance and exports. */
export function evidenceLabel(locator: string) {
  return locator
    .replace(
      /aliases\.([a-z]{2,3})\[\d+\]\.value/g,
      (_, language) =>
        `Alias ${languageNames[language]?.toLowerCase() || 'linguistique'} dans la source`,
    )
    .replace(
      /labels\.([a-z]{2,3})\.value/g,
      (_, language) =>
        `Nom ${languageNames[language]?.toLowerCase() || 'linguistique'} dans la source`,
    )
    .replace(/commercial_group/g, 'Groupe alimentaire')
    .replace(/edible_part/g, 'Partie alimentaire')
    .replace(/organism/g, 'Plante ou organisme')
    .replace(/preparation/g, 'Préparation')
    .replace(/Origin and geographic distribution/g, 'Origine et répartition géographique')
    .replace(/Production and international trade/g, 'Production et commerce international')
    .replace(/\bUses\b/g, 'Usages')
    .replace(/Taxonomy(?: \/ accepted species)?/g, 'Identité botanique')
    .replace(/Distribution \/ Native to/g, 'Répartition géographique')
    .replace(/\bCommon names\b/g, 'Noms courants')
    .replace(/Variable Q\w+/g, 'Champ « Bissap-feuille » dans l’enquête')
    .replace(/\b[a-z_]+\.[a-z_]+\[\d+\](?:\.value)?/gi, 'Champ documentaire dans la source');
}
export function assertionLabel(name: NameAssertion) {
  if (name.nameType === 'input') return 'Variante de saisie';
  if (name.status === 'reviewed') return 'Validation éditoriale humaine';
  if (name.nameType === 'scientific') return 'Nom scientifique documenté';
  if (name.countryIds.length)
    return name.geographicScope === 'historical_area'
      ? 'Attestation historique'
      : 'Appellation sourcée dans ce contexte';
  return 'Alias linguistique — géographie non établie';
}
const choices: Record<string, { title: string; description: string }> = {
  'oseille-guinee': {
    title: 'Calices séchés pour infusion',
    description: 'Les calices rouges séchés, à acheter pour préparer une infusion.',
  },
  'bissap-feuilles': {
    title: 'Feuilles alimentaires',
    description: 'Les feuilles destinées à la cuisine, distinctes des calices.',
  },
  'folere-boisson': {
    title: 'Boisson préparée',
    description: 'Une boisson d’hibiscus déjà préparée, distincte des ingrédients secs.',
  },
  'hibiscus-plante': {
    title: 'Plante entière',
    description: 'L’identité botanique de la plante ; aucune partie alimentaire précise.',
  },
  gombo: { title: 'Gombo frais', description: 'Les fruits frais entiers pour la cuisine.' },
  'gombo-poudre': {
    title: 'Gombo en poudre',
    description: 'Des fruits séchés et moulus, distincts du gombo frais.',
  },
};
export const productChoice = (product: Pick<Product, 'slug' | 'labelFr' | 'description'>) =>
  choices[product.slug] || { title: product.labelFr, description: product.description };
export function ambiguousChoices(products: Product[]) {
  return (
    products.length > 1 &&
    (products.every((p) =>
      ['oseille-guinee', 'bissap-feuilles', 'folere-boisson', 'hibiscus-plante'].includes(p.slug),
    ) ||
      products.every((p) => ['gombo', 'gombo-poudre'].includes(p.slug)))
  );
}
/** Imported template sentences describe the method, not the product: keep them in the sources. */
export const isBoilerplate = (description = '') =>
  /^Fiche d’identification de |Les noms de l’espèce et ceux d’un condiment ou d’un plat sont distingués/.test(
    description,
  );
// « Hibiscus esculentus » listed as a French label is a former Latin name, not a common name.
const latinSynonym = (product: Pick<Product, 'scientificName'>, name: string) => {
  const epithet = (product.scientificName || '').split(' ')[1];
  return !!epithet && new RegExp(`^[A-Z][a-z]+ ${epithet}$`).test(name.trim());
};
const plantWords = /\b(plant|tree|plante|arbre)\b/i;
const glanceOrder = ['bm', 'wo', 'yo', 'ha', 'sw', 'am', 'mg', 'local', 'ar', 'en', 'fr', 'pt'];
const known = (n: NameAssertion) =>
  nameLanguage(n) !== 'local-und' && (!!languageNames[nameLanguage(n)] || !!n.languageLabel);
/** A short, readable selection of documented names: varied languages, local contexts first. */
export function glanceNames(
  product: Pick<Product, 'labelFr' | 'scientificName' | 'scientificNames'>,
  names: NameAssertion[],
  limit = 8,
) {
  const hidden = new Set(
    [product.labelFr, product.scientificName || '', ...(product.scientificNames || [])].map(
      normalizeName,
    ),
  );
  const rank = (n: NameAssertion) => {
    const located = n.countryIds.length > 0 || n.regionIds.length > 0;
    if (located && known(n) && !['fr', 'en', 'ar', 'pt'].includes(nameLanguage(n))) return -1;
    const i = glanceOrder.indexOf(known(n) ? nameLanguage(n) : 'local');
    return i < 0 ? glanceOrder.indexOf('local') : i;
  };
  const seen = new Set<string>(),
    perLanguage = new Map<string, number>();
  return [...names]
    .filter((n) => ['documented', 'reviewed'].includes(n.status))
    .filter(
      (n) => n.nameType !== 'input' && n.nameType !== 'scientific' && nameLanguage(n) !== 'la',
    )
    .sort((a, b) => rank(a) - rank(b))
    .filter((n) => {
      const key = normalizeName(n.name),
        language = known(n) ? nameLanguage(n) : 'local',
        count = perLanguage.get(language) || 0;
      if (
        hidden.has(key) ||
        seen.has(key) ||
        count >= 2 ||
        key.split(' ').length > 4 ||
        latinSynonym(product, n.name)
      )
        return false;
      seen.add(key);
      perLanguage.set(language, count + 1);
      return true;
    })
    .slice(0, limit)
    .map((n) => ({
      name: n.name,
      languageCode: n.languageCode,
      language: known(n) ? languageLabel(nameLanguage(n), names) : 'Nom local',
      countryIds: n.countryIds,
    }));
}
const normalizeName = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
/** A common name in the given language, never the Latin binomial or a former Latin name. */
export function commonName(
  product: Pick<Product, 'scientificName'>,
  names: NameAssertion[],
  language: string,
) {
  const latin = (product.scientificName || '').toLowerCase();
  const candidates = names.filter(
    (n) =>
      n.languageCode === language &&
      n.nameType !== 'scientific' &&
      n.nameType !== 'input' &&
      n.name.toLowerCase() !== latin &&
      !latinSynonym(product, n.name),
  );
  // Prefer the name also used in other languages (« okra ») over a rarer synonym.
  const shared = (n: NameAssertion) =>
    names.filter((other) => normalizeName(other.name) === normalizeName(n.name)).length;
  return (
    [...candidates]
      .filter((n) => !plantWords.test(n.name))
      .sort((a, b) => shared(b) - shared(a))[0] || candidates[0]
  );
}
