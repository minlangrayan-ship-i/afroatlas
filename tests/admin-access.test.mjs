import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { handleAdminRequest } from '../server/access-admin.mjs';

const env = {
  ADMIN_ACCESS_ISSUER: 'https://afroatlas-test.cloudflareaccess.com',
  ADMIN_ACCESS_AUD: 'test-application-audience',
  ADMIN_OWNER_EMAIL: 'owner@example.test',
  SUPABASE_URL: 'https://backend.example.test',
  SUPABASE_ANON_KEY: 'test-public-key',
};
const settings = { basePath: '/afroatlas', panelHTML: '<h1>Private panel</h1>' };
let privateKey, otherKey, keys;
beforeAll(async () => {
  ({ privateKey, publicKey: keys } = await generateKeyPair('RS256'));
  otherKey = (await generateKeyPair('RS256')).privateKey;
  const jwk = await exportJWK(keys);
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';
  keys = createLocalJWKSet({ keys: [jwk] });
});
async function access(overrides = {}, key = privateKey) {
  return new SignJWT({ email: env.ADMIN_OWNER_EMAIL, type: 'app', ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(env.ADMIN_ACCESS_ISSUER)
    .setAudience(env.ADMIN_ACCESS_AUD)
    .setSubject('test-owner')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}
async function jwt(options = {}) {
  return new SignJWT({ email: env.ADMIN_OWNER_EMAIL, type: 'app', ...options.payload })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(options.issuer || env.ADMIN_ACCESS_ISSUER)
    .setAudience(options.audience || env.ADMIN_ACCESS_AUD)
    .setSubject('test-owner')
    .setIssuedAt()
    .setExpirationTime(options.expiry || '1h')
    .sign(privateKey);
}
function upstream({ owner = true, valid = true, email = env.ADMIN_OWNER_EMAIL } = {}) {
  return vi.fn(async (url) => {
    if (url.includes('/auth/v1/token'))
      return Response.json({ access_token: 'user-jwt', refresh_token: 'never-return' });
    if (url.endsWith('/auth/v1/user'))
      return Response.json(valid ? { id: 'test-user', email } : {}, { status: valid ? 200 : 401 });
    if (url.endsWith('/rpc/is_afroatlas_owner')) return Response.json(owner);
    if (url.includes('select=photo_path'))
      return Response.json([{ photo_path: 'private/photo.webp' }]);
    if (url.includes('/storage/'))
      return Response.json({
        signedURL: '/object/sign/afroatlas-pending/private/photo.webp?token=test',
      });
    if (url.includes('/functions/')) return Response.json({ status: 'accepted' });
    return Response.json([{ id: 'proposal', status: 'pending' }]);
  });
}
function run(
  path,
  {
    token,
    method = 'GET',
    body,
    origin = 'https://site.example.test',
    authorization,
    backend = upstream(),
    runtime = env,
  } = {},
) {
  const assets = vi.fn(async () => new Response('Public page'));
  const request = new Request(`https://site.example.test${path}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    headers: {
      ...(token ? { 'Cf-Access-Jwt-Assertion': token } : {}),
      ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}),
      ...(method === 'POST' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
    },
  });
  return {
    response: handleAdminRequest(
      { request, env: { ...runtime, ASSETS: { fetch: assets } } },
      settings,
      { keys, fetch: backend },
    ),
    assets,
    backend,
  };
}
describe('server-protected administrative pages and API', () => {
  it('keeps public pages available without credentials', async () => {
    const result = run('/afroatlas/produits/gombo/');
    expect((await result.response).status).toBe(200);
    expect(result.assets).toHaveBeenCalledOnce();
    expect(result.backend).not.toHaveBeenCalled();
  });
  it.each([
    '/afroatlas/moderation/',
    '/afroatlas/moderation/index.html',
    '/afroatlas/api/admin/contributions',
    '/afroatlas/api/admin/review',
  ])('rejects anonymous access to %s', async (path) => {
    const result = run(path);
    expect((await result.response).status).toBe(401);
    expect(result.assets).not.toHaveBeenCalled();
    expect(result.backend).not.toHaveBeenCalled();
  });
  it('fails closed when Access configuration is missing', async () => {
    expect((await run('/afroatlas/moderation/', { runtime: {} }).response).status).toBe(503);
  });
  it('rejects an unsigned or forged header', async () => {
    expect((await run('/afroatlas/moderation/', { token: 'forged-token' }).response).status).toBe(
      401,
    );
    expect(
      (await run('/afroatlas/moderation/', { token: await access({}, otherKey) }).response).status,
    ).toBe(401);
  });
  it.each([
    { expiry: '-1h' },
    { issuer: 'https://attacker.example.test' },
    { audience: 'another-app' },
  ])('rejects incorrect claims %j', async (options) => {
    expect(
      (await run('/afroatlas/moderation/', { token: await jwt(options) }).response).status,
    ).toBe(401);
  });
  it('rejects a correctly signed account outside the owner policy', async () => {
    expect(
      (
        await run('/afroatlas/moderation/', {
          token: await access({ email: 'visitor@example.test' }),
        }).response
      ).status,
    ).toBe(403);
  });
  it('serves owner HTML without caching or indexing and handles HEAD', async () => {
    const token = await access();
    const response = await run('/afroatlas/moderation/', { token }).response;
    expect(await response.text()).toContain('Private panel');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    expect(
      await (await run('/afroatlas/moderation/', { token, method: 'HEAD' }).response).text(),
    ).toBe('');
  });
  it.each([{ valid: false }, { owner: false }, { email: 'other@example.test' }])(
    'refuses API access unless Supabase authenticates the owner: %j',
    async (options) => {
      const result = run('/afroatlas/api/admin/contributions', {
        token: await access(),
        authorization: 'user-jwt',
        backend: upstream(options),
      });
      expect([401, 403]).toContain((await result.response).status);
      expect(
        result.backend.mock.calls.some(([url]) => url.includes('/rest/v1/contributions?')),
      ).toBe(false);
    },
  );
  it('does not allow an Access cookie alone to authorize an API', async () => {
    expect(
      (await run('/afroatlas/api/admin/contributions', { token: await access() }).response).status,
    ).toBe(401);
  });
  it('checks ownership for listing and signing a private photo', async () => {
    const token = await access();
    const backend = upstream();
    expect(
      (
        await run('/afroatlas/api/admin/contributions', {
          token,
          authorization: 'user-jwt',
          backend,
        }).response
      ).status,
    ).toBe(200);
    const photo = await run('/afroatlas/api/admin/photos/00000000-0000-4000-8000-000000000000', {
      token,
      authorization: 'user-jwt',
      backend,
    }).response;
    expect((await photo.json()).url).toMatch(
      /^https:\/\/backend.example.test\/storage\/v1\/object\/sign/,
    );
    expect(
      backend.mock.calls.filter(([url]) => url.endsWith('/rpc/is_afroatlas_owner')),
    ).toHaveLength(2);
  });
  it('allows owner login without returning a refresh token', async () => {
    const response = await run('/afroatlas/api/admin/login', {
      token: await access(),
      method: 'POST',
      body: { email: env.ADMIN_OWNER_EMAIL, password: 'test-password' },
    }).response;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ access_token: 'user-jwt' });
  });
  it('refuses cross-origin review requests before accessing the backend', async () => {
    const result = run('/afroatlas/api/admin/review', {
      token: await access(),
      method: 'POST',
      origin: 'https://attacker.example.test',
      authorization: 'user-jwt',
      body: {},
    });
    expect((await result.response).status).toBe(403);
    expect(result.backend).not.toHaveBeenCalled();
  });
  it('forwards an owner review to the server moderation function', async () => {
    const result = run('/afroatlas/api/admin/review', {
      token: await access(),
      method: 'POST',
      authorization: 'user-jwt',
      body: { decision: 'accept' },
    });
    expect((await result.response).status).toBe(200);
    expect(
      result.backend.mock.calls.some(([url]) =>
        url.endsWith('/functions/v1/moderate-contribution'),
      ),
    ).toBe(true);
    const review = result.backend.mock.calls.find(([url]) =>
      url.endsWith('/functions/v1/moderate-contribution'),
    );
    expect(review[1].headers.Origin).toBe('https://site.example.test');
    expect(review[1].headers.Authorization).toBe('Bearer user-jwt');
  });
  it('rejects oversized bodies and arbitrary proxy destinations', async () => {
    const token = await access();
    expect(
      (
        await run('/afroatlas/api/admin/review', {
          token,
          method: 'POST',
          authorization: 'user-jwt',
          body: { note: 'x'.repeat(40000) },
        }).response
      ).status,
    ).toBe(400);
    expect(
      (
        await run('/afroatlas/api/admin/service-role', { token, authorization: 'user-jwt' })
          .response
      ).status,
    ).toBe(404);
  });
});
