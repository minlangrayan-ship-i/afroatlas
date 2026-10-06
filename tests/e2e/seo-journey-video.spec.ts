import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
const regions: { id: string; countryISO3: string; name: string }[] = JSON.parse(
  readFileSync('src/data/published/regions.json', 'utf8'),
);
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
test.beforeEach(async ({ page }) => {
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
});

test('destination travels from search to seller card, and only the attested region is used', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'catalogue/?q=Okok');
  await page.getByLabel('Pays de l’interlocuteur').selectOption('CMR');
  const centre = regions.find((r) => r.countryISO3 === 'CMR' && r.name === 'Centre')!;
  await page.getByLabel('Région de l’interlocuteur').selectOption(centre.id);
  await page
    .locator('.product-card')
    .filter({ hasText: 'Eru — feuilles' })
    .getByRole('link', { name: 'Explorer la fiche ↗' })
    .click();
  await expect(page).toHaveURL(/destination=CMR/);
  await expect(page).toHaveURL(/q=Okok/);
  await page.locator('#demander').scrollIntoViewIfNeeded();
  await expect(page.getByLabel('Région de l’interlocuteur')).toHaveValue(centre.id);
  await expect(page.locator('#demander > [aria-live] .seller-names')).toContainText('Okok');
  await expect(page.locator('#demander > [aria-live] .seller-names a').first()).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await page.getByRole('button', { name: 'Montrer au vendeur ↗' }).click();
  await expect(page.locator('.seller-dialog')).toBeVisible();
  await expect(page.locator('.seller-dialog')).toContainText('Okok');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.seller-dialog')).not.toBeVisible();
  const north = regions.find((r) => r.countryISO3 === 'CMR' && r.name === 'Adamaoua')!;
  await page.getByLabel('Région de l’interlocuteur').selectOption(north.id);
  await expect(page.locator('#demander > [aria-live]')).toContainText(
    'Aucune appellation locale sourcée',
  );
  await page.getByLabel('Pays de l’interlocuteur').selectOption('FRA');
  await expect(page.getByLabel('Région de l’interlocuteur')).toHaveValue('');
  await expect(page.locator('#demander > [aria-live]')).toContainText(
    'ne prouvent pas un usage dans cette destination',
  );
});

test('new destination controls and seller card work with Arabic and Latin names', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'produits/eru/?q=Okok&destination=CMR&lang=ar');
  await page.locator('#demander').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.destination-picker legend')).toContainText('أين');
  await expect(page.locator('.destination-picker select').first()).toHaveValue('CMR');
  await expect(
    page.locator('#demander > [aria-live] bdi').filter({ hasText: 'Okok' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#demander > button').click();
  await expect(page.locator('.seller-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('presentation video plays, loads its screen-text track, and never downloads on the home page', async ({
  page,
}) => {
  const mp4: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.endsWith('.mp4')) mp4.push(r.url());
  });
  await page.locator('.presentation-teaser').scrollIntoViewIfNeeded();
  await expect(page.locator('.presentation-teaser img')).toBeVisible();
  expect(mp4).toEqual([]);
  await page.goto(base + 'presentation/');
  const video = page.locator('video');
  await expect(video).toHaveAttribute('preload', 'none');
  expect(await video.getAttribute('autoplay')).toBeNull();
  await expect(video).toHaveAttribute('poster', /presentation-poster.webp$/);
  await expect(page.locator('track')).toHaveAttribute('label', 'Texte à l’écran (FR)');
  await video.click();
  await video.evaluate(async (v: HTMLVideoElement) => {
    v.textTracks[0].mode = 'hidden';
    await v.play();
  });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0);
  expect(await video.evaluate((v: HTMLVideoElement) => v.duration)).toBeGreaterThan(76);
  expect(await video.evaluate((v: HTMLVideoElement) => v.duration)).toBeLessThan(79);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0].cues?.length || 0))
    .toBeGreaterThan(5);
  await video.evaluate((v: HTMLVideoElement) => v.pause());
  await expect(page.getByRole('link', { name: 'Ouvrir la vidéo ↗' })).toHaveAttribute(
    'href',
    /presentation.mp4$/,
  );
});

