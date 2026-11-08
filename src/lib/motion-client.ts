// Scroll reveals, header behaviour, image fade-in and the photo hand-off between pages.
// Nothing here is needed to read or use the site: without it, pages simply appear as they are.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function header() {
  const el = document.querySelector<HTMLElement>('.site-header');
  if (!el) return;
  let last = scrollY;
  let queued = false;
  const update = () => {
    const y = scrollY;
    el.classList.toggle('is-scrolled', y > 8);
    // Slide away while reading down, come back as soon as the visitor scrolls up.
    if (y > 180 && y > last + 6 && !el.contains(document.activeElement))
      el.classList.add('is-hidden');
    else if (y < last - 6 || y <= 180) el.classList.remove('is-hidden');
    last = y;
    queued = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  el.addEventListener('focusin', () => el.classList.remove('is-hidden'));
  update();
}

// Only what starts below the fold is hidden, so nothing visible ever flashes.
const revealed = [
  'main > section',
  'main > article',
  'main .section-header',
  '.category-card',
  '.page-body > *',
  '.prose > h2',
  '.prose > p',
  '.prose > dl',
  '.prose > ol',
  '.grocery-label',
  '.footer-top > div',
].join(',');
function reveal() {
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const fold = innerHeight * 0.95;
  const all = [...document.querySelectorAll<HTMLElement>(revealed)].filter(
    (el) => !el.closest('astro-island') && el.getBoundingClientRect().top > fold,
  );
  // Reveal the innermost listed elements, so a section and its cards do not animate twice.
  const targets = all.filter((el) => !all.some((other) => other !== el && el.contains(other)));
  if (!targets.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
    },
    { rootMargin: '0px 0px -6% 0px' },
  );
  for (const el of targets) {
    const siblings = el.parentElement ? [...el.parentElement.children] : [];
    el.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
    el.dataset.reveal = '';
    observer.observe(el);
  }
  document.documentElement.classList.add('motion-ready');
}

function fadeImages() {
  if (reduced.matches) return;
  for (const img of document.querySelectorAll<HTMLImageElement>('main img')) {
    if (img.complete) continue;
    img.classList.add('is-loading');
    const done = () => {
      img.classList.add('is-loaded');
      img.classList.remove('is-loading');
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }
}

// Before leaving for a record, name the photo that was clicked so it grows into the record's
// main photo (the record page names its own photo in CSS).
addEventListener('pageswap', (event) => {
  const { viewTransition, activation } = event;
  const url = activation?.entry?.url;
  if (!viewTransition || !url) return;
  const target = new URL(url).pathname;
  const link = [...document.querySelectorAll<HTMLAnchorElement>('a.card-photo')].find(
    (a) => new URL(a.href).pathname === target,
  );
  const photo = link?.querySelector('img');
  if (!photo) return;
  document
    .querySelectorAll<HTMLElement>('.photo-open img')
    .forEach((img) => (img.style.viewTransitionName = 'none'));
  photo.style.viewTransitionName = 'product-photo';
});

header();
reveal();
fadeImages();
