import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { notifyContribution } from '../_shared/notification.ts';
Deno.serve(async (req) => {
  const secret = Deno.env.get('NOTIFICATION_CRON_SECRET');
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
  if (req.method !== 'POST' || !secret || req.headers.get('Authorization') !== `Bearer ${secret}`)
    return new Response('{"error":"Unauthorized"}', { status: 401, headers });
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const rows = await db
    .from('contribution_notifications')
    .select('contribution_id')
    .in('state', ['pending', 'sending'])
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at')
    .limit(10);
  if (rows.error) return new Response('{"error":"Service unavailable"}', { status: 503, headers });
  for (const row of rows.data || []) await notifyContribution(db, row.contribution_id);
  return Response.json({ processed: rows.data?.length || 0 }, { headers });
});
