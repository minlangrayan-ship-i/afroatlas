import { withLocale } from '../lib/locale-react';
import { useEffect, useState } from 'react';
import { approvedEntries, type PublicEntry } from '../lib/community';
function CommunityUpdates({ productId }: { productId: string }) {
  const [entries, setEntries] = useState<PublicEntry[]>([]);
  useEffect(() => {
    approvedEntries().then((rows) =>
      setEntries(
        rows.filter((r) => r.productId === productId && ['usage', 'photo'].includes(r.kind)),
      ),
    );
  }, [productId]);
  return entries.length ? (
    <section className="container section">
      <h2>Compléments acceptés</h2>
      {entries.map((e) => (
        <article className="shop-guide" key={e.id}>
          <p data-no-translate dir="auto">
            {e.description}
          </p>
          {e.kind === 'photo' && (
            <>
              <img src={e.photoUrl} alt={`${e.labelFr} — ${e.form}`} className="community-photo" />
              <p data-no-translate>
                {e.photoCredit} · {e.photoLicense} · {e.form}
              </p>
            </>
          )}
          <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
            Source ↗
          </a>{' '}
          · {e.sourceLicense}
        </article>
      ))}
    </section>
  ) : null;
}

export default withLocale(CommunityUpdates);
