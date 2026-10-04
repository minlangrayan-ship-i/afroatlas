import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { proposalSchema, photoSignature, cors } from '../_shared/validation.ts';
import { boundedForm } from '../_shared/body.ts';
Deno.serve(async (req) => {
  let headers: Record<string, string> = {};
  let stored: string | null = null;
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  try {
    headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers });
    if (req.method !== 'POST') return new Response(null, { status: 405, headers });
    if (Number(req.headers.get('content-length') || 0) > 5500000) throw new Error('File too large');
    const salt = Deno.env.get('RATE_LIMIT_SALT');
    if (!salt) throw new Error('Service not configured');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ip));
    const key = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    const rate = await db.rpc('check_submission_rate', { rate_key: key });
    if (rate.error) throw rate.error;
    if (!rate.data)
      return Response.json(
        { error: 'Trop de propositions. Réessayez dans une heure.' },
        { status: 429, headers },
      );
    const form = await boundedForm(req);
    const proposal = proposalSchema.parse(JSON.parse(String(form.get('proposal'))));
    const photo = form.get('photo');
    const id = crypto.randomUUID();
    if (photo instanceof File) {
      const bytes = new Uint8Array(await photo.arrayBuffer());
      if (bytes.length === 0 || bytes.length > 5242880 || !photoSignature(bytes, photo.type))
        throw new Error('Invalid photograph (JPEG/PNG/WebP, max 5 MB)');
      if (
        !proposal.photoRights &&
        !(
          proposal.photoSource.startsWith('https://') &&
          ['CC BY 4.0', 'CC BY-SA 4.0', 'CC0', 'Public domain'].includes(proposal.photoLicense)
        )
      )
        throw new Error('Photo rights required');
      stored = `${id}.${photo.type === 'image/jpeg' ? 'jpg' : photo.type === 'image/png' ? 'png' : 'webp'}`;
      const upload = await db.storage
        .from('afroatlas-pending')
        .upload(stored, bytes, { contentType: photo.type, upsert: false });
      if (upload.error) throw upload.error;
    }
    const inserted = await db
      .from('contributions')
      .insert({ id, proposal, photo_path: stored, status: 'pending' });
    if (inserted.error) throw inserted.error;
    return Response.json({ id, status: 'pending' }, { status: 201, headers });
  } catch (e) {
    if (stored) await db.storage.from('afroatlas-pending').remove([stored]);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Submission failed' },
      { status: 400, headers },
    );
  }
});
