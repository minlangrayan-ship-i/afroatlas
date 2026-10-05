import { withLocale } from '../lib/locale-react';
import { useClientReady } from '../lib/use-client-ready';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { countries, europeanContexts } from '../data/countries';
import regions from '../data/published/regions.json';
import { configured, sendContribution, validatePhoto, type Submission } from '../lib/community';
import { recordUsage } from '../lib/usage';
type ProductOption = { id: string; slug: string; labelFr: string };
const initial = {
  type: 'local-name' as Submission['type'],
  product: '',
  productId: '',
  productSlug: '',
  name: '',
  country: '',
  countryName: '',
  region: '',
  language: '',
  form: '',
  description: '',
  source: '',
  photoRights: false,
  photoSource: '',
  photoLicense: '',
  contributorName: '',
  contributorEmail: '',
  website: '',
  consent: false,
};
function ContributionForm({ products }: { products: ProductOption[] }) {
  const ready = useClientReady();
  const [fields, setFields] = useState(initial),
    [photo, setPhoto] = useState<File | null>(null),
    [preview, setPreview] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const requestId = useRef<string | null>(null);
  useEffect(() => {
    const slug = new URLSearchParams(location.search).get('product'),
      p = products.find((p) => p.slug === slug || p.id === slug);
    if (p) setFields((f) => ({ ...f, product: p.labelFr, productId: p.id, productSlug: p.slug }));
  }, [products]);
  useEffect(() => {
    requestId.current = null;
  }, [fields, photo]);
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
    requestId.current ||= crypto.randomUUID();
    try {
      const result = await sendContribution(fields as Submission, photo, requestId.current);
      const notice =
        result.notification === 'delivered'
          ? 'Notification livrée au propriétaire.'
          : result.notification === 'provider_accepted'
            ? 'Notification acceptée par le service e-mail ; livraison non confirmée.'
            : ['failed', 'needs_review'].includes(result.notification)
              ? 'Notification non confirmée : examen par le propriétaire nécessaire.'
              : 'Notification au propriétaire en attente.';
      const review =
        result.status === 'pending'
          ? 'En attente de validation, non publiée.'
          : result.status === 'accepted'
            ? 'Cette proposition a déjà été acceptée par le propriétaire.'
            : 'Cette proposition a déjà été refusée par le propriétaire.';
      setMessage(`Contribution reçue — référence ${result.id}. ${review} ${notice}`);
      recordUsage('contribution_received');
      setFields(initial);
      setPhoto(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Envoi non confirmé. Réessayez plus tard.');
    } finally {
      setBusy(false);
    }
  }
  const intention =
    fields.type === 'new-product'
      ? 'new-product'
      : fields.type === 'local-name'
        ? 'local-name'
        : 'correction';
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
        <div
          className="contribution-intentions"
          role="radiogroup"
          aria-label="Type de contribution"
        >
          {[
            ['local-name', 'Ajouter une appellation'],
            ['new-product', 'Proposer un produit'],
            ['correction', 'Corriger une information'],
          ].map(([type, label]) => (
            <label key={type} className={intention === type ? 'selected' : ''}>
              <input
                type="radio"
                name="intention"
                value={type}
                checked={intention === type}
                onChange={() => update('type', type)}
              />
              {label}
            </label>
          ))}
        </div>
        {intention === 'correction' && (
          <label>
            Information à corriger
            <select
              aria-label="Information à corriger"
              value={fields.type}
              onChange={(e) => update('type', e.target.value)}
            >
              <option value="correction">Information sur un produit</option>
              <option value="photo">Photographie incorrecte</option>
              <option value="country-region">Pays ou région à ajouter</option>
            </select>
          </label>
        )}
        <label>
          {fields.type === 'new-product' ? 'Nouveau produit' : 'Produit concerné'}
          <input
            dir="auto"
            list="known-products"
            maxLength={200}
            required={['new-product', 'local-name'].includes(fields.type)}
            value={fields.product}
            onChange={(e) => {
              const p = products.find((p) => p.labelFr === e.target.value);
              setFields((f) => ({
                ...f,
                product: e.target.value,
                productId: p?.id || '',
                productSlug: p?.slug || '',
              }));
            }}
          />
          <datalist id="known-products">
            {products.map((p) => (
              <option key={p.id} value={p.labelFr} />
            ))}
          </datalist>
        </label>
        {fields.productId && (
          <p className="table-note">
            <span>Produit identifié</span> : <bdi data-no-translate>{fields.productId}</bdi>
          </p>
        )}
        {fields.type === 'local-name' && (
          <label>
            Nom local
            <input
              dir="auto"
              maxLength={200}
              required
              value={fields.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </label>
        )}
        <div className="form-row">
          <label>
            Pays
            <select
              aria-label="Pays"
              required={fields.type === 'local-name' || fields.type === 'country-region'}
              value={fields.country}
              onChange={(e) => setFields((f) => ({ ...f, country: e.target.value, region: '' }))}
            >
              <option value="">Non établi</option>
              {[...countries, ...europeanContexts].map((c) => (
                <option key={c.ISO3} value={c.ISO3}>
                  {c.nameFr}
                </option>
              ))}
              <option value="autre">Autre pays à préciser ci-dessous</option>
            </select>
          </label>
          <label>
            Région éventuelle
            <input
              dir="auto"
              maxLength={200}
              list="region-options"
              value={fields.region}
              onChange={(e) => update('region', e.target.value)}
            />
            <datalist id="region-options">
              {regions
                .filter((r) => r.countryISO3 === fields.country)
                .map((r) => (
                  <option key={r.id} value={r.name} />
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
        {fields.country === 'autre' && (
          <label>
            Nom du pays proposé
            <input
              required
              dir="auto"
              maxLength={100}
              value={fields.countryName}
              onChange={(e) => update('countryName', e.target.value)}
            />
          </label>
        )}
        <label>
          Courte précision
          <textarea
            dir="auto"
            rows={2}
            maxLength={3000}
            required={['new-product', 'correction', 'photo', 'country-region'].includes(
              fields.type,
            )}
            minLength={
              ['new-product', 'correction', 'photo'].includes(fields.type) ? 10 : undefined
            }
            value={fields.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>
        <details className="contribution-optional">
          <summary>Ajouter des détails (facultatif)</summary>
          <label>
            Forme du produit
            <select
              aria-label="Forme du produit"
              value={fields.form}
              onChange={(e) => update('form', e.target.value)}
            >
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
            Source ou explication
            <textarea
              dir="auto"
              rows={2}
              maxLength={2000}
              value={fields.source}
              onChange={(e) => update('source', e.target.value)}
            />
            <small>
              Un lien, une recette ou un contexte local nous aide à vérifier votre proposition.
            </small>
          </label>
          <label>
            Prénom ou pseudonyme
            <input
              dir="auto"
              maxLength={100}
              value={fields.contributorName}
              onChange={(e) => update('contributorName', e.target.value)}
            />
          </label>
          <label htmlFor="contributor-email">
            E-mail pour le suivi (facultatif)
            <input
              id="contributor-email"
              aria-describedby="email-privacy"
              type="email"
              dir="ltr"
              maxLength={254}
              value={fields.contributorEmail}
              onChange={(e) => update('contributorEmail', e.target.value)}
            />
          </label>
          <small id="email-privacy">Cette adresse reste privée et ne sera pas publiée.</small>
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
            <small>
              JPEG, PNG ou WebP, 5 Mo maximum. Le fichier reste privé jusqu’à validation.
            </small>
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
            Je suis l’auteur et j’autorise la publication de cette photographie sous CC BY 4.0 avec
            le crédit indiqué dans la description.
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
              aria-label="Licence de la photographie"
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
        </details>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={fields.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </label>
        </div>
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
        <p className="action-message" role="status" aria-live="polite">
          {message}
        </p>
      </fieldset>
    </form>
  );
}
export default withLocale(ContributionForm);
