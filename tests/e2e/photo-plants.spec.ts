import { test, expect } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
test('new plants, country filters and attributed photographs work on a mobile Arabic interface', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'catalogue/?q=Mbali&country=MLI&lang=fr');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card .card-photo img')).toBeVisible();
  await page.locator('.product-card .card-photo').click();
  await expect(page.locator('h1')).toContainText('Séné africain');
  await expect(page.locator('.names-panel')).toContainText("M'bali mbali");
  await expect(page.locator('.source-cards')).toContainText('Présence botanique — Zimbabwe');
  await expect(page.locator('.photo-credit').first()).toContainText('SAplants');
  await page.locator('.photo-open').click();
  await expect(page.locator('.photo-dialog')).toBeVisible();
  await page.locator('.photo-dialog .dialog-close').click();
  await page.goto(base + 'produits/aloe-vera/?lang=ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toContainText('صبر حقيقي');
  await expect(page.locator('.product-hero .photo-open img')).toHaveAttribute(
    'src',
    /aloe-vera-coverage/,
  );
  expect(
    await page
      .locator('.product-hero .photo-open img')
      .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(base + 'produits/rondelle/?lang=ar');
  await expect(page.locator('.supplementary-photo')).toBeVisible();
  await expect(page.locator('.supplementary-photo')).toContainText('صورة إضافية للتعريف');
  await expect(page.locator('.product-hero .photo-open img')).toBeVisible();
  await page.goto(base + 'produits/kpem/?lang=fr');
  await expect(page.locator('.supplementary-photo')).toContainText(
    'ne représente pas le plat préparé',
  );
  await page.goto(base + 'pays/tcd/?lang=fr');
  await expect(page.locator('h1')).toContainText('Tchad');
  await expect(page.locator('body')).toContainText('Senna italica');
  expect(errors).toEqual([]);
});
