import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const cataloguePath = 'src/data/published/catalogue.json';
const baseline = JSON.parse(
  execFileSync('git', ['show', 'c7e04128:' + cataloguePath], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  }),
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fingerprint() {
  const files = [
    cataloguePath,
    'public/data/catalogue.json',
    ...(await readdir('public/images')).map((f) => 'public/images/' + f),
  ];
  return Object.fromEntries(
    await Promise.all(files.sort().map(async (p) => [p, hash(await readFile(p))])),
  );
}
const first = await fingerprint();
execFileSync(process.execPath, ['scripts/import/reviewed-forms.mjs', '--dry-run'], {
  stdio: 'inherit',
});
assert.deepEqual(await fingerprint(), first, 'Dry run must leave published data and media intact');
let afterFirst;
for (let run = 1; run <= 2; run++) {
  for (const script of [
    'scripts/import/reviewed-forms.mjs',
    'scripts/audit-images.mjs',
    'scripts/prepare-data.mjs',
  ])
    execFileSync(process.execPath, [script], { stdio: 'inherit' });
  const current = await fingerprint();
  if (run === 1) afterFirst = current;
  else assert.deepEqual(current, afterFirst, 'The second import must be byte-identical');
}
const current = JSON.parse(await readFile(cataloguePath, 'utf8'));
for (const p of baseline.products)
  assert.equal(current.products.find((n) => n.id === p.id)?.slug, p.slug);
for (const key of ['names', 'sources', 'evidence'])
  for (const row of baseline[key])
    assert.deepEqual(
      current[key].find((n) => n.id === row.id),
      row,
      `${key}: preserve ${row.id}`,
    );
assert.deepEqual(current.relations, baseline.relations, 'Product relations must be preserved');
for (const image of baseline.images) {
  const saved = current.images.find((n) => n.id === image.id);
  assert(saved);
  assert.equal(saved.localPath, image.localPath);
  assert.equal(saved.smallPath, image.smallPath);
}
const video = await readFile('public/assets/video/afroatlas-presentation.mp4');
if (process.argv[2]) assert.equal(hash(video), hash(await readFile(process.argv[2])));
const report = {
  checkedAt: '2026-10-05',
  dryRunUnchanged: true,
  secondImportByteIdentical: true,
  originalProductIdsAndUrlsPreserved: true,
  originalNamesSourcesEvidenceRelationsPreserved: true,
  originalImageReferencesPreserved: true,
  products: current.products.length,
  names: current.names.length,
  originalVideoCompared: Boolean(process.argv[2]),
  videoSha256: hash(video),
  videoBytes: video.length,
};
await writeFile('data/research/import-verification.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
