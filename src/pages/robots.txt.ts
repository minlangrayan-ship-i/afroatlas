import type { APIContext } from 'astro';
// With a custom domain this file sits at the domain root, where crawlers read it.
export const GET = ({ site }: APIContext) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const sitemap = new URL(`${base}sitemap-index.xml`, site);
  return new Response(`User-agent: *\nAllow: ${base}\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
