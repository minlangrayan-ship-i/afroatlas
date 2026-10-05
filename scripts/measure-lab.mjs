import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4321/afroatlas/';
const before = process.env.PLAYWRIGHT_BEFORE_BASE_URL;
const variants = before
  ? [
      { variant: 'before', url: before },
      { variant: 'after', url: base },
    ]
  : [{ variant: 'after', url: base }];
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const measurements = [];
for (const width of [390, 1440]) {
  for (const route of ['', 'produits/gombo/', 'catalogue/']) {
    for (let run = 1; run <= 3; run++) {
      for (const variant of variants) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.__lab = { lcp: null, cls: 0 };
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) window.__lab.lcp = e.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) if (!e.hadRecentInput) window.__lab.cls += e.value;
          }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(new URL(route, variant.url).href, { waitUntil: 'load' });
        await page.waitForTimeout(1500);
        measurements.push({
          width,
          route,
          run,
          variant: variant.variant,
          ...(await page.evaluate(() => ({
            ...window.__lab,
            domContentLoaded:
              performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,
            jsBytes: performance
              .getEntriesByType('resource')
              .filter(
                (r) =>
                  new URL(r.name).pathname.endsWith('.js') &&
                  new URL(r.name).origin === location.origin,
              )
              .reduce((n, r) => n + r.encodedBodySize, 0),
            mediaBytes: performance
              .getEntriesByType('resource')
              .filter((r) => r.initiatorType === 'video')
              .reduce((n, r) => n + r.transferSize, 0),
          }))),
        });
        await context.close();
      }
    }
    console.log(
      `Measured ${width}px ${route || 'home'} (${variants.length} variant(s), 3 samples each)`,
    );
  }
}
await browser.close();
await mkdir('.runtime', { recursive: true });
const destination = process.argv[2] || '.runtime/performance.json';
await writeFile(
  destination,
  JSON.stringify(
    {
      protocol:
        'v2: Edge headless, local production preview, fresh context, no network/CPU throttling, reduced motion, 1.5s observation after load, 3 samples; interleaved baseline/current when configured; JS bytes include every same-origin .js resource regardless of initiator; laboratory only, no field INP',
      base,
      before,
      measurements,
    },
    null,
    2,
  ),
);
console.log(destination);
