import { withLocale } from '../lib/locale-react';
import { useEffect, useState } from 'react';
import { countries } from '../data/countries';
import { approvedEntries, type PublicEntry } from '../lib/community';
import { normalize } from '../lib/search';
import { href } from '../lib/links';
import { translate } from '../lib/i18n';
import { useClientReady } from '../lib/use-client-ready';
function CountrySearch() {
  const ready = useClientReady();
  const [q, setQ] = useState(''),
    [entries, setEntries] = useState<PublicEntry[]>([]);
  useEffect(() => {
    approvedEntries().then((rows) =>
      setEntries(rows.filter((r) => ['country', 'region'].includes(r.kind))),
    );
  }, []);
  return (
    <section className="container section">
      <label>
        Rechercher un pays
        <input
          disabled={!ready}
          type="search"
          dir="auto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {q && (
        <div className="country-strip">
          {countries
            .filter((c) =>
              normalize(
                [
                  c.nameFr,
                  translate(c.nameFr, 'en'),
                  translate(c.nameFr, 'ar'),
                  c.ISO2,
                  c.ISO3,
                ].join(' '),
              ).includes(normalize(q)),
            )
            .map((c) => (
              <a key={c.ISO3} href={href(`pays/${c.ISO3.toLowerCase()}/`)}>
                {c.nameFr} · <bdi>{c.ISO3}</bdi>
              </a>
            ))}
        </div>
      )}
      {entries.length > 0 && (
        <>
          <h2>Pays et régions acceptés</h2>
          <div className="country-strip">
            {entries
              .filter((e) =>
                normalize(e.labelFr + ' ' + e.name + ' ' + e.country + ' ' + e.region).includes(
                  normalize(q),
                ),
              )
              .map((e) => (
                <a
                  key={e.id}
                  href={href(`pays/communaute/?id=${e.id}`)}
                  data-no-translate
                  dir="auto"
                >
                  {e.labelFr || e.name} · {e.country}
                </a>
              ))}
          </div>
        </>
      )}
    </section>
  );
}

export default withLocale(CountrySearch);
