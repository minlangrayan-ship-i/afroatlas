import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { cors } from '../_shared/validation.ts';
import { boundedJSON } from '../_shared/body.ts';
Deno.serve(async (req) => {
  let headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  try {
    headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers });
    if (req.method !== 'POST' || Deno.env.get('USAGE_METRICS_ENABLED') !== 'true')
      return new Response(null, { status: 404, headers });
    const body = (await boundedJSON(req, 100)) as { event: string };
    if (Object.keys(body).join(',') !== 'event') throw new Error('Unexpected fields');
    const { event } = body;
    if (
      ![
        'internal_search',
        'search_empty',
        'product_open',
        'destination_use',
        'contribution_received',
      ].includes(event)
    )
      throw new Error('Invalid event');
    const salt = Deno.env.get('RATE_LIMIT_SALT');
    if (!salt) throw new Error('Unconfigured');
    const bytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(
        'usage' + salt + (req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'),
      ),
    );
    const key = Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const allowed = await db.rpc('check_usage_rate', { rate_key: key });
    if (allowed.error || !allowed.data) return new Response(null, { status: 429, headers });
    const count = await db.rpc('count_usage', { event_name: event });
    if (count.error) throw count.error;
    return new Response(null, { status: 204, headers });
  } catch {
    return Response.json({ error: 'Request rejected' }, { status: 400, headers });
  }
});
