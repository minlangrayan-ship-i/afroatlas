import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const signatures = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{20,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/,
  /\bre_[A-Za-z0-9_-]{20,}\b/,
];
function inspect(text, file) {
  if (signatures.some((pattern) => pattern.test(text)))
    throw new Error(`Possible secret in ${file} (value suppressed)`);
  for (const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString());
      if (payload.role === 'service_role') throw new Error('Privileged token');
    } catch (error) {
      if (error.message === 'Privileged token')
        throw new Error(`Privileged token in ${file} (value suppressed)`);
    }
  }
}
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
for (const file of tracked) {
  if (
    (/(^|\/)\.env(\.|$)/.test(file) && !file.endsWith('.env.example')) ||
    /\.(pem|key|p12|pfx|bundle)$/.test(file) ||
    /(^|\/)(credentials|service-account)[^/]*\.json$/.test(file)
  )
    throw new Error(`Confidential file tracked: ${file}`);
  inspect(await readFile(file, 'utf8'), file);
}
let javascript = 0;
async function checkBuild(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (
      /^(src|supabase|node_modules|scripts|\.git|\.env.*)$/.test(entry.name) ||
      /\.(map|tsx?|sql|pem|key|p12|pfx|bundle)$/.test(entry.name)
    )
      throw new Error(`Source or confidential file in build: ${file}`);
    if (entry.isDirectory()) {
      await checkBuild(file);
      continue;
    }
    const text = await readFile(file, 'utf8');
    inspect(text, file);
    if (entry.name.endsWith('.js')) {
      javascript++;
      if (/\/\/[#@]\s*sourceMappingURL\s*=/.test(text))
        throw new Error(`Public source map reference: ${file}`);
      if (
        [
          'SUPABASE_SERVICE_ROLE_KEY',
          'RATE_LIMIT_SALT',
          'RESEND_API_KEY',
          'RESEND_WEBHOOK_SECRET',
          'NOTIFICATION_CRON_SECRET',
          'CONTRIBUTIONS_RECIPIENT_EMAIL',
          'Deno.serve',
          'ADMIN_ACCESS_ISSUER',
          'CLOUDFLARE_API_TOKEN',
        ].some((value) => text.includes(value))
      )
        throw new Error(`Server-only implementation in frontend: ${file}`);
    }
  }
}
await checkBuild('dist');
if (!javascript) throw new Error('No production JavaScript found');
console.log(
  `Checked ${tracked.length} tracked files and ${javascript} frontend bundles: no recognized secrets, public source maps or server implementation detected. Heuristic checks do not guarantee absence of every possible secret.`,
);
