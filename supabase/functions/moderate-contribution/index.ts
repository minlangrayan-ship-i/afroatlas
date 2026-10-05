import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { entrySchema, proposalSchema, cors } from '../_shared/validation.ts';
import { boundedJSON } from '../_shared/body.ts';
Deno.serve(async (req) => {
  let headers: Record<string, string> = {};
  let published: string | null = null;
  const url = Deno.env.get('SUPABASE_URL')!,
    admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    headers = cors(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers });
    if (req.method !== 'POST') return new Response(null, { status: 405, headers });
    const auth = req.headers.get('authorization') || '';
    const { data, error } = await admin.auth.getUser(auth.replace(/^Bearer /, ''));
    if (error || !data.user)
      return Response.json({ error: 'Authentication required' }, { status: 401, headers });
    const owner = await admin
      .from('afroatlas_owners')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (!owner.data) return Response.json({ error: 'Owner only' }, { status: 403, headers });
    const body = (await boundedJSON(req, 20000)) as Record<string, any>;
    if (!['edit', 'accept', 'reject'].includes(body.decision)) throw new Error('Invalid decision');
    const proposal = proposalSchema.parse(body.proposal);
    const row = await admin
      .from('contributions')
      .select('*')
      .eq('id', body.id)
      .eq('status', 'pending')
      .single();
    if (row.error) throw row.error;
    let entry = null;
    if (body.decision === 'accept') {
      entry = entrySchema.parse({ ...body.entry, id: body.id });
      if (['product', 'name', 'usage', 'photo'].includes(entry.kind) && !entry.productId)
        throw new Error('Product ID required');
      if (entry.kind === 'name' && (!entry.name || !entry.language))
        throw new Error('Name and language required');
      if (entry.kind === 'product' && (!entry.labelFr || !entry.form || !entry.description))
        throw new Error('Product label, form and description required');
      if (row.data.photo_path) {
        if (
          !entry.photoCredit ||
          !['CC BY 4.0', 'CC BY-SA 4.0', 'CC0', 'Public domain'].includes(entry.photoLicense)
        )
          throw new Error('Verify photo credit and licence');
        const photo = await admin.storage.from('afroatlas-pending').download(row.data.photo_path);
        if (photo.error) throw photo.error;
        const upload = await admin.storage
          .from('afroatlas-approved')
          .upload(row.data.photo_path, photo.data, { contentType: photo.data.type, upsert: false });
        if (upload.error) throw upload.error;
        published = String(row.data.photo_path);
        entry.photoUrl = admin.storage
          .from('afroatlas-approved')
          .getPublicUrl(published).data.publicUrl;
      } else if (
        entry.photoUrl &&
        !entry.photoUrl.startsWith(url + '/storage/v1/object/public/afroatlas-approved/')
      )
        throw new Error('Use a reviewed uploaded photograph');
      if (['product', 'photo'].includes(entry.kind) && !entry.photoUrl)
        throw new Error('Reviewed product-form photograph required');
    }
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const result = await caller.rpc('review_contribution', {
      contribution_id: body.id,
      decision: body.decision,
      edited_proposal: proposal,
      entry,
      notes: String(body.notes || ''),
    });
    if (result.error) throw result.error;
    return Response.json(
      {
        id: body.id,
        status:
          body.decision === 'accept'
            ? 'accepted'
            : body.decision === 'reject'
              ? 'rejected'
              : 'pending',
      },
      { headers },
    );
  } catch (e) {
    if (published) await admin.storage.from('afroatlas-approved').remove([published]);
    return Response.json(
      {
        error:
          'Décision non enregistrée. Vérifiez les informations, les sources et les droits requis.',
      },
      { status: 400, headers },
    );
  }
});
