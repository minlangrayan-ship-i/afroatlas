import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const date = new Date().toISOString().slice(0, 10);
export const agent =
  'AfroAtlas/0.1 (open-data educational prototype; https://github.com/minlangrayan-ship-i/afroatlas)';
export const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function request(url, { binary = false, cache = true } = {}) {
  await mkdir('data/raw/cache', { recursive: true });
  const file = `data/raw/cache/${createHash('sha256').update(url).digest('hex')}.${binary ? 'bin' : 'json'}`;
  if (cache)
    try {
      const raw = await readFile(file);
      return binary ? raw : JSON.parse(raw.toString());
    } catch {}
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': agent },
        signal: AbortSignal.timeout(45000),
      });
      if (response.status === 429 || response.status >= 500) {
        await pause(
          Math.min(30000, Number(response.headers.get('retry-after') || 2) * 1000 * (attempt + 1)),
        );
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const result = binary ? bytes : JSON.parse(bytes.toString());
      await writeFile(file, bytes);
      await pause(200);
      return result;
    } catch (error) {
      if (attempt === 3) throw error;
      await pause(1000 * (attempt + 1));
    }
  }
  throw new Error(`Retry limit: ${url}`);
}
export const json = async (file, value) => {
  await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + '\n');
};
export const plain = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
/** Paginated collection helper; limits are explicit so a small import never becomes a bulk crawl. */
export async function collectPages({
  urlForPage,
  readItems,
  maxPages = 1,
  maxItems = 5,
  delayMs = 1500,
}) {
  const items = [];
  for (let page = 1; page <= maxPages && items.length < maxItems; page++) {
    const response = await request(urlForPage(page));
    const batch = readItems(response);
    items.push(...batch.slice(0, maxItems - items.length));
    if (!batch.length) break;
    if (page < maxPages && items.length < maxItems) await pause(delayMs);
  }
  return items;
}
