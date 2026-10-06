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
import {
  languageLabel,
  regionLabel,
  assertionLabel,
  productChoice,
  evidenceLabel,
} from '../lib/presentation';
import { countries, europeanContexts } from '../data/countries';
import regions from '../data/published/regions.json';
import { href } from '../lib/links';
import DestinationPicker from './DestinationPicker';
import { recordUsage } from '../lib/usage';
import { useClientReady } from '../lib/use-client-ready';
function ShopCard({
  product: seed,
  proofs,
  contextProofs = {},
}: {
  product: CardProduct;
  proofs: Record<string, { url: string; locator: string }[]>;
  contextProofs?: Record<string, string>;
}) {
  const seedProducts = useMemo(() => [seed], [seed]);
  const ready = useClientReady();
  const product = useCommunityCatalogue(seedProducts)[0];
  const geography = useCommunityGeography();
  const [destination, setDestination] = useState<Destination>(emptyDestination);
  const [query, setQuery] = useState('');
  const [back, setBack] = useState(href('catalogue/'));
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => {
      setDestination(readDestination(location.search));
      const params = new URLSearchParams(location.search);
      setQuery((params.get('q') || '').slice(0, 200));
      params.delete('id');
      setBack(href('catalogue/') + (params.size ? '?' + params : ''));
    };
    update();
    recordUsage('product_open');
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  function change(next: Destination) {
    setDestination(next);
    const url = new URL(location.href);
    for (const key of ['destination', 'destinationRegion', 'destinationLanguage'])
      url.searchParams.delete(key);
    for (const [key, value] of destinationParams(next)) url.searchParams.set(key, value);
    history.replaceState({}, '', url);
    setBack(href('catalogue/') + url.search);
    recordUsage('destination_use');
  }
  const names = destinationNames(product.names, destination);
  const fallback = commonNames(product.names);
  const unique = (list: typeof names) =>
    list.filter(
      (n, i) =>
        list.findIndex(
          (other) =>
            other.name.toLocaleLowerCase() === n.name.toLocaleLowerCase() &&
            (other.languageCode || other.languageId) === (n.languageCode || n.languageId),
        ) === i,
    );
  const displayed = unique(names.length ? names : fallback).slice(0, 3);
  const context =
    [...countries, ...europeanContexts].find((c) => c.ISO3 === destination.country)?.nameFr ||
    geography.find((e) => e.kind === 'country' && e.country === destination.country)?.labelFr ||
    '';
  const region = regions.find((r) => r.id === destination.region);
  const beverageEvidence =
    product.slug === 'oseille-guinee' && destination.country === 'SEN'
      ? product.contexts.find((c) => c.countryId === 'SEN')
      : undefined;
  const card = (compact = false) => (
    <div className={`seller-card ${compact ? 'seller-card-full' : 'seller-result'}`}>
      {compact &&
        (product.image.role === 'primary' ? (
          <img
            src={href(product.image.localPath)}
            width={product.image.width}
            height={product.image.height}
            alt={product.image.altFr}
          />
        ) : (
          <div className="photo-gap">Photo de la forme recherchée à documenter</div>
        ))}
      <div>
        {compact && (
          <h3
            data-product-label
            data-fr={product.labelFr}
            data-en={product.labelEn || ''}
            data-ar={
              product.labelAr || product.names.find((n) => n.languageCode === 'ar')?.name || ''
            }
          >
            {product.labelFr}
          </h3>
        )}
        {query && (
          <p>
            <span>Nom recherché</span> : <bdi data-no-translate>{query}</bdi>
          </p>
        )}
        <p className="seller-form">
          <span>Partie et forme recherchées</span> : <strong>{productChoice(product).title}</strong>
        </p>
        {![
          'oseille-guinee',
          'bissap-feuilles',
          'folere-boisson',
          'hibiscus-plante',
          'gombo',
          'gombo-poudre',
        ].includes(product.slug) && (
          <p>
            <span>Forme de la fiche</span> : {product.formTypes.join(', ')}
            {product.consumedPart && (
              <>
                {' '}
                · <span>Partie consommée</span> : <bdi>{evidenceLabel(product.consumedPart)}</bdi>
              </>
            )}
          </p>
        )}
        {context && (
          <p>
            <span>Destination</span> : {context}
            {region && <> · {regionLabel(region)}</>}
          </p>
        )}
        <h4>
          {destination.country && names.length
            ? 'Appellations attestées pour cette destination'
            : 'Noms courants documentés'}
        </h4>
        {destination.country && !names.length && (
          <p className="notice">
            Aucune appellation locale sourcée pour cette sélection. Montrez la photo et précisez la
            partie et la forme. Les noms courants ne prouvent pas un usage dans cette destination.
          </p>
        )}
        {beverageEvidence && (
          <p className="form-clarification">
            <strong>Au Sénégal, « bissap » est documenté ici pour la boisson.</strong> La source
            décrit des calices rouges séchés utilisés pour la préparer ; elle n’établit pas leur nom
            de vente.
            {!compact && (
              <>
                {' '}
                <a
                  href={contextProofs[beverageEvidence.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source ↗
                </a>
              </>
            )}
          </p>
        )}
        <ul className="seller-names">
          {displayed.map((n) => (
            <li key={n.id}>
              <strong data-no-translate dir="auto" lang={n.languageCode || undefined}>
                {n.name}
              </strong>
              <span>{languageLabel(n.languageCode || n.languageId || '', product.names)}</span>
              {!compact && (
                <small>
                  {assertionLabel(n)} ·{' '}
                  {(proofs[n.id] || (n.sourceUrl ? [{ url: n.sourceUrl, locator: '' }] : []))
                    .slice(0, 1)
                    .map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
                        Source ↗
                      </a>
                    ))}
                </small>
              )}
            </li>
          ))}
        </ul>
        {!displayed.length && (
          <p>Aucun nom courant documenté dans les trois langues principales.</p>
        )}
        {compact && (
          <p className="seller-request">
            <span>Je cherche ce produit, dans cette forme.</span>{' '}
            <strong>{productChoice(product).title}</strong>
          </p>
        )}
        {!compact && unique(names.length ? names : fallback).length > 3 && (
          <a
            href="#appellations"
            onClick={() => {
              const details = document.querySelector<HTMLDetailsElement>('#appellations');
              if (details) details.open = true;
            }}
          >
            Consulter toutes les appellations détaillées ↓
          </a>
        )}
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
      <div className="shop-heading">
        <h2>Le nom à demander au vendeur</h2>
        <a className="text-link" href={back}>
          Retour aux résultats ↗
        </a>
      </div>
      <DestinationPicker value={destination} onChange={change} names={product.names} />
      <div aria-live="polite">{card()}</div>
      <button
        ref={opener}
        className="button"
        disabled={!ready}
        onClick={() => dialog.current?.showModal()}
      >
        Montrer au vendeur ↗
      </button>
      <dialog
        className="seller-dialog"
        aria-label="Présentation à montrer au vendeur"
        ref={dialog}
        onClose={() => opener.current?.focus()}
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
