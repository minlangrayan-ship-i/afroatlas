import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { proposalSchema, photoSignature, cors } from '../_shared/validation.ts';
import { boundedForm } from '../_shared/body.ts';
import { sanitizePhoto } from '../_shared/photo.ts';
import { notifyContribution } from '../_shared/notification.ts';
Deno.serve(async (req) => {
  let headers: Record<string, string> = {};
  let stored: string | null = null;
  let received = false;
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
    const requestKey = req.headers.get('Idempotency-Key') || crypto.randomUUID();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)
    )
      throw new Error('Invalid request key');
    const rawPhoto =
      photo instanceof File ? new Uint8Array(await photo.arrayBuffer()) : new Uint8Array();
    const hashInput = new Uint8Array(
      new TextEncoder().encode(JSON.stringify(proposal)).length + rawPhoto.length,
    );
    const proposalBytes = new TextEncoder().encode(JSON.stringify(proposal));
    hashInput.set(proposalBytes);
    hashInput.set(rawPhoto, proposalBytes.length);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', hashInput)), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    const existing = await db
      .from('contributions')
      .select('id,status,request_hash')
      .eq('request_key', requestKey)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      if (existing.data.request_hash !== hash)
        return Response.json(
          { error: 'La proposition a changé. Actualisez le formulaire.' },
          { status: 409, headers },
        );
      return Response.json(
        {
          id: existing.data.id,
          status: existing.data.status,
          notification: await notifyContribution(db, existing.data.id).catch(() => 'pending'),
        },
        { headers },
      );
    }
    const id = requestKey;
    if (photo instanceof File) {
      const bytes = rawPhoto;
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
      const clean = await sanitizePhoto(bytes, photo.type);
      stored = `${id}-${crypto.randomUUID()}.webp`;
      const upload = await db.storage
        .from('afroatlas-pending')
        .upload(stored, clean, { contentType: 'image/webp', upsert: false });
      if (upload.error) throw upload.error;
    }
    const inserted = await db.rpc('receive_contribution', {
      request_id: id,
      content_hash: hash,
      new_proposal: proposal,
      private_photo: stored,
    });
    if (inserted.error) throw inserted.error;
    received = true;
    // A concurrent retry may have won; discard only this request's unused upload.
    if (stored) {
      const saved = await db.from('contributions').select('photo_path').eq('id', id).single();
      if (saved.data && saved.data.photo_path !== stored)
        await db.storage.from('afroatlas-pending').remove([stored]);
    }
    const notification = await notifyContribution(db, id).catch(() => 'pending');
    return Response.json(
      { id, status: inserted.data.status, notification },
      { status: 201, headers },
    );
  } catch (e) {
    if (stored && !received) await db.storage.from('afroatlas-pending').remove([stored]);
    return Response.json(
      {
        error:
          'Proposition non confirmée. Vérifiez les champs, le format et les droits de la photo, puis réessayez.',
      },
      { status: 400, headers },
    );
  }
});
