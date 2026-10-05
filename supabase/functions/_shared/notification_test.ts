import { emailPayload, sendEmail, notifyContribution } from './notification.ts';
import { proposalSchema } from './validation.ts';
import { verifyMailWebhook } from './webhook.ts';
import { Webhook } from 'npm:svix@2.6.1';
import { sanitizePhoto } from './photo.ts';
function assert(value: unknown) {
  if (!value) throw new Error('Assertion failed');
}
const config = {
  key: 'test-only-not-a-secret',
  from: 'owner@example.test',
  recipient: 'owner@example.test',
};
const job = {
  contribution_id: '00000000-0000-4000-8000-000000000001',
  received_at: '2026-10-05T12:00:00Z',
  proposal_snapshot: {
    type: 'local-name',
    product: 'Gombo',
    productId: 'product-gombo',
    name: '<img src=x onerror=alert(1)>',
    country: 'CMR',
    contributorEmail: 'volunteer@example.test',
  },
};
Deno.test('Notification payload uses fixed private recipient, safe subject and text only', () => {
  const p = emailPayload(job, config);
  assert(p.to[0] === config.recipient);
  assert(!('html' in p));
  assert(!p.subject.includes('<img'));
  assert(p.text.includes('product-gombo'));
  assert(
    p.text.includes('modération') ||
      p.text.includes('mod eration') ||
      p.text.includes('moderation/'),
  );
  let rejected = false;
  try {
    emailPayload(
      { ...job, proposal_snapshot: { contributorEmail: 'a@b.test\r\nBcc:x@y.test' } },
      config,
    );
  } catch {
    rejected = true;
  }
  assert(rejected);
});
Deno.test(
  'Mail acceptance is distinct from delivery and uses a stable idempotency key',
  async () => {
    const keys: string[] = [];
    const mock: typeof fetch = (_input, init) => {
      keys.push(new Headers(init?.headers).get('Idempotency-Key')!);
      return Promise.resolve(Response.json({ id: 'test-provider-id' }));
    };
    const p = emailPayload(job, config);
    assert((await sendEmail(p, job.contribution_id, config, mock)) === 'test-provider-id');
    assert((await sendEmail(p, job.contribution_id, config, mock)) === 'test-provider-id');
    assert(keys[0] === keys[1]);
  },
);
Deno.test('Mail rejection and timeout never produce an accepted notification', async () => {
  for (const mock of [
    (() => Promise.resolve(Response.json({ error: 'failure' }, { status: 503 }))) as typeof fetch,
    (() => Promise.reject(new Error('Timeout'))) as typeof fetch,
  ]) {
    let rejected = false;
    try {
      await sendEmail(emailPayload(job, config), job.contribution_id, config, mock);
    } catch {
      rejected = true;
    }
    assert(rejected);
  }
});
Deno.test('Webhook signatures accept provider events and reject tampering', () => {
  const secret = 'whsec_' + btoa('local-testing-signature-key');
  const raw = JSON.stringify({ type: 'email.delivered', data: { email_id: 'test-provider-id' } }),
    id = 'msg_local',
    timestamp = new Date();
  const signature = new Webhook(secret).sign(id, timestamp, raw);
  const headers = new Headers({
    'svix-id': id,
    'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
    'svix-signature': signature,
  });
  assert(verifyMailWebhook(raw, headers, secret).type === 'email.delivered');
  let rejected = false;
  try {
    verifyMailWebhook(raw + ' ', headers, secret);
  } catch {
    rejected = true;
  }
  assert(rejected);
});
Deno.test(
  'Optional contribution fields stay optional and header injection/spam fail server validation',
  () => {
    const proposal = {
      type: 'local-name',
      product: 'Gombo',
      name: 'Nom à examiner',
      country: 'CMR',
      region: '',
      language: '',
      form: '',
      description: '',
      source: '',
      photoRights: false,
      photoSource: '',
      photoLicense: '',
      consent: true,
    };
    assert(proposalSchema.safeParse(proposal).success);
    assert(!proposalSchema.safeParse({ ...proposal, website: 'spam' }).success);
    assert(
      !proposalSchema.safeParse({ ...proposal, contributorEmail: 'a@b.test\r\nBcc:x@y.test' })
        .success,
    );
  },
);
Deno.test(
  'WASM image processing decodes genuine files, strips metadata and rejects fake JPEG/SVG',
  async () => {
    const bytes = await Deno.readFile('public/images/gingembre-shop-400.webp');
    const result = await sanitizePhoto(bytes, 'image/webp');
    assert(new TextDecoder().decode(result.slice(8, 12)) === 'WEBP');
    for (const [bytes, mime] of [
      [new TextEncoder().encode('<svg onload="alert(1)">'), 'image/jpeg'],
      [new Uint8Array([255, 216, 255, 0, 1, 2]), 'image/jpeg'],
    ] as const) {
      let rejected = false;
      try {
        await sanitizePhoto(bytes, mime);
      } catch {
        rejected = true;
      }
      assert(rejected);
    }
  },
);

Deno.test(
  'Durable notification retries preserve the contribution, payload and provider key',
  async () => {
    const env = {
      RESEND_API_KEY: config.key,
      CONTRIBUTIONS_FROM_EMAIL: config.from,
      CONTRIBUTIONS_RECIPIENT_EMAIL: config.recipient,
    };
    const previous = Object.fromEntries(Object.keys(env).map((k) => [k, Deno.env.get(k)]));
    for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);
    const saved: Record<string, unknown> = { ...job, state: 'pending', payload: null, attempts: 0 };
    const db = {
      rpc: async () => {
        if (saved.state !== 'pending') return { data: null, error: null };
        saved.attempts = Number(saved.attempts) + 1;
        saved.state = 'sending';
        return { data: { ...saved }, error: null };
      },
      from: () => ({
        update: (values: Record<string, unknown>) => ({
          eq: async () => {
            Object.assign(saved, values);
            return { error: null };
          },
        }),
        select: () => ({
          eq: () => ({ single: async () => ({ data: { state: saved.state }, error: null }) }),
        }),
      }),
    } as unknown as Parameters<typeof notifyContribution>[0];
    const calls: { key: string; body: string }[] = [];
    const mock: typeof fetch = (_url, init) => {
      assert(saved.payload);
      calls.push({
        key: new Headers(init?.headers).get('Idempotency-Key')!,
        body: String(init?.body),
      });
      return Promise.resolve(
        calls.length === 1
          ? Response.json({ error: 'temporarily unavailable' }, { status: 503 })
          : Response.json({ id: 'provider-after-retry' }),
      );
    };
    try {
      assert((await notifyContribution(db, job.contribution_id, mock)) === 'pending');
      assert(saved.state === 'pending');
      assert(saved.proposal_snapshot === job.proposal_snapshot);
      assert((await notifyContribution(db, job.contribution_id, mock)) === 'provider_accepted');
      assert((await notifyContribution(db, job.contribution_id, mock)) === 'provider_accepted');
      assert(calls.length === 2);
      assert(calls[0].key === calls[1].key);
      assert(calls[0].body === calls[1].body);
      assert(saved.provider_id === 'provider-after-retry');
      assert(saved.state !== 'delivered');
    } finally {
      for (const [k, v] of Object.entries(previous)) {
        if (v === undefined) Deno.env.delete(k);
        else Deno.env.set(k, v);
      }
    }
  },
);
