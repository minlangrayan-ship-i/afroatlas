import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
export default defineConfig({
  site: 'https://minlangrayan-ship-i.github.io',
  base: '/afroatlas',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwind()], build: { sourcemap: false, minify: true } },
});
