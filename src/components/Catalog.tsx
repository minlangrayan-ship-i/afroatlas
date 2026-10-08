import { withLocale, useLocale } from '../lib/locale-react';
import {
  languageOptions,
  compatibleLanguage,
  regionLabel,
  sortedRegions,
  ambiguousChoices,
  productChoice,
  sortLabels,
} from '../lib/presentation';
import { activeAdvertisement } from '../lib/advertising';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CardProduct } from '../lib/catalogue';
import { emptyFilters, readFilters, searchProducts, type Filters } from '../lib/search';
import { countries, europeanContexts, categories } from '../data/countries';
import { loadList } from '../lib/storage';
import regions from '../data/published/regions.json';
import ProductCard from './ProductCard';
import SearchBox from './SearchBox';
import { href } from '../lib/links';
import { useCommunityCatalogue, useCommunityGeography } from '../lib/community-catalogue';
import DestinationPicker from './DestinationPicker';
import {
  readDestination,
  emptyDestination,
  destinationParams,
  type Destination,
} from '../lib/destination';
import { recordUsage } from '../lib/usage';
function Catalog({
  products: seed,
  favorites = false,
  linkedIds = [],
}: {
  products: CardProduct[];
  favorites?: boolean;
  linkedIds?: string[];
}) {
  const products = useCommunityCatalogue(seed);
  const locale = useLocale();
  const geography = useCommunityGeography();
  const [ready, setReady] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [destination, setDestination] = useState<Destination>(emptyDestination);
  const [visible, setVisible] = useState(24);
  const [filters, setFilters] = useState<Filters>(emptyFilters),
    [saved, setSaved] = useState<string[]>([]);
  const reduce = useReducedMotion();
  useEffect(() => {
    const media = matchMedia('(min-width: 1024px)');
    const update = () => setFiltersOpen(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const update = () => {
      setFilters(readFilters(location.search));
      setDestination(readDestination(location.search));
    };
    const updateSaved = () => setSaved(loadList('favorites'));
    update();
    updateSaved();
    setReady(true);
    window.addEventListener('popstate', update);
    window.addEventListener('afroatlas-storage', updateSaved);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('afroatlas-storage', updateSaved);
    };
  }, []);
  const results = useMemo(
    () =>
      searchProducts(
        favorites ? products.filter((p) => saved.includes(p.id)) : products,
        filters,
        linkedIds,
      ),
    [products, filters, favorites, saved, linkedIds],
  );
  const allNames = products.flatMap((p) => p.names);
  const languages = languageOptions(allNames, filters.country, filters.region, locale);
  const choices = ambiguousChoices(results.map((r) => r.product));
  const advertisement = activeAdvertisement('catalog-after-six');
  function change(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    if ('country' in patch) next.region = '';
    if ('country' in patch || 'region' in patch)
      next.language = compatibleLanguage(next.language, allNames, next.country, next.region);
    const params = new URLSearchParams();
    for (const [key, value] of destinationParams(destination)) params.set(key, value);
    const locale = new URLSearchParams(location.search).get('lang');
    if (locale) params.set('lang', locale);
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    history.pushState({}, '', `${location.pathname}${params.size ? '?' + params : ''}`);
    setFilters(next);
    setVisible(24);
  }
  const active = Object.values(filters).filter(Boolean).length;
  function changeDestination(value: Destination) {
    setDestination(value);
    const url = new URL(location.href);
    for (const key of ['destination', 'destinationRegion', 'destinationLanguage'])
      url.searchParams.delete(key);
    for (const [key, val] of destinationParams(value)) url.searchParams.set(key, val);
    history.replaceState({}, '', url);
    recordUsage('destination_use');
  }
  const productParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) productParams.set(key, value);
  for (const [key, value] of destinationParams(destination)) productParams.set(key, value);
  productParams.set('lang', locale);
  if (filters.q) productParams.set('q', filters.q);
  useEffect(() => {
    if (ready && filters.q) recordUsage(results.length ? 'internal_search' : 'search_empty');
  }, [ready, filters.q, results.length]);
  return (
    <div className="catalog-layout">
      <div className="catalog-search">
        <SearchBox
          key={filters.q}
          products={products}
          initial={filters.q}
          onSearch={(q) => change({ q })}
          context={productParams.toString()}
        />
        <DestinationPicker
          value={destination}
          onChange={changeDestination}
          names={products.flatMap((p) => p.names)}
        />
      </div>
      <details
        className="filters-panel"
        open={filtersOpen}
        onToggle={(e) => setFiltersOpen(e.currentTarget.open)}
      >
        <summary>Filtres avancés</summary>
        <div className="filters-content">
          <div className="filters-heading">
            <h2>Affiner la recherche</h2>
            <button disabled={!ready} onClick={() => change(emptyFilters)}>
              Réinitialiser
            </button>
          </div>
          <label>
            Catégorie
            <select
              disabled={!ready}
              aria-label="Catégorie"
              value={filters.category}
              onChange={(e) => change({ category: e.target.value })}
            >
              <option value="">Toutes les catégories</option>
              {sortLabels(categories, (c) => c.label, locale).map((c) => (
                <option value={c.id} key={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contexte d’appellation
            <select
              disabled={!ready}
              aria-label="Contexte d’appellation"
              value={filters.country}
              onChange={(e) => change({ country: e.target.value, region: '' })}
            >
              <option value="">Tous les contextes</option>
              <optgroup label="Pays africains">
                {sortLabels(countries, (c) => c.nameFr, locale).map((c) => (
                  <option key={c.ISO3} value={c.ISO3}>
                    {c.nameFr}
                  </option>
                ))}
              </optgroup>
              {geography
                .filter((e) => e.kind === 'country' && !countries.some((c) => c.ISO3 === e.country))
                .map((e) => (
                  <option key={e.id} value={e.country} data-no-translate>
                    {e.labelFr || e.name}
                  </option>
                ))}
              <optgroup label="Contextes européens">
                {sortLabels(europeanContexts, (c) => c.nameFr, locale).map((c) => (
                  <option key={c.ISO3} value={c.ISO3}>
                    {c.nameFr}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label>
            Région documentée
            <select
              disabled={!ready}
              aria-label="Région documentée"
              value={filters.region}
              onChange={(e) => change({ region: e.target.value })}
            >
              <option value="">Toutes les régions</option>
              {sortedRegions(
                regions.filter((r) => !filters.country || r.countryISO3 === filters.country),
                locale,
              ).map((r) => (
                <option key={r.id} value={r.id}>
                  {regionLabel(r)}
                </option>
              ))}
              {geography
                .filter(
                  (e) => e.kind === 'region' && (!filters.country || e.country === filters.country),
                )
                .map((e) => (
                  <option key={e.id} value={e.region} data-no-translate>
                    {e.labelFr || e.region}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Langue
            <select
              disabled={!ready}
              aria-label="Langue"
              value={filters.language}
              onChange={(e) => change({ language: e.target.value })}
            >
              <option value="">Toutes les langues</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Forme
            <select
              disabled={!ready}
              aria-label="Forme"
              value={filters.form}
              onChange={(e) => change({ form: e.target.value })}
            >
              <option value="">Toutes les formes</option>
              {sortLabels(
                [...new Set(products.flatMap((p) => p.formTypes))],
                (form) => form,
                locale,
              ).map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              disabled={!ready}
              checked={!!filters.commercial}
              onChange={(e) => change({ commercial: e.target.checked ? '1' : '' })}
            />
            Référence commerciale reliée
          </label>
          <p className="filter-note">
            Un filtre pays retient uniquement les appellations dont le contexte géographique est
            prouvé.
          </p>
          <a className="text-link" href={href('references/')}>
            Rechercher une marque séparément ↗
          </a>
        </div>
      </details>
      <div className="catalog-results">
        {choices && (
          <div className="choice-intro">
            <h2>Quelle forme cherchez-vous ?</h2>
            <p>
              Ces fiches désignent des produits distincts. Choisissez la partie et la forme à
              demander.
            </p>
          </div>
        )}
        <div className="results-heading">
          <p role="status" aria-live="polite">
            <strong>{results.length}</strong> fiche{results.length > 1 ? 's' : ''}{' '}
            {favorites ? 'en favori' : 'documentée' + (results.length > 1 ? 's' : '')}
          </p>
          <span>
            {active} filtre{active > 1 ? 's' : ''} actif{active > 1 ? 's' : ''}
          </span>
        </div>
        {results.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h2>
              {favorites
                ? 'Votre bibliothèque personnelle commence ici.'
                : 'Aucune correspondance documentée.'}
            </h2>
            <p>
              {['muse', 'masso'].includes(filters.q.trim().toLowerCase())
                ? 'Appellation signalée oralement, identification à vérifier. Une recette et la communauté concernée sont nécessaires ; aucune espèce n’est attribuée.'
                : filters.country || filters.region
                  ? 'Aucune appellation régionale ou nationale documentée pour ce contexte dans cet instantané. Les noms linguistiques ne sont pas attribués automatiquement à un pays.'
                  : 'Essayez une autre orthographe ou un nom dans une autre langue. Nous n’affichons pas de produit au hasard : un nom proche n’est pas un équivalent.'}
            </p>
            {!favorites && filters.q.trim() && !filters.country && !filters.region && (
              <p className="empty-missing">
                « <bdi data-no-translate>{filters.q.trim()}</bdi> » n’est pas encore dans la
                bibliothèque. Vous le connaissez ? Proposez-le : chaque proposition est examinée
                avant publication.
              </p>
            )}
            {!favorites && filters.q.trim() && (
              <a
                className="button"
                href={href(`contribuer/?missing=${encodeURIComponent(filters.q.trim())}`)}
              >
                Proposer ce produit
              </a>
            )}
            <button
              className={!favorites && filters.q.trim() ? 'button secondary' : 'button'}
              onClick={() => change(emptyFilters)}
            >
              Effacer la recherche et les filtres
            </button>
            {(favorites || !filters.q.trim()) && (
              <a className="button secondary" href={href(favorites ? 'catalogue/' : 'contribuer/')}>
                {favorites ? 'Explorer la bibliothèque' : 'Proposer une appellation'}
              </a>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {results.slice(0, visible).map(({ product, match }, i) => (
              <motion.div
                key={product.id}
                layout={!reduce}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
              >
                <ProductCard
                  product={product}
                  match={choices ? '' : match}
                  query={productParams.toString()}
                  choice={choices ? productChoice(product) : undefined}
                />
                {i === 5 && advertisement && (
                  <aside className="inline-ad" aria-label="Emplacement partenaire">
                    <span>Publicité</span> ·{' '}
                    <a
                      href={advertisement.targetUrl!}
                      rel="sponsored noopener noreferrer"
                      target="_blank"
                    >
                      {advertisement.sponsorLabel}
                    </a>
                  </aside>
                )}
              </motion.div>
            ))}
          </div>
        )}
        {results.length > visible && (
          <button className="button secondary load-more" onClick={() => setVisible((n) => n + 24)}>
            Afficher davantage de fiches
          </button>
        )}
      </div>
    </div>
  );
}

export default withLocale(Catalog);
