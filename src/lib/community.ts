import { z } from 'zod';
export const contributionTypes = [
  'new-product',
  'local-name',
  'country-region',
  'correction',
  'photo',
] as const;
export const submissionSchema = z
  .object({
    type: z.enum(contributionTypes),
    product: z.string().max(200),
    name: z.string().max(200),
    country: z.string().max(100),
    region: z.string().max(200),
    language: z.string().max(80),
    form: z.string().max(100),
    description: z.string().min(10).max(3000),
    source: z.string().min(10).max(2000),
    photoRights: z.boolean(),
    photoSource: z.string().max(1000),
    photoLicense: z.string().max(100),
    consent: z.literal(true),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'new-product' && !v.product.trim())
      ctx.addIssue({ code: 'custom', path: ['product'], message: 'Indiquez le nouveau produit.' });
    if (v.type === 'local-name' && (!v.product.trim() || !v.name.trim()))
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'Indiquez le produit et son appellation.',
      });
    if (v.type === 'country-region' && !v.country.trim())
      ctx.addIssue({ code: 'custom', path: ['country'], message: 'Indiquez le pays proposé.' });
  });
export type Submission = z.infer<typeof submissionSchema>;
export const backend = {
  url: (import.meta.env.PUBLIC_SUPABASE_URL || '').replace(/\/$/, ''),
  key: import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
};
export const configured = Boolean(backend.url && backend.key);
export const maxPhotoBytes = 5 * 1024 * 1024;
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];
export function validatePhoto(file: Pick<File, 'size' | 'type'>) {
  if (!photoTypes.includes(file.type)) throw new Error('Formats acceptés : JPEG, PNG, WebP.');
  if (file.size > maxPhotoBytes || file.size === 0)
    throw new Error('La photographie doit peser entre 1 octet et 5 Mo.');
}
export async function api(path: string, options: RequestInit = {}, token?: string) {
  if (!configured)
    throw new Error('Service de contributions non configuré. Aucune proposition envoyée.');
  const response = await fetch(`${backend.url}${path}`, {
    ...options,
    headers: {
      apikey: backend.key,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(30000),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(json?.message || json?.error || `Service indisponible (${response.status}).`);
  return json;
}
export async function sendContribution(fields: Submission, photo?: File | null) {
  const value = submissionSchema.parse(fields);
  if (photo) {
    validatePhoto(photo);
    if (!value.photoRights && !(value.photoSource.startsWith('https://') && value.photoLicense))
      throw new Error('Confirmez vos droits ou renseignez une source et une licence réutilisable.');
  }
  const body = new FormData();
  body.set('proposal', JSON.stringify(value));
  if (photo) body.set('photo', photo);
  const result = await api('/functions/v1/submit-contribution', { method: 'POST', body });
  if (!result?.id || result.status !== 'pending')
    throw new Error('Accusé de réception invalide : envoi non confirmé.');
  return result as { id: string; status: 'pending' };
}
export const publicEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(['product', 'name', 'usage', 'photo', 'country', 'region']),
  productId: z.string(),
  labelFr: z.string(),
  labelEn: z.string().nullable(),
  labelAr: z.string().nullable(),
  categoryId: z.enum([
    'spices',
    'vegetables',
    'fish',
    'staples',
    'herbs',
    'fruits',
    'preparations',
  ]),
  form: z.string(),
  name: z.string(),
  language: z.string(),
  country: z.string(),
  region: z.string(),
  description: z.string(),
  sourceUrl: z.url(),
  sourceLicense: z.string().min(1),
  photoUrl: z.string(),
  photoCredit: z.string(),
  photoLicense: z.string(),
});
export type PublicEntry = z.infer<typeof publicEntrySchema>;
let publicPromise: Promise<PublicEntry[]> | null = null;
export function approvedEntries(): Promise<PublicEntry[]> {
  if (!configured) return Promise.resolve([]);
  return (publicPromise ||= api(
    '/rest/v1/published_entries?select=payload,id&order=published_at.asc',
  )
    .then((rows) =>
      z
        .array(z.object({ id: z.string(), payload: publicEntrySchema }))
        .parse(rows)
        .map((r) => ({ ...r.payload, id: r.id })),
    )
    .catch(() => {
      publicPromise = null;
      return [];
    }));
}
