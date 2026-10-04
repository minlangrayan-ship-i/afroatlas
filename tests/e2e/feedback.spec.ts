import { test, expect } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
test('new countries, distinct forms and checked images work on mobile and desktop', async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + 'explorer/?lang=fr');
    for (const iso of ['gab', 'gnq', 'ken'])
      await expect(page.locator(`.africa-map a[href$="/pays/${iso}/"]`)).toHaveCount(1);
    await page.goto(base + 'catalogue/?q=folere');
    await expect(page.locator('.product-card')).toHaveCount(3);
    await page.goto(base + 'catalogue/?q=Wataleaf');
    await expect(page.locator('.product-card')).toHaveCount(1);
    for (const slug of ['epinard', 'pebe']) {
      await page.goto(base + `produits/${slug}/`);
      await expect(page.locator('.photo-open img')).toHaveAttribute(
        'src',
        new RegExp(`${slug}-reviewed-960`),
      );
      expect(
        await page
          .locator('.photo-open img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      ).toBe(true);
      await expect(page.locator('.photo-credit')).toContainText('CC BY-SA');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.goto(base + 'catalogue/?q=masso');
    await expect(page.locator('.product-card')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toContainText('aucune espèce');
    await expect(page.locator('.empty-state a[href*="contribuer"]')).toBeVisible();
    await page.goto(base + 'produits/waterleaf/?lang=ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
