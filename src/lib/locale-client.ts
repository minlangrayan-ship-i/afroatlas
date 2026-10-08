import { translate, type Locale } from './i18n';
import { builtLocale, localizedPath } from './links';
const originals = new WeakMap<Text, { original: string; last: string }>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();
let locale: Locale = 'fr',
  scheduled = false;
const excluded =
  'script,style,astro-island,[data-no-translate],.scientific,.evidence-locator,.photo-credit,.hero-credit,.geo-credit,.card-names';
function apply() {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.locale === locale));
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    if (text.parentElement?.closest(excluded) || !text.textContent?.trim()) continue;
    const previous = originals.get(text);
    const original = previous && previous.last === text.data ? previous.original : text.data;
    const translated = translate(original, locale);
    const next = translated;
    originals.set(text, { original, last: next });
    if (text.data !== next) text.data = next;
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-product-label]')) {
    if (el.closest('astro-island')) continue;
    const value = el.dataset[locale] || '';
    const next =
      value ||
      (locale === 'ar'
        ? 'الاسم العربي غير موثق'
        : locale === 'en'
          ? 'English name not documented'
          : 'Nom français non documenté');
    if (el.textContent !== next) el.textContent = next;
    el.dir = 'auto';
  }
  for (const el of document.querySelectorAll('[placeholder],[aria-label],[title]')) {
    if (el.closest(excluded)) continue;
    const map = attributeOriginals.get(el) || new Map<string, string>();
    for (const key of ['placeholder', 'aria-label', 'title']) {
      if (!el.hasAttribute(key)) continue;
      if (!map.has(key)) map.set(key, el.getAttribute(key)!);
      const next = translate(map.get(key)!, locale);
      if (el.getAttribute(key) !== next) el.setAttribute(key, next);
    }
    attributeOriginals.set(el, map);
  }
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (a.closest('astro-island')) continue;
    const url = new URL(a.href);
    if (
      url.origin === location.origin &&
      url.pathname.startsWith(import.meta.env.BASE_URL) &&
      !url.pathname.match(/\.(json|webp|pdf|svg|png|jpg|mp4|vtt)$/)
    ) {
      url.searchParams.delete('lang');
      url.pathname = localizedPath(url.pathname, locale);
      if (a.href !== url.href) a.href = url.href;
    }
  }
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    observer.disconnect();
    apply();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['ssr'],
    });
  });
}
const observer = new MutationObserver(schedule);
const built = builtLocale() as Locale;
// Pages exist in every interface language, except the error page translated in place.
const translatedRoutes = !document.querySelector('meta[name="afroatlas-untranslated"]');
function remember(value: Locale) {
  try {
    localStorage.setItem('afroatlas:locale', value);
  } catch {}
}
function navigate(value: Locale) {
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  url.pathname = localizedPath(url.pathname, value);
  if (url.href !== location.href) location.replace(url.href);
}
function setLocale(value: string) {
  locale = ['fr', 'en', 'ar'].includes(value) ? (value as Locale) : 'fr';
  remember(locale);
  if (translatedRoutes && locale !== built) return navigate(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  const url = new URL(location.href);
  if (locale === built) url.searchParams.delete('lang');
  else url.searchParams.set('lang', locale);
  history.replaceState({}, '', url);
  schedule();
  window.dispatchEvent(new CustomEvent('afroatlas-locale', { detail: locale }));
}
function start() {
  let saved = '';
  try {
    saved = localStorage.getItem('afroatlas:locale') || '';
  } catch {}
  // An explicit ?lang= wins; otherwise a page opened from a link keeps its own language,
  // except a French page for a visitor who chose English or Arabic before.
  const requested = new URLSearchParams(location.search).get('lang');
  setLocale(requested || (built === 'fr' && saved ? saved : built));
  document
    .querySelectorAll<HTMLButtonElement>('[data-locale]')
    .forEach((b) => b.addEventListener('click', () => setLocale(b.dataset.locale!)));
  window.addEventListener('popstate', () =>
    setLocale(new URLSearchParams(location.search).get('lang') || built),
  );
}
locale = built;
// Module scripts run once the document is parsed: redirect and accept clicks right away.
start();
