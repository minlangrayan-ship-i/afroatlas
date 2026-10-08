import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const regions = JSON.parse(readFileSync('src/data/published/regions.json', 'utf8')) as {
  id: string;
  countryISO3: string;
  name: string;
}[];
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';

test('mobile foléré to Senegal offers visual forms, keeps context and opens an accessible seller view', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'catalogue/?q=foléré&destination=SEN');
  await expect(page.locator('.choice-intro')).toContainText('Quelle forme');
  await expect(page.locator('.product-card')).toHaveCount(4);
  for (const title of [
    'Calices séchés pour infusion',
    'Feuilles alimentaires',
    'Boisson préparée',
    'Plante entière',
  ])
    await expect(page.locator('.choice-title').filter({ hasText: title })).toBeVisible();
  const cards = page.locator('.product-card');
  for (let i = 0; i < 4; i++) {
    const image = cards.nth(i).locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0))
      .toBe(true);
  }
  await page
    .locator('.product-card')
    .filter({ hasText: 'Calices séchés pour infusion' })
    .getByRole('link', { name: 'Explorer la fiche ↗' })
    .click();
  await expect(page).toHaveURL(/destination=SEN/);
  await expect(page.getByLabel('Pays de l’interlocuteur')).toHaveValue('SEN');
  await expect(page.locator('.seller-result')).toContainText('Aucune appellation locale sourcée');
  await expect(page.locator('.seller-result .form-clarification')).toContainText(
    'n’établit pas leur nom de vente',
  );
  await expect(page.locator('#appellations')).not.toHaveAttribute('open', '');
  const show = page.getByRole('button', { name: 'Montrer au vendeur ↗' });
  await show.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.seller-dialog')).toBeVisible();
  await expect(page.locator('.seller-dialog img')).toBeVisible();
  await expect(page.locator('.seller-dialog')).toContainText('Calices séchés pour infusion');
  await expect(page.locator('.seller-dialog bdi').filter({ hasText: 'foléré' })).toBeVisible();
  await expect(page.locator('.seller-dialog table')).toHaveCount(0);
  await expect(page.locator('.seller-dialog')).toContainText('Nom local non établi');
  await expect(page.locator('.seller-dialog .seller-names li')).toHaveCount(0);
  await expect(page.locator('.seller-dialog')).toContainText('Je cherche ce produit');
  await page.keyboard.press('Escape');
  await expect(page.locator('.seller-dialog')).not.toBeVisible();
  await expect(show).toBeFocused();
  await page.locator('#appellations > summary').click();
  await expect(page.locator('.names-panel table')).toBeVisible();
  expect(await page.locator('main').innerText()).not.toMatch(
    /aliases\.\w+\[|labels\.\w+\.value|commercial_group|\bUses\b/,
  );
  await page.getByRole('link', { name: 'Retour aux résultats ↗' }).click();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await expect(page.getByLabel('Pays de l’interlocuteur')).toHaveValue('SEN');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('language aliases merge, translated regions sort, incompatible country and region selections reset', async ({
  page,
}) => {
  await page.goto(base + 'catalogue/?q=gombo');
  await expect(page.locator('.choice-title')).toHaveCount(2);
  const language = page.getByLabel('Langue', { exact: true });
  for (const label of ['Bassa', 'Douala', 'Ewondo', 'Fang', 'Latin'])
    await expect(
      language.locator('option').filter({ hasText: new RegExp('^' + label + '$') }),
    ).toHaveCount(1);
  await page.getByLabel('Contexte d’appellation').selectOption('CMR');
  await language.selectOption('ewo');
  const centre = regions.find((r) => r.countryISO3 === 'CMR' && r.name === 'Centre')!;
  await page.getByLabel('Région documentée').selectOption(centre.id);
  await expect(language).toHaveValue('');
  await expect(language.locator('option[value="ewo"]')).toHaveCount(0);
  await page.getByLabel('Contexte d’appellation').selectOption('SEN');
  await expect(page.getByLabel('Région documentée')).toHaveValue('');
  await expect(language).toHaveValue('');
  await page.getByLabel('Pays de l’interlocuteur').selectOption('CMR');
  await expect(page.getByLabel('Région de l’interlocuteur').locator('option')).toContainText([
    'Région non précisée',
    'Adamaoua',
    'Centre',
    'Est',
    'Extrême-Nord',
    'Littoral',
    'Nord',
    'Nord-Ouest',
    'Ouest',
    'Sud',
    'Sud-Ouest',
  ]);
  await page.getByLabel('Langue de l’interlocuteur').selectOption('ewo');
  await page.getByLabel('Région de l’interlocuteur').selectOption(centre.id);
  await expect(page.getByLabel('Langue de l’interlocuteur')).toHaveValue('');
  await page.getByLabel('Pays de l’interlocuteur').selectOption('SEN');
  await expect(page.getByLabel('Région de l’interlocuteur')).toHaveValue('');
  await expect(page.getByLabel('Langue de l’interlocuteur')).toHaveValue('');
  await page.goto(base + 'catalogue/?q=zzzzzzintrouvable');
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('.empty-state a[href*="contribuer/"]')).toBeVisible();
});

test('FR EN AR forms, autocomplete context, empty campaigns, favorites and comparison work together', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  for (const [locale, heading] of [
    ['fr', 'Quelle forme'],
    ['en', 'Which form'],
    ['ar', 'أي شكل'],
  ]) {
    await page.goto(base + 'catalogue/?q=folere&destination=SEN&lang=' + locale);
    await expect(page.locator('.choice-intro')).toContainText(heading);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.ad-slot,.inline-ad')).toHaveCount(0);
  }
  await page.goto(base + 'catalogue/?q=gombo&destination=SEN&lang=fr');
  await page
    .locator('.product-card')
    .first()
    .getByRole('button', { name: 'Favori', exact: true })
    .click();
  for (let i = 0; i < 2; i++)
    await page
      .locator('.product-card')
      .nth(i)
      .getByRole('button', { name: 'Comparer', exact: true })
      .click();
  await page.goto(base + 'favoris/?lang=fr');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goto(base + 'comparer/?lang=fr');
  await expect(page.locator('.compare-card')).toHaveCount(2);
  await page.goto(base + 'catalogue/?destination=SEN&lang=en');
  const input = page.getByRole('combobox').first();
  await input.fill('gingembre');
  await page.getByRole('listbox').waitFor();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page).toHaveURL(/destination=SEN/);
  await expect(page).toHaveURL(/\/en\/produits\/gingembre\//);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    base.startsWith('https:')
      ? base + 'en/produits/gingembre/'
      : 'https://minlangrayan-ship-i.github.io/afroatlas/en/produits/gingembre/',
  );
  await expect(page.locator('.ad-slot,.inline-ad')).toHaveCount(0);
  expect(errors).toEqual([]);
});
