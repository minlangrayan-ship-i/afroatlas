import { withLocale } from '../lib/locale-react';
import { useEffect, useState } from 'react';
import type { CardProduct } from '../lib/catalogue';
import { loadList, saveList } from '../lib/storage';
import { href } from '../lib/links';
import { useCommunityCatalogue } from '../lib/community-catalogue';
function Compare({ products: seed }: { products: CardProduct[] }) {
  const products = useCommunityCatalogue(seed);
  const [ids, setIds] = useState<string[]>([]),
    [message, setMessage] = useState('');
  useEffect(() => {
    const query = new URLSearchParams(location.search).get('ids');
    setIds(
      (query ? query.split(',') : loadList('compare'))
        .filter((id) => products.some((p) => p.id === id))
        .slice(0, 3),
    );
  }, [products]);
  function update(values: string[]) {
    const next = [...new Set(values.filter(Boolean))].slice(0, 3);
    setIds(next);
    if (!saveList('compare', next))
      setMessage('La sélection ne peut pas être conservée sur cet appareil.');
    const params = new URLSearchParams();
    const locale = new URLSearchParams(location.search).get('lang');
    if (locale) params.set('lang', locale);
    if (next.length) params.set('ids', next.join(','));
    history.replaceState({}, '', location.pathname + (params.size ? '?' + params : ''));
  }
  const selected = ids.map((id) => products.find((p) => p.id === id)!);
  return (
    <div>
      <div className="compare-selectors">
        {[0, 1, 2].map((i) => (
          <label key={i}>
            Produit {i + 1}
            <select
              value={ids[i] || ''}
              onChange={(e) => {
                const next = [...ids];
                next[i] = e.target.value;
                update(next);
              }}
            >
              <option value="">Choisir une fiche</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={ids.includes(p.id) && ids[i] !== p.id}>
                  {p.labelFr}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="table-note">
        Deux ou trois fiches maximum. Une ressemblance de nom ou de photo ne prouve pas l’identité
        ni la possibilité de substitution.
      </p>
      <p role="status">{message}</p>
      {selected.length ? (
        <>
          <div className="compare-grid">
            {selected.map((p) => (
              <article className="compare-card" key={p.id}>
                {p.image.role === 'primary' ? (
                  <img src={href(p.image.smallPath)} alt={p.image.altFr} width="400" height="300" />
                ) : (
                  <div className="photo-gap">Photo de la forme recherchée à documenter</div>
                )}
                <h2
                  data-product-label
                  data-no-translate
                  data-fr={p.labelFr}
                  data-en={p.labelEn || ''}
                  data-ar={p.labelAr || p.names.find((n) => n.languageCode === 'ar')?.name || ''}
                >
                  {p.labelFr}
                </h2>
                <dl>
                  <dt>Identification scientifique</dt>
                  <dd>{p.scientificName || 'Non établie'}</dd>
                  <dt>Forme documentée</dt>
                  <dd>{p.formTypes.join(', ')}</dd>
                  <dt>Appellations</dt>
                  <dd>
                    {p.names
                      .slice(0, 8)
                      .map((n) => n.name)
                      .join(' · ')}
                  </dd>
                  <dt>Contexte géographique</dt>
                  <dd>
                    {p.names.some((n) => n.countryIds.length)
                      ? 'Voir les preuves sur la fiche'
                      : 'Non établi dans cet instantané'}
                  </dd>
                </dl>
                <a className="button secondary" href={href(`produits/${p.slug}/`)}>
                  Voir la fiche ↗
                </a>
              </article>
            ))}
          </div>
          {selected.length > 1 && (
            <p className="notice">
              {new Set(selected.map((p) => p.scientificName)).size === selected.length
                ? 'Ces fiches identifient des espèces scientifiques différentes. Elles ne sont pas présentées comme des synonymes.'
                : 'Consultez les preuves de chaque fiche pour établir la relation.'}
            </p>
          )}
          <button className="button secondary" onClick={() => update([])}>
            Vider le comparateur
          </button>
        </>
      ) : (
        <div className="empty-state">
          <h2>Choisissez ce que vous souhaitez distinguer.</h2>
          <p>Sélectionnez deux fiches ci-dessus ou ajoutez-les depuis la bibliothèque.</p>
          <a className="button" href={href('catalogue/')}>
            Explorer les produits ↗
          </a>
        </div>
      )}
    </div>
  );
}

export default withLocale(Compare);
