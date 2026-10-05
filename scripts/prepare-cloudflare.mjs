import { mkdir, readdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';

const site = new URL(process.env.SITE_URL || 'https://minlangrayan-ship-i.github.io/afroatlas/');
if (
  site.protocol !== 'https:' ||
  site.hostname === 'minlangrayan-ship-i.github.io' ||
  site.username ||
  site.password ||
  site.search ||
  site.hash
)
  throw new Error(
    'SITE_URL must be the real HTTPS Cloudflare production URL, including the base path.',
  );
const basePath = site.pathname.replace(/\/$/, '');
const destination = path.resolve('dist-cloudflare');
if (path.dirname(destination) !== process.cwd() || path.basename(destination) !== 'dist-cloudflare')
  throw new Error('Unsafe generated output path');
await rm(destination, { recursive: true, force: true });
const prefix = basePath.replace(/^\//, '');
const panelHTML = await readFile('dist/moderation/index.html', 'utf8');
if (!panelHTML.includes('Email propriétaire'))
  throw new Error('Build with ADMIN_GATEWAY_ENABLED=true before packaging Cloudflare.');
async function copyPublic(relative = '') {
  for (const entry of await readdir(path.join('dist', relative), { withFileTypes: true })) {
    const file = path.posix.join(relative, entry.name);
    // The private HTML exists only in the server bundle. Quota failures cannot expose it as a static asset.
    if (file === 'moderation' || file === 'api') continue;
    const target = path.join(destination, prefix, file);
    if (entry.isDirectory()) {
      await mkdir(target, { recursive: true });
      await copyPublic(file);
    } else {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(path.join('dist', file), target);
    }
  }
}
await copyPublic();
if (basePath) await copyFile('dist/404.html', path.join(destination, '404.html'));
await mkdir('server/generated', { recursive: true });
await writeFile(
  'server/generated/admin-panel.mjs',
  `// Generated server-only HTML; never upload this directory as static assets.\nexport const basePath=${JSON.stringify(basePath)};\nexport const panelHTML=${JSON.stringify(panelHTML)};\n`,
);
await writeFile(
  path.join(destination, '_routes.json'),
  JSON.stringify(
    {
      version: 1,
      include: [
        `${basePath}/moderation`,
        `${basePath}/moderation/*`,
        `${basePath}/api/admin`,
        `${basePath}/api/admin/*`,
      ],
      exclude: [],
    },
    null,
    2,
  ),
);
await writeFile(
  path.join(destination, '_headers'),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${basePath}/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n`,
);
await writeFile(
  path.join(destination, 'robots.txt'),
  `User-agent: *\nAllow: ${basePath}/\nDisallow: ${basePath}/moderation\nDisallow: ${basePath}/api/admin\nSitemap: ${site.href.replace(/\/$/, '')}/sitemap-index.xml\n`,
);
if (basePath) await copyFile(path.join(destination, 'robots.txt'), path.join(destination, prefix, 'robots.txt'));
if (basePath) await writeFile(path.join(destination, '_redirects'), `/ ${basePath}/ 302\n`);
console.log(
  'Cloudflare public assets packaged; administrative HTML confined to the Function bundle.',
);
