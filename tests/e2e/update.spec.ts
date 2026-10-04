import { test, expect } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
test.beforeEach(async ({ page }) => {
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
});
test('Mali, Burkina Faso, Niger and Nigeria are distinct in map, search and forms', async ({
  page,
}) => {
  await page.goto(base + 'explorer/');
  await expect(page.locator('.country-groups a')).toHaveCount(23);
  for (const [name, iso] of [
    ['Mali', 'mli'],
    ['Burkina Faso', 'bfa'],
    ['Niger', 'ner'],
    ['Nigeria', 'nga'],
  ]) {
    await page.goto(base + 'explorer/');
    await expect(page.locator(`.africa-map a[href$="/pays/${iso}/"]`)).toHaveCount(1);
    await page.goto(base + `pays/${iso}/`);
    await expect(page.locator('h1')).toContainText(name);
  }
  await page.goto(base + 'explorer/');
  await page.getByLabel('Rechercher un pays').fill('Niger');
  await expect(page.locator('.section .country-strip a').filter({ hasText: /Niger/ })).toHaveCount(
    2,
  );
  await page.goto(base + 'contribuer/');
  const select = page.getByLabel('Pays', { exact: true });
  for (const iso of ['MLI', 'BFA', 'NER', 'NGA']) {
    await select.selectOption(iso);
    await expect(select).toHaveValue(iso);
  }
  await page.goto(base + 'catalogue/?country=MLI');
  await expect(page.locator('.product-card')).not.toHaveCount(0);
  await expect(page.locator('.product-card').filter({ hasText: 'Soumbala' })).toHaveCount(1);
});
test('FR EN AR interface, Arabic names and mixed-direction forms preserve navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('One product');
  await page.getByRole('button', { name: 'AR', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toContainText('منتج واحد');
  await page.locator('header nav a[href*="contribuer/"]').click();
  await expect(page).toHaveURL(/lang=ar/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await page.getByLabel('الاسم المحلي', { exact: true }).fill('اسم محلي — Niger');
  await expect(page.getByLabel('الاسم المحلي', { exact: true })).toHaveAttribute('dir', 'auto');
  await expect(page.getByLabel('مصدر الصورة')).toHaveAttribute('dir', 'ltr');
  await page.getByLabel('البلد', { exact: true }).selectOption('NER');
  await expect(page.getByLabel('البلد', { exact: true })).toHaveValue('NER');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(base + 'produits/gombo/?lang=ar');
  await expect(page.locator('h1')).toContainText('بامية');
  await expect(page.locator('.names-panel bdi').first()).toBeVisible();
  await expect(page.locator('.names-panel table')).toBeVisible();
  await page.goto(base + 'catalogue/?lang=ar');
  await page.getByLabel('الشكل', { exact: true }).selectOption('poudre');
  await expect(page).toHaveURL(/form=poudre/);
  await expect(page).toHaveURL(/lang=ar/);
  await expect(page.locator('.product-card')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByLabel('Form', { exact: true })).toHaveValue('poudre');
  await page.getByRole('button', { name: 'FR', exact: true }).click();
  await expect(page.getByLabel('Forme', { exact: true })).toHaveValue('poudre');
  await page.goto(base + 'produits/gombo/?lang=ar');
  await page.getByRole('button', { name: 'FR', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('h1')).toContainText('Gombo');
  expect(errors).toEqual([]);
});
test('photograph matches powder form and missing shop photographs are explicit', async ({
  page,
}) => {
  await page.goto(base + 'produits/curcuma/');
  await expect(page.locator('.photo-open img')).toHaveAttribute('src', /curcuma-shop-960.webp/);
  await expect(page.locator('.shop-guide')).toContainText('poudre');
  await expect(page.locator('.photo-credit')).toContainText('CC BY-SA');
  await page.goto(base + 'produits/menthe/');
  await expect(page.locator('.product-hero .photo-gap')).toContainText('à documenter');
  await expect(page.locator('.product-hero .photo-open img')).toHaveCount(0);
  await page.goto(base + 'produits/njansang/');
  await expect(page.locator('.photo-open img')).toHaveAttribute('src', /njansang-shop/);
  await expect(page.locator('.source-cards')).toContainText('Espace Taï');
  await page.goto(base + 'pays/mar/');
  await page.locator('.region-list button').filter({ hasText: /Rabat/ }).click();
  await expect(page.locator('.region-result')).toContainText('Kasbour');
  await page.goto(base + 'pays/mli/');
  await expect(page.locator('.region-list button')).toHaveCount(9);
  await expect(page.locator('.table-note').first()).toContainText('2021');
});
test('email partnership contact and private moderation remain honest', async ({ page }) => {
  await page.goto(base + 'contact/');
  await expect(page.getByRole('link', { name: 'Contacter le créateur par email' })).toHaveAttribute(
    'href',
    /^mailto:minlangrayan@gmail.com\?subject=/,
  );
  await expect(page.getByRole('link', { name: 'minlangrayan@gmail.com' })).toHaveAttribute(
    'href',
    'mailto:minlangrayan@gmail.com',
  );
  await page.goto(base + 'moderation/');
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeDisabled();
  await expect(page.locator('.notice')).toContainText('Service non configuré');
  await page.goto(base + 'catalogue/?q=zzzzzzintrouvable');
  await expect(page.locator('.empty-state a[href*="contribuer"]')).toBeVisible();
});
