import { withLocale } from '../lib/locale-react';
import { useEffect, useState } from 'react';
import { approvedEntries, type PublicEntry } from '../lib/community';
import { href } from '../lib/links';
import ProductActions from './ProductActions';
function CommunityDetail() {
  const [entry, setEntry] = useState<PublicEntry | null>(null),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    approvedEntries().then((rows) => {
      setEntry(rows.find((r) => r.id === id) || null);
      setLoaded(true);
    });
  }, []);
  return (
    <section className="container page-body">
      {entry ? (
        <article className="shop-guide">
          <p className="eyebrow">CONTRIBUTION ACCEPTÉE</p>
          <h1 data-no-translate dir="auto">
            {entry.labelFr || entry.name}
          </h1>
          {entry.photoUrl && (
            <img
              className="community-photo"
              src={entry.photoUrl}
              alt={`${entry.labelFr} — ${entry.form}`}
            />
          )}
          <p data-no-translate dir="auto">
            {entry.description}
          </p>
          <dl>
            <dt>Forme du produit</dt>
            <dd data-no-translate dir="auto">
              {entry.form || 'Non renseigné'}
            </dd>
            <dt>Nom local</dt>
            <dd data-no-translate dir="auto">
              {entry.name || 'Non renseigné'}
            </dd>
            <dt>Langue</dt>
            <dd>{entry.language || 'Non renseignée'}</dd>
            <dt>Pays / région</dt>
            <dd data-no-translate dir="auto">
              {entry.country} / {entry.region || 'Non établie'}
            </dd>
          </dl>
          {['product', 'name', 'usage', 'photo'].includes(entry.kind) && (
            <ProductActions id={entry.productId} share />
          )}
          <p>
            <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
              Source ↗
            </a>{' '}
            · {entry.sourceLicense}
          </p>
          {entry.photoUrl && (
            <p data-no-translate>
              {entry.photoCredit} · {entry.photoLicense}
            </p>
          )}
          <a
            className="button secondary"
            href={href(`contribuer/?product=${encodeURIComponent(entry.productId)}`)}
          >
            Contribuer à la bibliothèque
          </a>
        </article>
      ) : (
        <div>
          <h1>Fiche communautaire</h1>
          <p role="status">
            {loaded
              ? 'Cette contribution n’est pas publiée ou le service est indisponible.'
              : 'Chargement…'}
          </p>
          <noscript>
            Le chargement des contributions validées nécessite JavaScript. Le catalogue documentaire
            reste accessible.
          </noscript>
          <a className="text-link" href={href('catalogue/')}>
            Explorer la bibliothèque ↗
          </a>
        </div>
      )}
    </section>
  );
}

export default withLocale(CommunityDetail);
