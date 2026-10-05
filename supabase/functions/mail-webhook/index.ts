import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { verifyMailWebhook } from '../_shared/webhook.ts';
import { boundedText } from '../_shared/body.ts';
Deno.serve(async (req) => {
  const headers = { 'Cache-Control': 'no-store' };
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
  if (req.method !== 'POST' || !secret) return new Response(null, { status: 404, headers });
  try {
    const raw = await boundedText(req, 20000),
      event = verifyMailWebhook(raw, req.headers, secret);
    if (!event.data?.email_id) throw new Error('Invalid event');
    const state =
      event.type === 'email.delivered'
        ? 'delivered'
        : ['email.bounced', 'email.failed', 'email.complained'].includes(event.type)
          ? 'failed'
          : null;
    if (state) {
      const db = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      // Duplicate provider webhooks are idempotent; a stale "sent" never downgrades delivered.
      const saved = await db
        .from('contribution_notifications')
        .update({
          state,
          error_code: state === 'failed' ? event.type : null,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_id', event.data.email_id);
      if (saved.error) return new Response(null, { status: 503, headers });
    }
    return new Response(null, { status: 204, headers });
  } catch {
    return new Response(null, { status: 400, headers });
  }
});
