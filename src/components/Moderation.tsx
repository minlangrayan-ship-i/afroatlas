import { withLocale } from '../lib/locale-react';
import { useState, type SyntheticEvent } from 'react';
import { api, backend, configured, publicEntrySchema } from '../lib/community';
type Row = {
  id: string;
  proposal: Record<string, unknown>;
  photo_path: string | null;
  status: string;
  created_at: string;
  review_note: string;
};
const emptyEntry = {
  id: '',
  kind: 'name',
  productId: '',
  labelFr: '',
  labelEn: null,
  labelAr: null,
  categoryId: 'spices',
  form: '',
  name: '',
  language: '',
  country: '',
  region: '',
  description: '',
  sourceUrl: '',
  sourceLicense: '',
  photoUrl: '',
  photoCredit: '',
  photoLicense: '',
};
function Moderation() {
  const [token, setToken] = useState(''),
    [rows, setRows] = useState<Row[]>([]),
    [selected, setSelected] = useState<Row | null>(null),
    [proposal, setProposal] = useState(''),
    [entry, setEntry] = useState(''),
    [notes, setNotes] = useState(''),
    [message, setMessage] = useState(''),
    [photo, setPhoto] = useState(''),
    [busy, setBusy] = useState(false);
  async function load(access: string) {
    setRows(await api('/rest/v1/contributions?select=*&order=created_at.desc', {}, access));
  }
  async function login(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(e.currentTarget);
      const auth = await api('/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const owner = await api(
        '/rest/v1/rpc/is_afroatlas_owner',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
        auth.access_token,
      );
      if (owner !== true) throw new Error('Accès réservé au propriétaire.');
      setToken(auth.access_token);
      await load(auth.access_token);
      setMessage('Connexion propriétaire établie.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function select(row: Row) {
    setSelected(row);
    setProposal(JSON.stringify(row.proposal, null, 2));
    setNotes(row.review_note);
    setEntry(
      JSON.stringify(
        {
          ...emptyEntry,
          id: row.id,
          kind:
            row.proposal.type === 'new-product'
              ? 'product'
              : row.proposal.type === 'photo'
                ? 'photo'
                : row.proposal.type === 'country-region'
                  ? 'region'
                  : row.proposal.type === 'correction'
                    ? 'usage'
                    : 'name',
          productId:
            row.proposal.type === 'new-product'
              ? `community-${row.id}`
              : String(row.proposal.product || ''),
          labelFr: row.proposal.product || '',
          name: row.proposal.name || '',
          country: row.proposal.country || '',
          region: row.proposal.region || '',
          language: row.proposal.language || '',
          form: row.proposal.form || '',
          description: row.proposal.description || '',
          photoLicense: row.proposal.photoRights ? 'CC BY 4.0' : row.proposal.photoLicense || '',
        },
        null,
        2,
      ),
    );
    setPhoto('');
    if (row.photo_path)
      try {
        const signed = await api(
          `/storage/v1/object/sign/afroatlas-pending/${encodeURIComponent(row.photo_path)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiresIn: 300 }),
          },
          token,
        );
        setPhoto(`${backend.url}/storage/v1${signed.signedURL}`);
      } catch (e) {
        setMessage((e as Error).message);
      }
  }
  async function review(decision: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const payload = decision === 'accept' ? publicEntrySchema.parse(JSON.parse(entry)) : null;
      const result = await api(
        '/functions/v1/moderate-contribution',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selected.id,
            decision,
            proposal: JSON.parse(proposal),
            entry: payload,
            notes,
          }),
        },
        token,
      );
      setMessage(`Décision enregistrée : ${result.status}.`);
      setSelected(null);
      await load(token);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="moderation">
      {!configured && (
        <p className="notice">Service non configuré. Aucun accès de modération actif.</p>
      )}
      {!token ? (
        <form onSubmit={login} className="contribution-form">
          <label>
            Email propriétaire
            <input name="email" type="email" dir="ltr" required autoComplete="username" />
          </label>
          <label>
            Mot de passe
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="button" disabled={!configured || busy}>
            Se connecter
          </button>
          <p>
            Accès privé. Aucun mot de passe ni jeton n’est conservé dans le navigateur après
            fermeture de cette page.
          </p>
        </form>
      ) : (
        <>
          <button
            className="button secondary"
            onClick={() => {
              setToken('');
              setSelected(null);
              setRows([]);
              setPhoto('');
            }}
          >
            Se déconnecter
          </button>
          <h2>Propositions reçues</h2>
          <div className="moderation-list">
            {rows.map((row) => (
              <button key={row.id} className="button secondary" onClick={() => select(row)}>
                <bdi>{String(row.proposal.product || row.proposal.name || row.id)}</bdi> ·{' '}
                {row.status} · {row.created_at.slice(0, 10)}
              </button>
            ))}
          </div>
          {selected && (
            <article className="shop-guide">
              <h2>Examiner et modifier</h2>
              {photo && (
                <img className="community-photo" src={photo} alt="Photographie privée à examiner" />
              )}
              <label>
                Proposition (JSON)
                <textarea
                  dir="ltr"
                  rows={14}
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                />
              </label>
              <label>
                Fiche publiée (JSON)
                <textarea
                  dir="ltr"
                  rows={16}
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                />
              </label>
              <p>
                Vérifiez l’identité du produit, la forme photographiée, les appellations, leur
                périmètre, la source et les licences. Renseignez sourceUrl, sourceLicense et les
                crédits avant acceptation. Une correction se publie comme usage, appellation ou
                photo. Un nouveau produit exige une photo validée.
              </p>
              <label>
                Note de modération
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
              <div className="form-actions">
                <button
                  disabled={busy || selected.status !== 'pending'}
                  className="button secondary"
                  onClick={() => review('edit')}
                >
                  Enregistrer les modifications
                </button>
                <button
                  disabled={busy || selected.status !== 'pending'}
                  className="button"
                  onClick={() => review('accept')}
                >
                  Accepter et publier
                </button>
                <button
                  disabled={busy || selected.status !== 'pending'}
                  className="button secondary"
                  onClick={() => review('reject')}
                >
                  Refuser
                </button>
              </div>
            </article>
          )}
        </>
      )}
      <p role="status">{message}</p>
    </div>
  );
}

export default withLocale(Moderation);
