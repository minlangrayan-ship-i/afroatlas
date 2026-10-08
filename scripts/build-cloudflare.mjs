import { spawnSync } from 'node:child_process';
if (!process.env.SITE_URL)
  throw new Error('Configure the actual Cloudflare SITE_URL before building.');
const scripts = [
  'scripts/prepare-data.mjs',
  'scripts/validate.ts',
  'node_modules/astro/bin/astro.mjs',
  'scripts/localize-build.ts',
  'scripts/prepare-cloudflare.mjs',
];
for (const file of scripts) {
  const args = file.endsWith('.ts')
    ? ['--import', 'tsx', file]
    : [file, ...(file.endsWith('astro.mjs') ? ['build'] : [])];
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, ADMIN_GATEWAY_ENABLED: 'true' },
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
