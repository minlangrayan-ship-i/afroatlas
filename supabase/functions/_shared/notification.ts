import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';
type Config = { key: string; from: string; recipient: string };
export function notificationConfig(): Config | null {
  const key = Deno.env.get('RESEND_API_KEY'),
    from = Deno.env.get('CONTRIBUTIONS_FROM_EMAIL'),
    recipient = Deno.env.get('CONTRIBUTIONS_RECIPIENT_EMAIL');
  if (
    !key ||
    !from ||
    !recipient ||
    /[\r\n]/.test(from + recipient) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)
  )
    return null;
  return { key, from, recipient };
}
export function emailPayload(
  job: { contribution_id: string; proposal_snapshot: Record<string, unknown>; received_at: string },
  config: Config,
) {
  const p = job.proposal_snapshot;
  const lines = [
    `Contribution AfroAtlas : ${job.contribution_id}`,
    `Reçue le : ${job.received_at}`,
    ...[
      ['Type', 'type'],
      ['Produit', 'product'],
      ['Identifiant produit', 'productId'],
      ['Appellation', 'name'],
      ['Pays', 'country'],
      ['Nouveau pays proposé', 'countryName'],
      ['Région', 'region'],
      ['Langue', 'language'],
      ['Forme', 'form'],
      ['Précision', 'description'],
      ['Source', 'source'],
      ['Pseudonyme (privé)', 'contributorName'],
      ['E-mail de suivi (privé)', 'contributorEmail'],
      ['Source photo', 'photoSource'],
      ['Licence photo', 'photoLicense'],
    ].map(([label, key]) => `${label} : ${String(p[key] || 'Non précisé')}`),
    'La proposition reste privée et non publiée.',
    'Examiner la proposition et sa photographie privée (connexion propriétaire requise) : https://minlangrayan-ship-i.github.io/afroatlas/moderation/',
    p.productId
      ? `Fiche associée : https://minlangrayan-ship-i.github.io/afroatlas/${p.productSlug ? `produits/${encodeURIComponent(String(p.productSlug))}/` : `catalogue/?q=${encodeURIComponent(String(p.product || ''))}`}`
      : '',
  ];
  const reply = String(p.contributorEmail || '');
  if (/[\r\n]/.test(reply)) throw new Error('Invalid reply-to');
  // Text only: no HTML interpretation, user-controlled headers or automatic recipient.
  return {
    from: config.from,
    to: [config.recipient],
    subject: `AfroAtlas — proposition ${job.contribution_id}`,
    text: lines.join('\n'),
    ...(reply ? { reply_to: reply } : {}),
  };
}
export async function sendEmail(
  payload: Record<string, unknown>,
  id: string,
  config: Config,
  fetcher: typeof fetch = fetch,
) {
  const r = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `afroatlas-contribution/${id}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok || typeof body?.id !== 'string') throw new Error(`provider_${r.status}`);
  return body.id as string;
}
export async function notifyContribution(
  db: SupabaseClient,
  id: string,
  fetcher: typeof fetch = fetch,
) {
  const config = notificationConfig();
  if (!config) return 'pending';
  const claimed = await db.rpc('claim_contribution_notification', { target_id: id });
  if (claimed.error) return 'pending';
  if (!claimed.data) {
    const row = await db
      .from('contribution_notifications')
      .select('state')
      .eq('contribution_id', id)
      .single();
    return row.data?.state || 'pending';
  }
  const job = claimed.data;
  try {
    const payload = job.payload || emailPayload(job, config);
    if (!job.payload) {
      const saved = await db
        .from('contribution_notifications')
        .update({ payload })
        .eq('contribution_id', id);
      if (saved.error) throw new Error('payload_storage');
    }
    const providerId = await sendEmail(payload, id, config, fetcher);
    const saved = await db
      .from('contribution_notifications')
      .update({
        state: 'provider_accepted',
        provider_id: providerId,
        error_code: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('contribution_id', id);
    if (saved.error) return 'pending'; // lease expires; identical persisted payload/key reused.
    return 'provider_accepted';
  } catch {
    const next = new Date(
      Date.now() + Math.min(3600000, 60000 * 2 ** (job.attempts - 1)),
    ).toISOString();
    await db
      .from('contribution_notifications')
      .update({
        state: 'pending',
        next_attempt_at: next,
        locked_at: null,
        error_code: 'provider_unconfirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('contribution_id', id);
    return 'pending';
  }
}
