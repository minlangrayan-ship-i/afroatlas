import { withLocale } from '../lib/locale-react';
import { useEffect, useState } from 'react';
type Region = { id: string; name: string; boundaryYear: string };
function Regions({
  regions,
  paths,
  entries = [],
}: {
  regions: Region[];
  paths: { id: string; label: string; path: string }[];
  entries?: { regionIds: string[]; label: string; url: string; localContext: string }[];
}) {
  const [ready, setReady] = useState(false),
    [selected, setSelected] = useState('');
  useEffect(() => {
    const update = () => setSelected(new URLSearchParams(location.search).get('region') || '');
    update();
    setReady(true);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  function select(id: string) {
    setSelected(id);
    const params = new URLSearchParams(location.search);
    params.set('region', id);
    history.pushState({}, '', location.pathname + '?' + params);
  }
  const region = regions.find((r) => r.id === selected);
  return (
    <div className="regions-explorer">
      <div className="region-map">
        {paths.length > 0 && (
          <svg viewBox="0 0 600 430" aria-label="Sélectionner une subdivision administrative">
            {paths.map((p) => (
              <path
                key={p.id}
                d={p.path}
                className={selected === p.id ? 'region selected' : 'region'}
                role="button"
                tabIndex={ready ? 0 : -1}
                aria-disabled={!ready}
                aria-label={p.label}
                aria-pressed={selected === p.id}
                onClick={() => select(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(p.id);
                  }
                }}
              >
                <title>{p.label}</title>
              </path>
            ))}
          </svg>
        )}
        <p className="table-note">
          Limites d’après la source citée, sans prise de position sur les territoires contestés. Une
          région administrative n’est pas une zone linguistique.
        </p>
      </div>
      <div>
        <div className="region-list" role="group" aria-label="Liste équivalente des subdivisions">
          {regions.map((r) => (
            <button
              disabled={!ready}
              key={r.id}
              className={r.id === selected ? 'selected' : ''}
              aria-pressed={r.id === selected}
              onClick={() => select(r.id)}
            >
              {r.name}
              <span>↗</span>
            </button>
          ))}
        </div>
        <div className="region-result" aria-live="polite">
          <h3>{region?.name || 'Sélectionnez une subdivision'}</h3>
          {entries.some((e) => e.regionIds.includes(selected)) ? (
            <div>
              {entries
                .filter((e) => e.regionIds.includes(selected))
                .map((e, i) => (
                  <p key={i}>
                    <a href={e.url} data-no-translate dir="auto">
                      {e.label} — {e.localContext} ↗
                    </a>
                  </p>
                ))}
            </div>
          ) : (
            <p>Aucune appellation régionale documentée pour le moment.</p>
          )}
          {region && <small>Limites représentant {region.boundaryYear}.</small>}
        </div>
      </div>
    </div>
  );
}

export default withLocale(Regions);
