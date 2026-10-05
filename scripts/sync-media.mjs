import { readFile } from 'node:fs/promises';
const c = JSON.parse(await readFile('src/data/published/catalogue.json', 'utf8'));
const rows = c.products
  .map((p) => {
    const image = c.images.find((i) => i.id === p.imageId);
    if (image.role !== 'primary') return null;
    return {
      id: image.id,
      product_id: p.id,
      payload: {
        ...image,
        publicUrl: 'https://minlangrayan-ship-i.github.io/afroatlas' + image.localPath,
      },
      verification_status: image.verificationStatus,
      updated_at: image.metadataCheckedAt,
    };
  })
  .filter(Boolean);
if (process.argv.includes('--dry-run')) {
  console.log(
    JSON.stringify({
      dryRun: true,
      rows: rows.length,
      idsUnique: new Set(rows.map((r) => r.id)).size === rows.length,
    }),
  );
  process.exit(0);
}
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    'Media sync requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a private local environment; no database write performed.',
  );
  process.exit(2);
}
const endpoint = new URL('/rest/v1/catalogue_media?on_conflict=id', url);
if (endpoint.protocol !== 'https:') throw new Error('HTTPS backend required');
const result = await fetch(endpoint, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
  signal: AbortSignal.timeout(30000),
});
if (!result.ok) {
  console.error(`Media sync failed (${result.status}); provider body withheld.`);
  process.exit(1);
}
console.log(`Synchronized ${rows.length} documentary media records by stable ID.`);
