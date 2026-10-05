import { createRemoteJWKSet, jwtVerify } from 'jose';

const keySets = new Map();
const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "frame-ancestors 'none'",
};
function failure(status, message) {
  return Response.json({ error: message }, { status, headers: privateHeaders });
}
function configuration(env) {
  const issuer = new URL(env.ADMIN_ACCESS_ISSUER);
  if (
    issuer.protocol !== 'https:' ||
    !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer.hostname) ||
    issuer.username ||
    issuer.password ||
    issuer.port ||
    issuer.pathname !== '/' ||
    issuer.search ||
    issuer.hash ||
    !env.ADMIN_ACCESS_AUD ||
    !env.ADMIN_OWNER_EMAIL
  )
    throw new Error('Configuration');
  return {
    issuer: issuer.origin,
    audience: env.ADMIN_ACCESS_AUD,
    email: env.ADMIN_OWNER_EMAIL.toLowerCase().trim(),
  };
}
export async function verifyAccess(request, env, dependencies = {}) {
  let settings;
  try {
    settings = configuration(env);
  } catch {
    return failure(503, 'Administration non configurée.');
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 8192) return failure(401, 'Authentification requise.');
  try {
    let keys = dependencies.keys;
    if (!keys) {
      if (!keySets.has(settings.issuer))
        keySets.set(
          settings.issuer,
          createRemoteJWKSet(new URL(`${settings.issuer}/cdn-cgi/access/certs`), {
            timeoutDuration: 5000,
          }),
        );
      keys = keySets.get(settings.issuer);
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer: settings.issuer,
      audience: settings.audience,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'],
      clockTolerance: 5,
      maxTokenAge: '1h',
    });
    if (payload.email?.toLowerCase() !== settings.email || payload.type !== 'app')
      return failure(403, 'Accès réservé au propriétaire.');
    return payload;
  } catch {
    return failure(401, 'Authentification invalide ou expirée.');
  }
}
async function boundedJSON(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('JSON');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Body');
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32768) throw new Error('Size');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(joined));
}
function supabase(env, transport, requestOrigin) {
  const origin = new URL(env.SUPABASE_URL);
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    !env.SUPABASE_ANON_KEY
  )
    throw new Error('Backend');
  return async (path, token, options = {}) => {
    const response = await transport(`${origin.origin}${path}`, {
      ...options,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
        Origin: requestOrigin,
      },
    });
    return {
      ok: response.ok,
      status: response.status,
      data: await response.json().catch(() => null),
    };
  };
}
async function owner(api, token, email) {
  if (!token || token.length > 8192) return 401;
  const user = await api('/auth/v1/user', token);
  if (!user.ok || !user.data?.id) return 401;
  if (user.data.email?.toLowerCase() !== email.toLowerCase()) return 403;
  const role = await api('/rest/v1/rpc/is_afroatlas_owner', token, { method: 'POST', body: '{}' });
  return role.ok && role.data === true ? 200 : 403;
}
/** Cloudflare Access authenticates the page; Supabase also verifies ownership on every API call. */
export async function handleAdminRequest(context, settings, dependencies = {}) {
  const { request, env } = context;
  const path = new URL(request.url).pathname;
  const base = settings.basePath.replace(/\/$/, '');
  const panel = `${base}/moderation`;
  const apiRoot = `${base}/api/admin`;
  const isPanel = path === panel || path.startsWith(`${panel}/`);
  const isAPI = path === apiRoot || path.startsWith(`${apiRoot}/`);
  if (!isPanel && !isAPI) return env.ASSETS.fetch(request);
  const identity = await verifyAccess(request, env, dependencies);
  if (identity instanceof Response) return identity;
  if (isPanel) {
    if (![panel, `${panel}/`].includes(path)) return failure(404, 'Page introuvable.');
    if (!['GET', 'HEAD'].includes(request.method)) return failure(405, 'Méthode refusée.');
    return new Response(request.method === 'HEAD' ? null : settings.panelHTML, {
      headers: { ...privateHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  if (!['GET', 'POST'].includes(request.method)) return failure(405, 'Méthode refusée.');
  if (
    request.method === 'POST' &&
    (request.headers.get('Origin') !== new URL(request.url).origin ||
      request.headers.get('Sec-Fetch-Site') === 'cross-site')
  )
    return failure(403, 'Origine refusée.');
  let api;
  try {
    api = supabase(env, dependencies.fetch || fetch, new URL(request.url).origin);
  } catch {
    return failure(503, 'Service de modération non configuré.');
  }
  try {
    const action = path.slice(apiRoot.length);
    let token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (action === '/login' && request.method === 'POST') {
      const credentials = await boundedJSON(request);
      if (
        typeof credentials.email !== 'string' ||
        typeof credentials.password !== 'string' ||
        credentials.password.length > 256 ||
        credentials.email.toLowerCase() !== identity.email.toLowerCase()
      )
        return failure(403, 'Accès réservé au propriétaire.');
      const result = await api('/auth/v1/token?grant_type=password', null, {
        method: 'POST',
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
      token = result.data?.access_token;
      if (!result.ok || !token) return failure(401, 'Connexion refusée.');
      const status = await owner(api, token, identity.email);
      if (status !== 200) return failure(status, 'Connexion propriétaire refusée.');
      // No refresh token, persistent browser storage or server service-role key is exposed.
      return Response.json({ access_token: token }, { headers: privateHeaders });
    }
    const status = await owner(api, token, identity.email);
    if (status !== 200) return failure(status, 'Permission administrative requise.');
    let result;
    if (action === '/contributions' && request.method === 'GET') {
      result = await api(
        '/rest/v1/contributions?select=*,contribution_notifications(state,attempts,error_code)&order=created_at.desc',
        token,
      );
    } else if (action === '/review' && request.method === 'POST') {
      result = await api('/functions/v1/moderate-contribution', token, {
        method: 'POST',
        body: JSON.stringify(await boundedJSON(request)),
      });
    } else if (/^\/photos\/[0-9a-f-]{36}$/.test(action) && request.method === 'GET') {
      const id = action.slice('/photos/'.length);
      const row = await api(`/rest/v1/contributions?id=eq.${id}&select=photo_path`, token);
      if (!row.ok || !row.data?.[0]?.photo_path) return failure(404, 'Photographie introuvable.');
      result = await api(
        `/storage/v1/object/sign/afroatlas-pending/${encodeURIComponent(row.data[0].photo_path)}`,
        token,
        {
          method: 'POST',
          body: '{"expiresIn":300}',
        },
      );
      if (result.ok && typeof result.data?.signedURL === 'string') {
        const url = new URL(
          `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1${result.data.signedURL}`,
        );
        if (url.origin !== new URL(env.SUPABASE_URL).origin) throw new Error('Photo URL');
        result.data = { url: url.href };
      }
    } else return failure(404, 'Action introuvable.');
    if (!result.ok)
      return failure(
        result.status >= 500 ? 502 : result.status,
        'Action refusée par le service de modération.',
      );
    return Response.json(result.data, { headers: privateHeaders });
  } catch {
    return failure(400, 'Requête invalide ou service indisponible.');
  }
}
