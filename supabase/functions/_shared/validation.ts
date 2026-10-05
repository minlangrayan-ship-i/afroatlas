import { z } from 'npm:zod@4.0.0';
export const proposalSchema = z
  .object({
    type: z.enum(['new-product', 'local-name', 'country-region', 'correction', 'photo']),
    product: z.string().max(200),
    productId: z
      .string()
      .regex(/^[a-zA-Z0-9_-]*$/)
      .max(120)
      .optional(),
    productSlug: z
      .string()
      .regex(/^[a-z0-9-]*$/)
      .max(120)
      .optional(),
    name: z.string().max(200),
    country: z.string().max(100),
    countryName: z.string().max(100).optional(),
    region: z.string().max(200),
    language: z.string().max(80),
    form: z.string().max(100),
    description: z.string().max(3000),
    source: z.string().max(2000),
    contributorName: z
      .string()
      .max(100)
      .refine((v) => !/[\r\n\x00]/.test(v))
      .optional(),
    contributorEmail: z
      .union([
        z
          .email()
          .max(254)
          .refine((v) => !/[\r\n]/.test(v)),
        z.literal(''),
      ])
      .optional(),
    website: z.literal('').optional(),
    photoRights: z.boolean(),
    photoSource: z.string().max(1000),
    photoLicense: z.string().max(100),
    consent: z.literal(true),
  })
  .superRefine((v, c) => {
    if (v.country === 'autre' && !v.countryName?.trim())
      c.addIssue({ code: 'custom', message: 'Nom du pays proposé requis' });
    if (['new-product', 'correction', 'photo'].includes(v.type) && v.description.trim().length < 10)
      c.addIssue({ code: 'custom', message: 'Précision requise (10 caractères minimum)' });
    if (v.type === 'local-name' && !v.country.trim())
      c.addIssue({ code: 'custom', message: 'Pays d’usage requis' });
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
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,idempotency-key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    Vary: 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
