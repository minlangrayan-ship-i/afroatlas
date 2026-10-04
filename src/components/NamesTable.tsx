import { useMemo, useState } from 'react';
import type { NameAssertion } from '../lib/schema';
import { languageNames, countries, europeanContexts } from '../data/countries';
import { useClientReady } from '../lib/use-client-ready';
type NameRow = NameAssertion & { sourceUrl: string; locator: string };
export default function NamesTable({ names }: { names: NameRow[] }) {
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
          </select>
        </label>
        <p role="status">{message}</p>
      </div>
      <p className="table-note">
        Documenté = une source identifiable. Vérifié = un examen éditorial enregistré. Ici, les noms
        ne sont pas encore validés géographiquement.
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
                  <strong>{n.name}</strong>
                </td>
                <td>{languageNames[n.languageCode || ''] || n.languageCode || 'Non renseignée'}</td>
                <td>
                  {n.countryIds.length ? n.countryIds.join(', ') : 'Contexte non établi'}
                  <small>
                    {n.regionIds.length ? n.regionIds.join(', ') : 'Aucune région documentée'}
                  </small>
                </td>
                <td>
                  <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Source ↗
                  </a>
                  <small>
                    {n.status === 'reviewed' ? 'Appellation vérifiée' : 'Appellation documentée'}
                  </small>
                  <small className="evidence-locator">{n.locator}</small>
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
