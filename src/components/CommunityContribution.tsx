import { withLocale } from '../lib/locale-react';
import { useClientReady } from '../lib/use-client-ready';
import { useCommunityGeography } from '../lib/community-catalogue';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { countries, europeanContexts } from '../data/countries';
import regions from '../data/published/regions.json';
import { configured, sendContribution, validatePhoto, type Submission } from '../lib/community';
const initial = {
  type: 'new-product' as Submission['type'],
  product: '',
  name: '',
  country: '',
  region: '',
  language: '',
  form: '',
  description: '',
  source: '',
  photoRights: false,
  photoSource: '',
  photoLicense: '',
  consent: false,
};
function CommunityContribution() {
  const ready = useClientReady();
  const geography = useCommunityGeography();
  const [fields, setFields] = useState(initial),
    [otherCountry, setOtherCountry] = useState(''),
    [photo, setPhoto] = useState<File | null>(null),
    [preview, setPreview] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const product = new URLSearchParams(location.search).get('product');
    if (product) setFields((f) => ({ ...f, type: 'correction', product }));
  }, []);
  useEffect(() => {
    if (!photo) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const update = (key: string, value: string | boolean) =>
    setFields((f) => ({ ...f, [key]: value }));
  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await sendContribution(
        {
          ...fields,
          country: fields.country === 'new' ? otherCountry : fields.country,
        } as Submission,
        photo,
      );
      setMessage(
        `Contribution reçue — référence ${result.id}. En attente de validation, non publiée.`,
      );
      setFields(initial);
      setOtherCountry('');
      setPhoto(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Envoi non confirmé. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="contribution-form" onSubmit={submit}>
      {!configured && (
        <p className="notice" role="status">
          Les contributions en ligne ne sont pas encore ouvertes : le stockage sécurisé doit être
          connecté par le propriétaire. Vous pouvez préparer les champs et prévisualiser une photo,
          mais rien n’est envoyé ni enregistré sur le serveur.
        </p>
      )}
      <fieldset disabled={busy || !ready} className="contribution-fields">
        <legend>Votre contribution</legend>
        <label>
          Type de contribution
          <select value={fields.type} onChange={(e) => update('type', e.target.value)}>
            <option value="new-product">Proposer un produit absent</option>
            <option value="local-name">Ajouter une appellation locale</option>
            <option value="country-region">Proposer un pays ou une région</option>
            <option value="correction">Corriger une information</option>
            <option value="photo">Signaler ou remplacer une photographie</option>
          </select>
        </label>
        <label>
          Produit concerné ou nouveau produit
          <input
            dir="auto"
            maxLength={200}
            value={fields.product}
            onChange={(e) => update('product', e.target.value)}
            required={fields.type === 'new-product' || fields.type === 'local-name'}
          />
        </label>
        <label>
          Nom local
          <input
            dir="auto"
            maxLength={200}
            value={fields.name}
            onChange={(e) => update('name', e.target.value)}
            required={fields.type === 'local-name'}
          />
        </label>
        <div className="form-row">
          <label>
            Pays
            <select
              aria-label="Pays"
              value={fields.country}
              onChange={(e) => {
                update('country', e.target.value);
                update('region', '');
              }}
            >
              <option value="">Non établi</option>
              {[...countries, ...europeanContexts].map((c) => (
                <option key={c.ISO3} value={c.ISO3}>
                  {c.nameFr}
                </option>
              ))}
              {geography
                .filter((e) => e.kind === 'country' && !countries.some((c) => c.ISO3 === e.country))
                .map((e) => (
                  <option key={e.id} value={e.country} data-no-translate>
                    {e.labelFr || e.name}
                  </option>
                ))}
              <option value="new">Autre pays à proposer</option>
            </select>
          </label>
          <label>
            Région éventuelle
            <input
              dir="auto"
              list="region-options"
              maxLength={200}
              value={fields.region}
              onChange={(e) => update('region', e.target.value)}
            />
            <datalist id="region-options">
              {regions
                .filter((r) => r.countryISO3 === fields.country)
                .map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              {geography
                .filter((e) => e.kind === 'region' && e.country === fields.country)
                .map((e) => (
                  <option key={e.id} value={e.region} />
                ))}
            </datalist>
          </label>
        </div>
        <label>
          Langue éventuelle
          <input
            dir="auto"
            maxLength={80}
            value={fields.language}
            onChange={(e) => update('language', e.target.value)}
          />
        </label>
        {fields.country === 'new' && (
          <label>
            Pays proposé (si absent)
            <input
              required
              dir="auto"
              maxLength={100}
              value={otherCountry}
              onChange={(e) => setOtherCountry(e.target.value)}
            />
          </label>
        )}
        <label>
          Forme du produit
          <select value={fields.form} onChange={(e) => update('form', e.target.value)}>
            <option value="">À préciser</option>
            {['frais', 'séché', 'graines', 'poudre', 'pâte', 'mélange', 'fermenté', 'autre'].map(
              (f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Description
          <textarea
            dir="auto"
            minLength={10}
            maxLength={3000}
            required
            rows={4}
            value={fields.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>
        <label>
          Source ou explication
          <textarea
            dir="auto"
            minLength={10}
            maxLength={2000}
            required
            rows={3}
            value={fields.source}
            onChange={(e) => update('source', e.target.value)}
          />
          <small>
            Précisez le contexte local, la source, sa licence ou les raisons de la correction. Ne
            transmettez pas de données personnelles.
          </small>
        </label>
        <label>
          Photographie facultative
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              try {
                if (file) {
                  validatePhoto(file);
                  setPhoto(file);
                  setMessage('');
                }
              } catch (err) {
                setPhoto(null);
                e.target.value = '';
                setMessage((err as Error).message);
              }
            }}
          />
          <small>JPEG, PNG ou WebP, 5 Mo maximum. Le fichier reste privé jusqu’à validation.</small>
        </label>
        {preview && (
          <div className="upload-preview">
            <img src={preview} alt="Aperçu de la photographie proposée" />
            <button className="text-link" type="button" onClick={() => setPhoto(null)}>
              Retirer la photographie
            </button>
          </div>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            checked={fields.photoRights}
            onChange={(e) => update('photoRights', e.target.checked)}
          />
          Je suis l’auteur et j’autorise la publication de cette photographie sous CC BY 4.0 avec le
          crédit indiqué dans la description.
        </label>
        <label>
          Source de la photographie
          <input
            type="url"
            dir="ltr"
            value={fields.photoSource}
            onChange={(e) => update('photoSource', e.target.value)}
          />
        </label>
        <label>
          Licence de la photographie
          <select
            value={fields.photoLicense}
            onChange={(e) => update('photoLicense', e.target.value)}
          >
            <option value="">À préciser si je ne suis pas l’auteur</option>
            {['CC BY 4.0', 'CC BY-SA 4.0', 'CC0', 'Public domain'].map((l) => (
              <option key={l} value={l} data-no-translate>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="check-label">
          <input
            required
            type="checkbox"
            checked={fields.consent}
            onChange={(e) => update('consent', e.target.checked)}
          />
          J’accepte que ma proposition soit conservée pour examen et que seules les informations
          acceptées soient publiées avec leurs sources.
        </label>
        <button className="button" type="submit" disabled={!configured || busy}>
          {busy ? 'Envoi en cours…' : 'Envoyer pour validation'}
        </button>
        <p className="action-message" role="status">
          {message}
        </p>
      </fieldset>
    </form>
  );
}

export default withLocale(CommunityContribution);
