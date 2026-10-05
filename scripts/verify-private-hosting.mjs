import assert from 'node:assert/strict';
const site = new URL(process.env.SITE_URL || '');
assert(
  site.protocol === 'https:' && site.hostname !== 'minlangrayan-ship-i.github.io',
  'Use the actual new HTTPS production URL.',
);
assert(!site.hostname.includes('build-check'), 'A test URL is not a production deployment.');
const root = site.href.replace(/\/?$/, '/');
const fetchPage = (path, options = {}) =>
  fetch(new URL(path, root), {
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
    ...options,
  });
for (const path of ['', 'explorer/', 'produits/gombo/', 'presentation/', 'contact/']) {
  const response = await fetchPage(path);
  assert.equal(response.status, 200, `Public page ${path}`);
  assert(
    !response.headers.get('X-Robots-Tag')?.includes('noindex'),
    'Production public page must be indexable',
  );
  const html = await response.text();
  assert(html.includes('<html') && html.includes('rel="canonical"'), 'Public HTML required');
  assert(!html.includes('content="noindex'), `Public editorial page ${path} must be indexable`);
  assert(
    html.includes(`href="${new URL(path, root).href}"`),
    'Canonical must use the real production URL',
  );
}
assert.equal((await fetchPage('sitemap-index.xml')).status, 200);
const robots = await fetch(new URL('/robots.txt', root)).then((r) => r.text());
assert(robots.includes(`${root}sitemap-index.xml`) && !robots.includes('Disallow: /\n'));
for (const path of [
  'moderation',
  'moderation/',
  'moderation/index.html',
  'api/admin/contributions',
  'api/admin/review',
]) {
  for (const forged of [false, true]) {
    const response = await fetchPage(path, {
      headers: forged ? { 'Cf-Access-Jwt-Assertion': 'forged-token' } : {},
    });
    let protectedRoute = [401, 403].includes(response.status);
    if ([302, 303].includes(response.status)) {
      const target = new URL(response.headers.get('Location'), root);
      const issuer = new URL(process.env.ADMIN_ACCESS_ISSUER || '');
      protectedRoute =
        target.origin === issuer.origin && target.pathname.startsWith('/cdn-cgi/access/login');
    }
    assert(protectedRoute, `Admin route ${path} must deny or authenticate, not ${response.status}`);
  }
}
if (process.env.SUPABASE_URL) {
  const url = new URL('/functions/v1/moderate-contribution', process.env.SUPABASE_URL);
  const response = await fetch(url, {
    method: 'POST',
    headers: { Origin: site.origin, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert(
    [401, 403].includes(response.status),
    'Direct moderation API must reject anonymous callers',
  );
}
console.log(
  'Actual production public pages, SEO and anonymous/forged administrative access verified. Owner login, permissions, acceptance and a fresh deployment must also be tested before changing repository visibility.',
);
