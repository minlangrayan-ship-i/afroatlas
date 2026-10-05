export const usageEvents = [
  'internal_search',
  'search_empty',
  'product_open',
  'destination_use',
  'contribution_received',
] as const;
export type UsageEvent = (typeof usageEvents)[number];
/** No search terms, product IDs, locations, contributor fields, persistent ID or URL query. */
export function recordUsage(event: UsageEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('afroatlas-usage', { detail: { event } }));
  if (import.meta.env.PUBLIC_USAGE_METRICS_ENABLED !== 'true') return;
  try {
    if (localStorage.getItem('afroatlas:usage-consent') !== 'yes') return;
  } catch {
    return;
  }
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  void fetch(`${url.replace(/\/$/, '')}/functions/v1/usage-metrics`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}
