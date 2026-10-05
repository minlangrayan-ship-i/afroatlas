import { withLocale } from '../lib/locale-react';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CardProduct } from '../lib/catalogue';
import { emptyFilters, readFilters, searchProducts, type Filters } from '../lib/search';
import { countries, europeanContexts, categories, languageNames } from '../data/countries';
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
  const geography = useCommunityGeography();
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState<Destination>(emptyDestination);
  const [visible, setVisible] = useState(24);
  const [filters, setFilters] = useState<Filters>(emptyFilters),
    [saved, setSaved] = useState<string[]>([]);
  const reduce = useReducedMotion();
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
  const languages = [
    ...new Set(
      products.flatMap((p) => p.names.map((n) => n.languageCode || n.languageId).filter(Boolean)),
    ),
  ].sort() as string[];
  function change(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
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
  const productParams = destinationParams(destination);
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
        />
        <DestinationPicker
          value={destination}
          onChange={changeDestination}
          names={products.flatMap((p) => p.names)}
        />
      </div>
      <aside className="filters-panel">
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
            {categories.map((c) => (
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
              {countries.map((c) => (
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
              {europeanContexts.map((c) => (
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
            {regions
              .filter((r) => !filters.country || r.countryISO3 === filters.country)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
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
              <option key={lang} value={lang}>
                {languageNames[lang] ||
                  products.flatMap((p) => p.names).find((n) => n.languageId === lang)
                    ?.languageLabel ||
                  lang}
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
            {[...new Set(products.flatMap((p) => p.formTypes))].map((form) => (
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
      </aside>
      <div className="catalog-results">
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
                  : 'Essayez une autre orthographe, un nom scientifique ou retirez un filtre. Un produit proche n’est pas présenté comme équivalent.'}
            </p>
            <button className="button" onClick={() => change(emptyFilters)}>
              Effacer les filtres
            </button>
            <a className="button secondary" href={href(favorites ? 'catalogue/' : 'contribuer/')}>
              {favorites ? 'Explorer la bibliothèque' : 'Proposer une appellation'}
            </a>
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
                <ProductCard product={product} match={match} query={productParams.toString()} />
                {i === 5 && (
                  <aside className="inline-ad" aria-label="Emplacement partenaire">
                    Espace publicitaire · démonstration sans annonce active
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
