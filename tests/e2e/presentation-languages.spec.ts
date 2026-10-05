import { test, expect } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';

test.beforeEach(async ({ page }) => {
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.setViewportSize({ width: 390, height: 844 });
});

for (const locale of ['en', 'ar']) {
  test(`direct ${locale} presentation plays only the selected film on mobile`, async ({ page }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.endsWith('.mp4')) requests.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + `presentation/?lang=${locale}`);
    const video = page.locator('video');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(video).toHaveAttribute('lang', locale);
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(page.locator('video source')).toHaveAttribute(
      'src',
      new RegExp(`presentation-${locale}\\.mp4$`),
    );
    await expect(video).toHaveAttribute(
      'poster',
      new RegExp(`presentation-${locale}-poster\\.webp$`),
    );
    await expect(page.locator('[data-presentation-open]')).toHaveCount(2);
    for (const link of await page.locator('[data-presentation-open]').all())
      await expect(link).toHaveAttribute('href', new RegExp(`presentation-${locale}\\.mp4$`));
    await expect(page.locator('video track')).toHaveCount(0);
    expect(await video.getAttribute('autoplay')).toBeNull();
    expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
    await video.click();
    await video.evaluate(async (element: HTMLVideoElement) => {
      await element.play();
    });
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
      .toBeGreaterThan(0);
    expect(await video.evaluate((element: HTMLVideoElement) => element.currentSrc)).toContain(
      `presentation-${locale}.mp4`,
    );
    expect(await video.evaluate((element: HTMLVideoElement) => element.duration)).toBeCloseTo(
      77,
      0,
    );
    expect(await video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBe(1280);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every((url) => url.includes(`presentation-${locale}.mp4`))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}

test('changing languages stops the previous video, updates links and restores the French track', async ({
  page,
}) => {
  await page.goto(base + 'presentation/?lang=en');
  const video = page.locator('video');
  await video.click();
  await video.evaluate(async (element: HTMLVideoElement) => {
    await element.play();
  });
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'AR', exact: true }).click();
  await expect(page.locator('video source')).toHaveAttribute('src', /presentation-ar\.mp4$/);
  await expect(video).toHaveAttribute('aria-label', 'فيديو تقديم أفروأطلس');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
    .toBe(0);
  await expect(page.locator('video track')).toHaveCount(0);
  await expect(page.locator('.prose [data-presentation-open]')).toHaveAttribute(
    'href',
    /presentation-ar\.mp4$/,
  );
  await page.getByRole('button', { name: 'FR', exact: true }).click();
  await expect(page.locator('video source')).toHaveAttribute('src', /presentation\.mp4$/);
  await expect(page.locator('video track')).toHaveAttribute('srclang', 'fr');
  await expect(video).toHaveAttribute('poster', /presentation-poster\.webp$/);
  await expect(page.locator('.prose [data-presentation-open]')).toHaveAttribute(
    'href',
    /presentation\.mp4$/,
  );
});

test('home preview follows the saved language without downloading videos', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('.mp4')) requests.push(request.url());
  });
  await page.goto(base);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('.video-preview img')).toHaveAttribute(
    'src',
    /presentation-en-poster\.webp$/,
  );
  await page.getByRole('button', { name: 'AR', exact: true }).click();
  await expect(page.locator('.video-preview img')).toHaveAttribute(
    'src',
    /presentation-ar-poster\.webp$/,
  );
  await page.goto(base);
  await expect(page.locator('.video-preview img')).toHaveAttribute(
    'src',
    /presentation-ar-poster\.webp$/,
  );
  await expect(page.locator('.video-preview')).toHaveAttribute('href', /presentation\/\?lang=ar$/);
  expect(requests).toEqual([]);
  await page.locator('.video-preview').click();
  await expect(page.locator('video source')).toHaveAttribute('src', /presentation-ar\.mp4$/);
});
