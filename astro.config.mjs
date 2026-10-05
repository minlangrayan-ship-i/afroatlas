import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
const catalogue = JSON.parse(
  readFileSync(new URL('./src/data/published/catalogue.json', import.meta.url), 'utf8'),
);
const usefulCountries = new Set(
  [
    ...catalogue.names.flatMap((n) => n.countryIds),
    ...catalogue.contexts.map((c) => c.countryId),
  ].map((id) => id.toLowerCase()),
);
const utility =
  /\/(catalogue|favoris|comparer|moderation|contribuer|404|references|produits\/communaute|pays\/communaute)\/?$/;
const backendOrigin = process.env.PUBLIC_SUPABASE_URL
  ? new URL(process.env.PUBLIC_SUPABASE_URL).origin
  : '';
const deploymentURL = new URL(
  process.env.SITE_URL || 'https://minlangrayan-ship-i.github.io/afroatlas/',
);
if (
  deploymentURL.protocol !== 'https:' ||
  deploymentURL.username ||
  deploymentURL.password ||
  deploymentURL.search ||
  deploymentURL.hash ||
  !/^\/[a-z0-9/-]*$/.test(deploymentURL.pathname)
)
  throw new Error('SITE_URL must be a public HTTPS URL with a simple base path.');
export default defineConfig({
  site: deploymentURL.origin,
  base: deploymentURL.pathname.replace(/\/$/, '') || '/',
  output: 'static',
  markdown: { syntaxHighlight: false },
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      filter: (url) => {
        const path = new URL(url).pathname;
        const country = path.match(/\/pays\/([^/]+)\//)?.[1];
        return !utility.test(path) && (!country || usefulCountries.has(country));
      },
      serialize: (item) => ({ ...item, lastmod: '2026-10-05' }),
    }),
  ],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        `connect-src 'self' https://cloudflareinsights.com ${backendOrigin}`.trim(),
        `img-src 'self' blob: ${backendOrigin}`.trim(),
        "media-src 'self'",
        "font-src 'self'",
        "frame-src 'none'",
      ],
      scriptDirective: { resources: ["'self'", 'https://static.cloudflareinsights.com'] },
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
  vite: { plugins: [tailwind()], build: { sourcemap: false, minify: true } },
});
