import { useEffect, useState, type SyntheticEvent } from 'react';
import { countries, europeanContexts } from '../data/countries';
import regions from '../data/published/regions.json';
import { localContributionService as service } from '../lib/contribution-service';
import type { ContributionDraft } from '../lib/schema';
const initial = {
  product: '',
  name: '',
  country: '',
  region: '',
  language: '',
  url: '',
  comment: '',
};
export default function Contribution() {
  const [ready, setReady] = useState(false);
  const [fields, setFields] = useState(initial),
    [message, setMessage] = useState('');
  useEffect(() => {
    const draft = service.readDraft();
    if (draft)
      setFields({ ...draft.proposedFields, url: draft.evidenceUrl, comment: draft.comment });
    else {
      const product = new URLSearchParams(location.search).get('product');
      if (product) setFields((f) => ({ ...f, product }));
    }
    setReady(true);
  }, []);
  function draft(): ContributionDraft {
    return {
      version: 1,
      proposedFields: {
        product: fields.product,
        name: fields.name,
        country: fields.country,
        region: fields.region,
        language: fields.language,
      },
      evidenceUrl: fields.url,
      comment: fields.comment,
      createdAt: new Date().toISOString(),
    };
  }
  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    service.exportDraft(draft());
    setMessage(
      'Proposition exportée, non envoyée. Aucun contenu ne devient publié automatiquement.',
    );
  }
  return (
    <form className="contribution-form" onSubmit={submit}>
      <fieldset disabled={!ready} className="contribution-fields">
        <legend className="sr-only">Proposition documentée</legend>
        <div className="notice">
          Sans compte et sans envoi au serveur. Le brouillon reste sur cet appareil ; l’export JSON
          permet de préparer une proposition avec preuve.
        </div>
        <label>
          Produit
          <input
            value={fields.product}
            maxLength={200}
            onChange={(e) => setFields({ ...fields, product: e.target.value })}
            placeholder="Ex. nom principal ou URL de la fiche"
          />
        </label>
        <label>
          Appellation proposée
          <input
            required
            maxLength={200}
            value={fields.name}
            onChange={(e) => setFields({ ...fields, name: e.target.value })}
          />
        </label>
        <div className="form-row">
          <label>
            Pays / contexte
            <select
              value={fields.country}
              onChange={(e) => setFields({ ...fields, country: e.target.value, region: '' })}
            >
              <option value="">Non établi</option>
              {[...countries, ...europeanContexts].map((c) => (
                <option key={c.ISO3} value={c.ISO3}>
                  {c.nameFr}
                </option>
              ))}
            </select>
          </label>
          <label>
            Région éventuelle
            <select
              value={fields.region}
              onChange={(e) => setFields({ ...fields, region: e.target.value })}
            >
              <option value="">Non établie</option>
              {regions
                .filter((r) => r.countryISO3 === fields.country)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label>
          Langue
          <input
            maxLength={50}
            value={fields.language}
            onChange={(e) => setFields({ ...fields, language: e.target.value })}
          />
        </label>
        <label>
          Preuve ou URL de source
          <input
            type="url"
            required
            value={fields.url}
            onChange={(e) => setFields({ ...fields, url: e.target.value })}
            placeholder="https://…"
          />
          <small>
            Ajoutez une source identifiable et sa licence, sans informations personnelles.
          </small>
        </label>
        <label>
          Commentaire
          <textarea
            maxLength={3000}
            rows={5}
            value={fields.comment}
            onChange={(e) => setFields({ ...fields, comment: e.target.value })}
          />
        </label>
        <div className="form-actions">
          <button className="button" type="submit">
            Exporter la proposition JSON ↓
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              try {
                setMessage(
                  service.saveDraft(draft())
                    ? 'Brouillon conservé sur cet appareil, non envoyé.'
                    : 'Brouillon non conservé : stockage indisponible ou champs incomplets.',
                );
              } catch {
                setMessage('Renseignez le nom et une URL valide avant de conserver le brouillon.');
              }
            }}
          >
            Conserver le brouillon
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              try {
                localStorage.removeItem('afroatlas:v1:contribution');
                setFields(initial);
                setMessage('Brouillon effacé.');
              } catch {
                setMessage('Stockage indisponible.');
              }
            }}
          >
            Effacer le brouillon
          </button>
        </div>
        <p className="action-message" role="status">
          {message}
        </p>
      </fieldset>
    </form>
  );
}
