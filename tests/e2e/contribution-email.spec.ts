import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
test('the mobile email form uploads a real photograph and only reports provider acceptance', async ({
  page,
}) => {
  const requests: Buffer[] = [];
  let accepted = false;
  await page.route('https://formsubmit.co/ajax/**', async (route) => {
    requests.push(route.request().postDataBuffer()!);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        accepted
          ? { success: 'true' }
          : { success: 'false', message: 'This form needs Activation.' },
      ),
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'contribuer/?product=gombo&lang=fr');
  await page.getByLabel('Nom local', { exact: true }).fill('Appellation test — اسم');
  await page.getByLabel('Pays', { exact: true }).selectOption('MLI');
  await page.locator('.contribution-optional summary').click();
  const bytes = await readFile('public/images/gombo-poudre-coverage-400.webp');
  await page
    .getByLabel('Photographie facultative')
    .setInputFiles({ name: 'photo.webp', mimeType: 'image/webp', buffer: bytes });
  await page
    .getByLabel('Source de la photographie', { exact: true })
    .fill('https://commons.wikimedia.org/wiki/File:Okra_powder.jpg');
  await page.getByLabel('Licence de la photographie', { exact: true }).selectOption('CC BY-SA 4.0');
  await page.getByLabel('J’accepte la transmission', { exact: false }).check();
  await page.getByRole('button', { name: 'Envoyer ma contribution par email' }).click();
  await expect(page.locator('.action-message')).toContainText('doit activer');
  await expect(page.getByLabel('Nom local', { exact: true })).toHaveValue('Appellation test — اسم');
  await expect(page.locator('.upload-preview img')).toBeVisible();
  expect(requests[0].includes(bytes)).toBe(true);
  expect(requests[0].toString()).toContain('Nom local');
  expect(requests[0].toString()).toContain('Mali (MLI)');
  accepted = true;
  await page.getByRole('button', { name: 'Envoyer ma contribution par email' }).click();
  await expect(page.locator('.action-message')).toContainText(
    'Livraison dans la boîte mail non confirmée',
  );
  await expect(page.locator('.action-message bdi')).toHaveText(/[a-f0-9-]{36}/);
  await expect(page.getByLabel('Nom local', { exact: true })).toHaveValue('');
  expect(await page.getByLabel('Photographie facultative').inputValue()).toBe('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'AR', exact: true }).click();
  await expect(page.getByRole('button', { name: 'أرسل مساهمتي بالبريد الإلكتروني' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
