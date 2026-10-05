import { useEffect, useMemo, useRef, useState } from 'react';
import { withLocale } from '../lib/locale-react';
import type { CardProduct } from '../lib/catalogue';
import { useCommunityCatalogue, useCommunityGeography } from '../lib/community-catalogue';
import {
  commonNames,
  destinationNames,
  emptyDestination,
  readDestination,
  destinationParams,
  type Destination,
} from '../lib/destination';
import { countries, europeanContexts, languageNames } from '../data/countries';
import regions from '../data/published/regions.json';
import { href } from '../lib/links';
import DestinationPicker from './DestinationPicker';
import { recordUsage } from '../lib/usage';
import { useClientReady } from '../lib/use-client-ready';
function ShopCard({
  product: seed,
  proofs,
}: {
  product: CardProduct;
  proofs: Record<string, { url: string; locator: string }[]>;
}) {
  const seedProducts = useMemo(() => [seed], [seed]);
  const ready = useClientReady();
  const product = useCommunityCatalogue(seedProducts)[0];
  const geography = useCommunityGeography();
  const [destination, setDestination] = useState<Destination>(emptyDestination);
  const [query, setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setDestination(readDestination(location.search));
    setQuery((new URLSearchParams(location.search).get('q') || '').slice(0, 200));
    recordUsage('product_open');
  }, []);
  function change(next: Destination) {
    setDestination(next);
    const url = new URL(location.href);
    for (const key of ['destination', 'destinationRegion', 'destinationLanguage'])
      url.searchParams.delete(key);
    for (const [key, value] of destinationParams(next)) url.searchParams.set(key, value);
    history.replaceState({}, '', url);
    recordUsage('destination_use');
  }
  const names = destinationNames(product.names, destination);
  const fallback = commonNames(product.names);
  const context =
    [...countries, ...europeanContexts].find((c) => c.ISO3 === destination.country)?.nameFr ||
    geography.find((e) => e.kind === 'country' && e.country === destination.country)?.labelFr ||
    destination.country;
  const card = (compact = false) => (
    <div className={`seller-card ${compact ? 'seller-card-full' : ''}`}>
      {product.image.role === 'primary' ? (
        <img
          src={href(product.image.smallPath)}
          width={product.image.width}
          height={product.image.height}
          alt={product.image.altFr}
          loading="lazy"
        />
      ) : (
        <div className="photo-gap">Photo de la forme recherchée à documenter</div>
      )}
      <div>
        <h3 data-no-translate dir="auto">
          {product.labelFr}
        </h3>
        <p className="scientific">{product.scientificName}</p>
        <p>
          <span>Forme de la fiche</span> :{' '}
          <bdi data-no-translate>{product.formTypes.join(', ')}</bdi>
        </p>
        {query && (
          <p>
            <span>Nom recherché</span> : <bdi data-no-translate>{query}</bdi>
          </p>
        )}
        {context && (
          <p>
            <span>Destination</span> : {context}
            {destination.region
              ? ` · ${regions.find((r) => r.id === destination.region)?.name || destination.region}`
              : ''}
          </p>
        )}
        <h4>
          {destination.country
            ? 'Appellations attestées pour cette destination'
            : 'Noms courants documentés'}
        </h4>
        {destination.country && !names.length && (
          <p className="notice">
            Aucune appellation locale vérifiée pour cette sélection. Les noms courants ci-dessous ne
            prouvent pas un usage dans cette destination.
          </p>
        )}
        <ul className="seller-names">
          {(names.length ? names : fallback).map((n) => (
            <li key={n.id}>
              <strong data-no-translate dir="auto" lang={n.languageCode || undefined}>
                {n.name}
              </strong>
              <span>
                {n.languageLabel || languageNames[n.languageCode || ''] || 'Langue non précisée'} ·{' '}
                {n.regionIds.map((id) => regions.find((r) => r.id === id)?.name || id).join(', ') ||
                  n.localContext ||
                  'Contexte non établi'}
              </span>
              {!compact && (
                <small>
                  {n.status === 'reviewed' ? 'Appellation vérifiée' : 'Appellation documentée'} ·{' '}
                  {(
                    proofs[n.id] ||
                    (n.sourceUrl ? [{ url: n.sourceUrl, locator: n.sourceLocator || '' }] : [])
                  ).map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
                      Source ↗ <span className="evidence-locator">{p.locator}</span>
                    </a>
                  ))}
                </small>
              )}
            </li>
          ))}
        </ul>
        {!names.length && !fallback.length && (
          <p>Aucun nom courant documenté dans les trois langues principales.</p>
        )}
        <p className="table-note">Confirmez la partie et la forme recherchées avec le vendeur.</p>
        {compact && product.image.role === 'primary' && (
          <p className="photo-credit">
            {product.image.creator} · {product.image.licenseId}
          </p>
        )}
      </div>
    </div>
  );
  return (
    <section className="container section shop-context" id="demander">
      <h2>Comment demander ce produit ?</h2>
      <DestinationPicker value={destination} onChange={change} names={product.names} />
      <div aria-live="polite">{card()}</div>
      <button
        className="button secondary"
        disabled={!ready}
        onClick={() => dialog.current?.showModal()}
      >
        Montrer au vendeur ↗
      </button>
      <dialog
        className="seller-dialog"
        ref={dialog}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button autoFocus className="dialog-close" onClick={() => dialog.current?.close()}>
          Fermer ×
        </button>
        {card(true)}
      </dialog>
    </section>
  );
}
export default withLocale(ShopCard);