test('product content, canonical and factual structured data exist without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(base + 'produits/eru/?q=Okok&destination=CMR');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Eru');
  await expect(page.locator('.names-panel')).toContainText('Okok');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://minlangrayan-ship-i.github.io/afroatlas/produits/eru/',
  );
  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) || '{}',
  )['@graph'];
  expect(graph.some((g: { '@type': string }) => g['@type'] === 'DefinedTerm')).toBe(true);
  expect(graph.some((g: { '@type': string }) => g['@type'] === 'BreadcrumbList')).toBe(true);
  expect(JSON.stringify(graph)).not.toContain('AggregateRating');
  await expect(page.locator('link[hreflang]')).toHaveCount(0);
  await expect(page.locator('script[src*="cloudflareinsights.com/beacon"]')).toHaveCount(1);
  await context.close();
});

test('sitemap excludes private, empty and arbitrary search pages while preserving editorial links', async ({
  request,
  page,
}) => {
  const root = await request.get(base + 'sitemap-index.xml');
  expect(root.status()).toBe(200);
  const response = await request.get(base + 'sitemap-0.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  for (const route of ['produits/gombo/', 'categories/spices/', 'presentation/', 'pays/cmr/'])
    expect(xml).toContain('/afroatlas/' + route);
  for (const route of ['catalogue/', 'moderation/', 'contribuer/', 'favoris/', '404/', 'pays/ner/'])
    expect(xml).not.toContain('/afroatlas/' + route);
  expect(xml).not.toContain('?q=');
  expect(xml).toContain('<lastmod>2026-10-05');
  const robots = await request.get(base + 'robots.txt');
  expect(await robots.text()).toContain('/afroatlas/sitemap-index.xml');
  await page.goto(base + 'catalogue/');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
  const missing = await request.get(base + 'produits/no-such-documented-product/');
  expect(missing.status()).toBe(404);
  await page.goto(base + 'produits/muscade/');
  await expect(page.locator('.product-hero .photo-credit')).toContainText('David Monniaux');
});

test('mobile contribution keeps details optional, prefills the product and labels a new country', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'contribuer/?product=eru');
  await expect(page.getByLabel('Produit concerné', { exact: true })).toHaveValue(
    'Eru — feuilles de Gnetum',
  );
  await expect(page.locator('.contribution-form')).toContainText('product-eru');
  await expect(page.getByRole('radio', { name: 'Ajouter une appellation' })).toBeChecked();
  await expect(page.getByLabel('E-mail pour le suivi (facultatif)', { exact: true })).toHaveCount(
    1,
  );
  await expect(
    page.getByLabel('E-mail pour le suivi (facultatif)', { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByLabel('Courte précision', { exact: true })).not.toHaveAttribute(
    'required',
  );
  await page.getByRole('radio', { name: 'Proposer un produit' }).check();
  await expect(page.getByLabel('Nom local', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Courte précision', { exact: true })).toHaveAttribute(
    'required',
    '',
  );
  await page.getByRole('radio', { name: 'Corriger une information' }).check();
  await page.getByLabel('Information à corriger', { exact: true }).selectOption('country-region');
  await page.getByLabel('Pays', { exact: true }).selectOption('autre');
  await page.getByLabel('Nom du pays proposé', { exact: true }).fill('Pays à documenter');
  await page.locator('.contribution-optional summary').click();
  await expect(
    page.getByLabel('E-mail pour le suivi (facultatif)', { exact: true }),
  ).not.toHaveAttribute('required');
  const bytes = await readFile('public/images/gombo-shop-400.webp');
  await page
    .getByLabel('Photographie facultative')
    .setInputFiles({ name: 'gombo.webp', mimeType: 'image/webp', buffer: bytes });
  await expect(page.locator('.upload-preview img')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Envoyer ma contribution par email' }),
  ).toBeEnabled();
  await expect(page.locator('.notice')).toContainText('sans publication automatique');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
