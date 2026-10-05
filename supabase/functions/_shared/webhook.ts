import { Webhook } from 'npm:svix@2.6.1';
export function verifyMailWebhook(raw: string, headers: Headers, secret: string) {
  new Webhook(secret).verify(raw, {
    'svix-id': headers.get('svix-id') || '',
    'svix-timestamp': headers.get('svix-timestamp') || '',
    'svix-signature': headers.get('svix-signature') || '',
  });
  return JSON.parse(raw) as { type: string; data: { email_id: string } };
}
