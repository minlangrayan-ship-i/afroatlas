import { photoSignature } from './validation.ts';
import { boundedForm } from './body.ts';
function assert(value: boolean) {
  if (!value) throw new Error('Assertion failed');
}
Deno.test('Photo signatures reject renamed SVG and mismatched image formats', () => {
  const svg = new TextEncoder().encode('<svg onload="alert(1)"></svg>');
  for (const mime of ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
    assert(!photoSignature(svg, mime));
  assert(photoSignature(new Uint8Array([255, 216, 255]), 'image/jpeg'));
  assert(photoSignature(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'));
  assert(photoSignature(new TextEncoder().encode('RIFF1234WEBP'), 'image/webp'));
  assert(!photoSignature(new Uint8Array([255, 216, 255]), 'image/png'));
});
Deno.test('Multipart uploads preserve actual photograph bytes', async () => {
  const form = new FormData();
  form.set('proposal', 'example');
  form.set(
    'photo',
    new Blob([new Uint8Array([255, 216, 255])], { type: 'image/jpeg' }),
    'photo.jpg',
  );
  const parsed = await boundedForm(
    new Request('https://example.test', { method: 'POST', body: form }),
  );
  assert(parsed.get('proposal') === 'example');
  const photo = parsed.get('photo');
  assert(photo instanceof File && photo.type === 'image/jpeg' && photo.size === 3);
});
Deno.test('Oversized chunked request is rejected without Content-Length', async () => {
  const req = new Request('https://example.test', {
    method: 'POST',
    body: new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(100));
        c.close();
      },
    }),
  });
  let rejected = false;
  try {
    await boundedForm(req, 10);
  } catch {
    rejected = true;
  }
  assert(rejected);
});
