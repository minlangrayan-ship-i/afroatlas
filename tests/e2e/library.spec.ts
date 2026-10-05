import { readFileSync } from 'node:fs';
const catalogueData = JSON.parse(readFileSync('src/data/published/catalogue.json', 'utf8'));
import { countries } from '../../src/data/countries';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
const url = (path: string) => base + path;
test('public page types are responsive, without external API calls or console errors', async ({
  page,
}) => {
  const errors: string[] = [];
  const foreignRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (
      new URL(request.url()).origin !== new URL(base).origin &&
      !['static.cloudflareinsights.com', 'cloudflareinsights.com'].includes(
        new URL(request.url()).hostname,
      )
    )
      foreignRequests.push(request.url());
  });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'catalogue/', 'pays/cmr/', 'comparer/', 'contribuer/', 'sources/']) {
      await page.goto(url(route), { waitUntil: 'networkidle' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  expect(errors).toEqual([]);
  expect(foreignRequests).toEqual([]);
});
test.beforeEach(async ({ page }) => {
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
});
test('home and responsive catalogue are immediately usable, with real loaded images', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Un produit');
    const input = page.getByRole('combobox');
    await input.fill('gingembre');
    await page.getByRole('listbox').waitFor();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(page).toHaveURL(/produits\/gingembre/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Gingembre');
    expect(
      await page
        .locator('.photo-open img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Agrandir la photographie' }).click();
    await expect(page.locator('.photo-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.photo-dialog')).not.toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('filters persist in URL and back restores results without geographic invention', async ({
  page,
}) => {
  await page.goto(url('catalogue/?q=tilapia'));
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByLabel('Catégorie', { exact: true }).selectOption('fish');
  await expect(page).toHaveURL(/category=fish/);
  await page.getByLabel('Contexte d’appellation').selectOption('GAB');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toContainText('Aucune appellation');
  await page.goBack();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.getByLabel('Contexte d’appellation')).toHaveValue('');
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('.product-card')).toHaveCount(24);
  while (await page.getByRole('button', { name: 'Afficher davantage de fiches' }).count())
    await page.getByRole('button', { name: 'Afficher davantage de fiches' }).click();
  await expect(page.locator('.product-card')).toHaveCount(catalogueData.products.length);
});
test('homonyms retain separate candidates, favorites and comparator persist locally', async ({
  page,
}) => {
  await page.goto(url('catalogue/?q=piment'));
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', { name: 'Favori', exact: true })
    .click();
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', { name: 'Comparer', exact: true })
    .click();
  await page
    .locator('.product-card')
    .nth(1)
    .getByRole('button', { name: 'Comparer', exact: true })
    .click();
  await page.goto(url('favoris/'));
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goto(url('comparer/'));
  await expect(page.locator('.compare-card')).toHaveCount(2);
  await expect(page.locator('.notice')).toContainText('espèces scientifiques différentes');
});
test('all countries and contexts exist, a region has an honest empty state', async ({ page }) => {
  await page.goto(url('explorer/'));
  await expect(page.locator('.country-groups a')).toHaveCount(countries.length);
  await expect(page.locator('.country-strip a')).toHaveCount(5);
  await page.goto(url('pays/cmr/'));
  await expect(page.locator('.region-list button')).toHaveCount(10);
  await page.locator('.region-list button').filter({ hasText: 'Adamaoua' }).click();
  await expect(page.locator('.region-result')).toContainText(
    'Aucune appellation régionale documentée',
  );
  await expect(page).toHaveURL(/region=/);
  await page.reload();
  await expect(page.locator('.region-list button[aria-pressed=true]')).toHaveCount(1);
});
test('names can be copied and contribution service absence is explicit', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(url('produits/gombo/'));
  await page
    .getByRole('button', { name: /Copier/ })
    .first()
    .click();
  await expect(page.getByRole('status').last()).toContainText('copié');
  await page.goto(url('contribuer/'));
  await expect(page.getByRole('button', { name: 'Envoyer pour validation' })).toBeDisabled();
  await expect(page.locator('.notice')).toContainText('rien n’est envoyé');
  await page.getByRole('radio', { name: 'Corriger une information' }).check();
  await page.getByLabel('Information à corriger', { exact: true }).selectOption('photo');
  await page.locator('.contribution-optional summary').click();
  const file = await readFile('public/images/gombo-shop-400.webp');
  await page
    .getByLabel('Photographie facultative')
    .setInputFiles({ name: 'gombo.webp', mimeType: 'image/webp', buffer: file });
  await expect(page.locator('.upload-preview img')).toBeVisible();
  await page
    .getByLabel('Photographie facultative')
    .setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.locator('.action-message')).toContainText('Formats acceptés');
  await expect(page.locator('.upload-preview')).toHaveCount(0);
});
test('commercial mode and references preserve separate provenance, reduced motion works', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url('references/'));
  await expect(page.locator('.reference-card')).toHaveCount(10);
  await expect(page.locator('.reference-card').first()).toContainText(
    'disponibilité en boutique non vérifiée',
  );
  await page.goto(url('catalogue/'));
  await page.getByLabel('Référence commerciale reliée').check();
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.goto(url('sources/'));
  await expect(page.locator('.credits-grid article')).toHaveCount(
    catalogueData.images.filter((i: { licenseId: string }) => i.licenseId !== 'Non applicable')
      .length,
  );
  const creditedPhoto = page.locator('.credits-grid img').first();
  await creditedPhoto.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      creditedPhoto.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
});
