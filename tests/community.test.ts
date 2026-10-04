import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { submissionSchema, validatePhoto, publicEntrySchema } from '../src/lib/community';
import { mergeApproved } from '../src/lib/community-catalogue';
import { cardProducts } from '../src/lib/catalogue';
import { searchProducts, emptyFilters } from '../src/lib/search';
const proposal = {
  type: 'local-name',
  product: 'product-gombo',
  name: 'Nom de test',
  country: 'CMR',
  region: '',
  language: 'local-und',
  form: 'frais',
  description: 'Information à examiner',
  source: 'Source documentaire identifiable',
  photoRights: false,
  photoSource: '',
  photoLicense: '',
  consent: true,
};
const entry = publicEntrySchema.parse({
  id: '00000000-0000-4000-8000-000000000003',
  kind: 'name',
  productId: 'product-gombo',
  labelFr: 'Gombo',
  labelEn: null,
  labelAr: null,
  categoryId: 'vegetables',
  form: 'frais',
  name: 'Nom de test',
  language: 'local-und',
  country: 'CMR',
  region: '',
  description: 'Attestation de test uniquement',
  sourceUrl: 'https://example.org/source',
  sourceLicense: 'CC0',
  photoUrl: '',
  photoCredit: '',
  photoLicense: '',
});
describe('submission and approved catalogue', () => {
  it('requires consent and type-specific fields', () => {
    expect(submissionSchema.safeParse(proposal).success).toBe(true);
    expect(submissionSchema.safeParse({ ...proposal, consent: false }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...proposal, name: '' }).success).toBe(false);
  });
  it('rejects oversized and unsupported photographs', () => {
    expect(() => validatePhoto({ size: 6 * 1024 * 1024, type: 'image/jpeg' })).toThrow();
    expect(() => validatePhoto({ size: 100, type: 'image/svg+xml' })).toThrow();
    expect(() => validatePhoto({ size: 100, type: 'image/webp' })).not.toThrow();
  });
  it('accepted names become searchable without changing the seed catalogue', () => {
    const merged = mergeApproved(cardProducts, [entry]);
    expect(
      searchProducts(merged, { ...emptyFilters, q: 'Nom de test', country: 'CMR' })[0].product.slug,
    ).toBe('gombo');
    expect(
      cardProducts.find((p) => p.slug === 'gombo')!.names.some((n) => n.name === 'Nom de test'),
    ).toBe(false);
  });
  it('accepted products are searchable in Arabic and by documented country without a local name', () => {
    const added = {
      ...entry,
      id: 'new-entry',
      kind: 'product' as const,
      productId: 'community-new',
      labelFr: 'Produit accepté',
      labelEn: 'Approved product',
      labelAr: 'منتج مقبول',
      name: '',
      country: 'MLI',
      photoUrl: 'https://example.org/product.webp',
      photoCredit: 'Author',
      photoLicense: 'CC BY 4.0',
    };
    const merged = mergeApproved(cardProducts, [added]);
    expect(
      searchProducts(merged, { ...emptyFilters, q: 'منتج مقبول', country: 'MLI' })[0].product.id,
    ).toBe('community-new');
    expect(cardProducts.some((p) => p.id === 'community-new')).toBe(false);
  });
  it('accepted replacement photos become primary without mutating seed contexts', () => {
    const merged = mergeApproved(cardProducts, [
      {
        ...entry,
        kind: 'photo',
        form: 'poudre',
        photoUrl: 'https://example.org/replacement.webp',
        photoCredit: 'Photographer',
        photoLicense: 'CC BY 4.0',
      },
      { ...entry, kind: 'usage', country: 'CMR' },
    ]);
    const p = merged.find((p) => p.id === entry.productId)!;
    expect(p.image.role).toBe('primary');
    expect(p.image.depictedForm).toBe('poudre');
    expect(p.image.localPath).toBe('https://example.org/replacement.webp');
    expect(
      cardProducts.find((p) => p.id === entry.productId)!.contexts.some((c) => c.id === entry.id),
    ).toBe(false);
  });
});
describe('actual PostgreSQL migration and moderation policies', () => {
  let db: PGlite;
  const owner = '00000000-0000-4000-8000-000000000001',
    stranger = '00000000-0000-4000-8000-000000000002';
  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema public,storage to anon,authenticated,service_role;grant select on storage.objects to anon,authenticated;`,
    );
    await db.exec(await readFile('supabase/migrations/202610040001_community.sql', 'utf8'));
    await db.query('insert into auth.users(id) values($1),($2)', [owner, stranger]);
    await db.query('insert into public.afroatlas_owners values($1)', [owner]);
    await db.query('insert into contributions(id,proposal,photo_path) values($1,$2,$3)', [
      entry.id,
      proposal,
      'private.jpg',
    ]);
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it('pending proposals and files are not readable by visitors', async () => {
    await db.exec('set role anon');
    await expect(db.query('select * from contributions')).rejects.toThrow();
    expect((await db.query('select * from published_entries')).rows).toHaveLength(0);
    expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);
    await db.exec('reset role');
  });
  it('a signed-in non-owner cannot read or approve proposals', async () => {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [stranger]);
    await db.exec('set role authenticated');
    expect((await db.query('select * from contributions')).rows).toHaveLength(0);
    await expect(
      db.query('select review_contribution($1,$2,$3,$4,$5)', [
        entry.id,
        'accept',
        proposal,
        entry,
        '',
      ]),
    ).rejects.toThrow('Owner only');
    await db.exec('reset role');
  });
  it('owner edits privately, then acceptance publishes and audits atomically', async () => {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.exec('set role authenticated');
    await db.query('select review_contribution($1,$2,$3,$4,$5)', [
      entry.id,
      'edit',
      { ...proposal, description: 'Description modifiée par le propriétaire' },
      null,
      'examen',
    ]);
    expect((await db.query('select * from published_entries')).rows).toHaveLength(0);
    await db.query('select review_contribution($1,$2,$3,$4,$5)', [
      entry.id,
      'accept',
      proposal,
      entry,
      'preuve contrôlée',
    ]);
    expect((await db.query('select status from contributions')).rows).toEqual([
      { status: 'accepted' },
    ]);
    expect((await db.query('select action from moderation_history order by id')).rows).toEqual([
      { action: 'edit' },
      { action: 'accept' },
    ]);
    await expect(
      db.query('select review_contribution($1,$2,$3,$4,$5)', [
        entry.id,
        'accept',
        proposal,
        entry,
        '',
      ]),
    ).rejects.toThrow('already reviewed');
    await db.exec('reset role');
    await db.exec('set role anon');
    expect((await db.query('select payload from published_entries')).rows).toHaveLength(1);
    await db.exec('reset role');
  });
  it('rejection does not publish and rate limits apply server side', async () => {
    const id = '00000000-0000-4000-8000-000000000004';
    await db.query('insert into contributions(id,proposal) values($1,$2)', [id, proposal]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.exec('set role authenticated');
    await db.query('select review_contribution($1,$2,$3,$4,$5)', [
      id,
      'reject',
      proposal,
      null,
      'preuve insuffisante',
    ]);
    expect((await db.query('select * from published_entries where id=$1', [id])).rows).toHaveLength(
      0,
    );
    await db.exec('reset role');
    for (let i = 1; i <= 6; i++)
      expect(
        (
          await db.query<{ allowed: boolean }>('select check_submission_rate($1) as allowed', [
            'hashed-test-key',
          ])
        ).rows[0].allowed,
      ).toBe(i <= 5);
  });
});
