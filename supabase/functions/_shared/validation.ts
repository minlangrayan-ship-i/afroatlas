import { z } from 'npm:zod@4.0.0';
export const proposalSchema = z
  .object({
    type: z.enum(['new-product', 'local-name', 'country-region', 'correction', 'photo']),
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
  .superRefine((v, c) => {
    if (v.type === 'new-product' && !v.product.trim())
      c.addIssue({ code: 'custom', message: 'Product required' });
    if (v.type === 'local-name' && (!v.product.trim() || !v.name.trim()))
      c.addIssue({ code: 'custom', message: 'Product and local name required' });
    if (v.type === 'country-region' && !v.country.trim())
      c.addIssue({ code: 'custom', message: 'Country required' });
  });
export const entrySchema = z.object({
  id: z.string(),
  kind: z.enum(['product', 'name', 'usage', 'photo', 'country', 'region']),
  productId: z.string(),
  labelFr: z.string(),
  labelEn: z.string().nullable(),
  labelAr: z.string().nullable(),
  categoryId: z.enum(['spices', 'vegetables', 'fish']),
  form: z.string(),
  name: z.string(),
  language: z.string(),
  country: z.string(),
  region: z.string(),
  description: z.string(),
  sourceUrl: z.url().refine((v) => v.startsWith('https://')),
  sourceLicense: z.string().min(1),
  photoUrl: z.string(),
  photoCredit: z.string(),
  photoLicense: z.string(),
});
export function photoSignature(bytes: Uint8Array, mime: string) {
  return mime === 'image/jpeg'
    ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === 'image/png'
      ? bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
      : mime === 'image/webp'
        ? new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
          new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
        : false;
}
export function cors(req: Request) {
  const allowed = (
    Deno.env.get('ALLOWED_ORIGINS') || 'https://minlangrayan-ship-i.github.io'
  ).split(',');
  const origin = req.headers.get('origin') || '';
  if (!allowed.includes(origin)) throw new Error('Origin forbidden');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    Vary: 'Origin',
  };
}
