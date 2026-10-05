import { readdir, readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve('dist-cloudflare');
const routes = JSON.parse(await readFile(path.join(root, '_routes.json'), 'utf8'));
const base = routes.include[0].replace(/\/moderation$/, '');
assert(routes.include.includes(`${base}/api/admin/*`));
assert(!routes.include.includes('/*'), 'Public pages must bypass administrative Functions');
let files = 0;
async function inspect(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) {
      assert(!['moderation', 'server', 'functions', '.git', 'api'].includes(item.name), file);
      await inspect(file);
    } else {
      files++;
      assert(
        (await stat(file)).size <= 25 * 1024 * 1024,
        `Cloudflare asset exceeds 25 MiB: ${file}`,
      );
      assert(!/\.(map|ts|tsx|sql)$/.test(file), file);
      if (/\.(js|html)$/.test(file)) {
        const text = await readFile(file, 'utf8');
        assert(!text.includes('ADMIN_ACCESS_ISSUER'), 'Server configuration in public build');
        assert(
          !text.includes('SUPABASE_SERVICE_ROLE_KEY'),
          'Privileged backend implementation in public build',
        );
        if (file.endsWith('.html'))
          assert(!text.includes('Email propriétaire'), 'Static administrative HTML');
      }
    }
  }
}
await inspect(root);
assert(files <= 20000, 'Cloudflare Free file limit exceeded');
const worker = await readdir('.runtime/cloudflare-worker');
assert(worker.length > 0, 'Function bundle missing');
console.log(
  `Cloudflare Function compiled; ${files} public assets within Free limits; no static administrative page or public source maps.`,
);
