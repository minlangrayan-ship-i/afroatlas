import { test, expect } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
test('Cameroon corpus exposes regional, historical and ambiguous names on mobile and desktop', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + 'pays/cmr/?lang=fr');
    await expect(page.locator('.region-list button')).toHaveCount(10);
    await page.locator('.region-list button').filter({ hasText: 'Centre' }).click();
    await expect(page.locator('.region-result')).toContainText('messep');
    await expect(page.locator('.region-result')).toContainText('Kpem');
    await page.locator('.region-list button').filter({ hasText: 'Adamaoua' }).click();
    await expect(page.locator('.region-result')).toContainText('Aucune appellation régionale');
    await expect(
      page.getByRole('heading', { name: 'Nord Cameroun — aire historique (1954)' }),
    ).toBeVisible();
    await page.goto(base + 'catalogue/?q=silure&lang=fr');
    await expect(page.locator('.product-card')).toHaveCount(2);
    await expect(page.locator('.product-card').filter({ hasText: 'Silure Clarias' })).toHaveCount(
      1,
    );
    await expect(
      page.locator('.product-card').filter({ hasText: 'Silure Heterobranchus' }),
    ).toHaveCount(1);
    await page.goto(base + 'produits/monodora-plante/?lang=fr');
    await page.getByLabel('Langue', { exact: true }).selectOption('cm-language-ewondo');
    await expect(page.locator('.names-panel tbody')).toContainText('ding');
    await expect(page.locator('.names-panel tbody')).toContainText('Ewondo');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.goto(base + 'produits/kpem/?lang=ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.product-hero .photo-gap')).not.toContainText('Photo de la forme');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(errors).toEqual([]);
});
