import { useEffect, useState } from 'react';
import { withLocale } from '../lib/locale-react';
function UsageConsent() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem('afroatlas:usage-consent') === 'yes');
    } catch {}
  }, []);
  if (import.meta.env.PUBLIC_USAGE_METRICS_ENABLED !== 'true') return null;
  return (
    <div className="usage-consent">
      <p>
        Autoriser des compteurs anonymes d’utilisation, sans enregistrer les mots recherchés ni vos
        contributions.
      </p>
      <button
        className="text-link"
        onClick={() => {
          const next = !enabled;
          try {
            localStorage.setItem('afroatlas:usage-consent', next ? 'yes' : 'no');
            setEnabled(next);
          } catch {}
        }}
      >
        {enabled ? 'Retirer mon accord' : 'Autoriser les compteurs anonymes'}
      </button>
    </div>
  );
}
export default withLocale(UsageConsent);
