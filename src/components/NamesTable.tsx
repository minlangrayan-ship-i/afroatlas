import { withLocale } from '../lib/locale-react';
import { useEffect, useMemo, useState } from 'react';
import { approvedEntries } from '../lib/community';
import type { NameAssertion } from '../lib/schema';
import { languageNames, countries, europeanContexts } from '../data/countries';
import { useClientReady } from '../lib/use-client-ready';
import regions from '../data/published/regions.json';
type NameRow = NameAssertion & {
  sourceUrl: string;
  locator: string;
  proofs?: { url: string; locator: string }[];
};
function NamesTable({ names: seed }: { names: NameRow[] }) {
  const [names, setNames] = useState(seed);
  useEffect(() => {
    approvedEntries().then((entries) =>
      setNames([
        ...seed,
        ...entries
          .filter((e) => e.kind === 'name' && e.productId === seed[0]?.productId)
          .map((e) => ({
            id: e.id,
            productId: e.productId,
            formId: null,
            name: e.name,
            normalizedName: e.name,
            languageCode: e.language || null,
            countryIds: e.country ? [e.country] : [],
            regionIds: e.region ? [e.region] : [],
            culturalAreaIds: [],
            status: 'reviewed' as const,
            evidenceIds: [e.id],
            sourceUrl: e.sourceUrl,
            locator: e.description,
            localContext: e.region,
          })),
      ]),
    );
  }, [seed]);
  const ready = useClientReady();
  const [language, setLanguage] = useState(''),
    [country, setCountry] = useState(''),
    [all, setAll] = useState(false),
    [message, setMessage] = useState('');
  const list = useMemo(
    () =>
      names.filter(
        (n) =>
          (!language || n.languageCode === language) &&
          (!country || n.countryIds.includes(country)),
      ),
    [names, language, country],
  );
  async function copy(name: string) {
    try {
      await navigator.clipboard.writeText(name);
      setMessage(`« ${name} » copié`);
    } catch {
      setMessage('Copie indisponible : sélectionnez le nom pour le copier.');
    }
  }
  return (
    <div className="names-panel">
      <div className="table-controls">
        <label>
          Langue
          <select disabled={!ready} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">Toutes</option>
            {[...new Set(names.map((n) => n.languageCode))].map((lang) => (
              <option key={lang} value={lang || ''}>
                {languageNames[lang || ''] || lang}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contexte géographique
          <select disabled={!ready} value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Tous / non établi</option>
            {[...countries, ...europeanContexts].map((c) => (
              <option key={c.ISO3} value={c.ISO3}>
                {c.nameFr}
              </option>
            ))}
            {[...new Set(names.flatMap((n) => n.countryIds))]
              .filter((id) => ![...countries, ...europeanContexts].some((c) => c.ISO3 === id))
              .map((id) => (
                <option key={id} value={id} data-no-translate>
                  {id}
                </option>
              ))}
          </select>
        </label>
        <p role="status">{message}</p>
      </div>
      <p className="table-note">
        Documenté = une source identifiable. Vérifié = un examen éditorial enregistré. Ici, les noms
        restent limités au contexte indiqué par leur source ; les alias linguistiques sans contexte
        ne prouvent aucun usage national.
      </p>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Appellations documentées avec langue, pays, région et source
          </caption>
          <thead>
            <tr>
              <th>Appellation</th>
              <th>Langue</th>
              <th>Pays / région</th>
              <th>Preuve & statut</th>
              <th>Copier</th>
            </tr>
          </thead>
          <tbody>
            {(all ? list : list.slice(0, 12)).map((n) => (
              <tr key={n.id}>
                <td>
                  <strong data-no-translate dir="auto" lang={n.languageCode || undefined}>
                    <bdi>{n.name}</bdi>
                  </strong>
                </td>
                <td>{languageNames[n.languageCode || ''] || n.languageCode || 'Non renseignée'}</td>
                <td>
                  {n.countryIds.length
                    ? n.countryIds
                        .map((id) => countries.find((c) => c.ISO3 === id)?.nameFr || id)
                        .join(', ')
                    : 'Contexte non établi'}
                  {n.localContext && (
                    <small data-no-translate dir="auto">
                      {n.localContext}
                    </small>
                  )}
                  <small>
                    {n.regionIds.length
                      ? n.regionIds
                          .map((id) => regions.find((r) => r.id === id)?.name || id)
                          .join(', ')
                      : 'Aucune région documentée'}
                  </small>
                </td>
                <td>
                  <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Source ↗
                  </a>
                  <small>
                    {n.nameType === 'input'
                      ? 'Variante de saisie'
                      : n.status === 'reviewed'
                        ? 'Appellation vérifiée'
                        : 'Appellation documentée'}
                  </small>
                  <small className="evidence-locator">{n.locator}</small>
                  {n.proofs?.slice(1).map((proof, i) => (
                    <small key={i}>
                      <a href={proof.url} target="_blank" rel="noopener noreferrer">
                        Source {i + 2} ↗
                      </a>
                      <span data-no-translate dir="auto">
                        {' '}
                        {proof.locator}
                      </span>
                    </small>
                  ))}
                </td>
                <td>
                  <button
                    disabled={!ready}
                    onClick={() => copy(n.name)}
                    aria-label={`Copier ${n.name}`}
                  >
                    ⧉
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && (
        <p className="empty-note">Aucune appellation documentée pour ce contexte.</p>
      )}
      {list.length > 12 && (
        <button disabled={!ready} className="button secondary" onClick={() => setAll(!all)}>
          {all ? 'Réduire la liste' : `Afficher les ${list.length} appellations`}
        </button>
      )}
    </div>
  );
}

export default withLocale(NamesTable);
