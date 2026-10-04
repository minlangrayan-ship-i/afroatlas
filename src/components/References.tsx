import { withLocale } from '../lib/locale-react';
import { useState } from 'react';
import type { commercial } from '../lib/catalogue';
import { normalize } from '../lib/search';
type Reference = (typeof commercial.references)[number];
function References({ references }: { references: Reference[] }) {
  const [query, setQuery] = useState('');
  const results = references.filter((r) =>
    normalize(`${r.brand} ${r.tradeName} ${r.barcode}`).includes(normalize(query)),
  );
  return (
    <div>
      <label className="brand-search">
        Rechercher une marque, un produit emballé ou un code-barres
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Une marque ou un code-barres…"
        />
      </label>
      <p role="status">
        {results.length} référence{results.length > 1 ? 's' : ''} documentée
        {results.length > 1 ? 's' : ''}
      </p>
      <div className="reference-grid">
        {results.map((r) => (
          <article className="reference-card" key={r.id}>
            <p className="eyebrow">{r.brand}</p>
            <h2>{r.tradeName}</h2>
            <p className="notice small">{r.label}</p>
            <dl>
              <dt>Code-barres</dt>
              <dd>{r.barcode}</dd>
              <dt>Quantité déclarée</dt>
              <dd>{r.quantity || 'Non renseignée'}</dd>
              <dt>Ingrédients déclarés</dt>
              <dd>{r.ingredientsDeclared || 'Non renseignés'}</dd>
              <dt>Origine déclarée</dt>
              <dd>{r.originClaim || 'Non renseignée'}</dd>
              <dt>Fabrication déclarée</dt>
              <dd>{r.manufacturingPlaceDeclared || 'Non renseignée'}</dd>
              <dt>Pays / marchés de commercialisation déclarés</dt>
              <dd>{r.marketCountryIds.join(', ') || 'Non renseignés'}</dd>
              <dt>Photographie de l’emballage</dt>
              <dd>Non importée dans cet instantané</dd>
              <dt>Lien vérifié avec un ingrédient du catalogue</dt>
              <dd>{r.relations.length ? 'Voir les preuves' : 'Non établi'}</dd>
            </dl>
            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">
              Fiche Open Food Facts ↗
            </a>
            <small>Instantané du {r.retrievedAt} · ODbL</small>
          </article>
        ))}
      </div>
      {!results.length && (
        <p className="empty-state">Aucune référence correspondant à cette recherche.</p>
      )}
    </div>
  );
}

export default withLocale(References);
