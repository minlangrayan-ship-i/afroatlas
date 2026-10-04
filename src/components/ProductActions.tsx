import { withLocale } from '../lib/locale-react';
import { useEffect, useState } from 'react';
import { loadList, toggleId } from '../lib/storage';
import { href } from '../lib/links';
function ProductActions({ id, share = false }: { id: string; share?: boolean }) {
  const [ready, setReady] = useState(false);
  const [favorite, setFavorite] = useState(false),
    [compared, setCompared] = useState(false),
    [message, setMessage] = useState('');
  useEffect(() => {
    const update = () => {
      setFavorite(loadList('favorites').includes(id));
      setCompared(loadList('compare').includes(id));
    };
    update();
    setReady(true);
    window.addEventListener('afroatlas-storage', update);
    return () => window.removeEventListener('afroatlas-storage', update);
  }, [id]);
  function toggle(key: string) {
    const result = toggleId(key, id, key === 'compare' ? 3 : 500);
    setMessage(result.message);
    if (key === 'favorites') setFavorite(result.values.includes(id));
    else setCompared(result.values.includes(id));
  }
  async function copy() {
    try {
      if (navigator.share) await navigator.share({ url: location.href, title: document.title });
      else await navigator.clipboard.writeText(location.href);
      setMessage('Lien prêt à partager');
    } catch {
      setMessage('Partage indisponible ; copiez l’adresse dans votre navigateur.');
    }
  }
  return (
    <div className="product-actions">
      <button
        disabled={!ready}
        type="button"
        aria-pressed={favorite}
        onClick={() => toggle('favorites')}
      >
        <span aria-hidden="true">{favorite ? '♥' : '♡'}</span> {favorite ? 'En favori' : 'Favori'}
      </button>
      <button
        disabled={!ready}
        type="button"
        aria-pressed={compared}
        onClick={() => toggle('compare')}
      >
        <span aria-hidden="true">⇄</span> {compared ? 'Sélectionné' : 'Comparer'}
      </button>
      {share && (
        <button disabled={!ready} type="button" onClick={copy}>
          Partager ↗
        </button>
      )}
      {compared && share && <a href={href('comparer/')}>Ouvrir le comparateur →</a>}
      <span className="action-message" role="status">
        {message}
      </span>
    </div>
  );
}

export default withLocale(ProductActions);
