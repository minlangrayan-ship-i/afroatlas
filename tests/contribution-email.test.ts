import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  emailContributionPayload,
  sendContributionEmail,
  contributionEmailEndpoint,
} from '../src/lib/contribution-email';
import type { Submission } from '../src/lib/community';
const reference = '71f29b85-d988-4ef0-95d2-d34d30f07813';
const fields: Submission = {
  type: 'local-name',
  product: 'Gombo',
  productId: 'product-gombo',
  name: 'Nom local — اسم',
  country: 'MLI',
  region: 'Contexte local',
  language: 'Bambara',
  form: 'poudre',
  description: 'Une proposition avec des accents.',
  source: 'https://example.org/source',
  photoRights: false,
  photoSource: 'https://commons.wikimedia.org/wiki/File:Okra_powder.jpg',
  photoLicense: 'CC BY-SA 4.0',
  consent: true,
};
const pageUrl = 'https://minlangrayan-ship-i.github.io/afroatlas/contribuer/';
describe('automatic email contribution transport', () => {
  it('sends complete UTF-8 fields, a fixed recipient and the actual photograph bytes', async () => {
    const bytes = await readFile('public/images/gombo-poudre-coverage-400.webp');
    const photo = new File([bytes], 'photo.webp', { type: 'image/webp' });
    const payload = await emailContributionPayload(fields, photo, reference, pageUrl);
    expect(payload.get('Nom local')).toBe(fields.name);
    expect(payload.get('Pays')).toBe('Mali (MLI)');
    expect(payload.get('_subject')).toBe(`AfroAtlas — contribution ${reference}`);
    expect(payload.has('_cc')).toBe(false);
    const uploaded = payload.get('attachment') as File;
    expect(Buffer.from(await uploaded.arrayBuffer())).toEqual(bytes);
    expect(uploaded.name).toBe('photo.webp');
    expect(contributionEmailEndpoint).toBe('https://formsubmit.co/ajax/minlangrayan%40gmail.com');
  });
  it('rejects a disguised image, missing reuse rights and missing consent before contacting the provider', async () => {
    const fetcher = vi.fn();
    await expect(
      sendContributionEmail(
        fields,
        new File(['<svg/>'], 'fake.png', { type: 'image/png' }),
        reference,
        pageUrl,
        fetcher,
      ),
    ).rejects.toThrow('contenu');
    const photo = new File(
      [await readFile('public/images/gombo-poudre-coverage-400.webp')],
      'photo.webp',
      { type: 'image/webp' },
    );
    await expect(
      sendContributionEmail(
        { ...fields, photoSource: '', photoLicense: '' },
        photo,
        reference,
        pageUrl,
        fetcher,
      ),
    ).rejects.toThrow('droits');
    await expect(
      sendContributionEmail(
        { ...fields, consent: false } as unknown as Submission,
        null,
        reference,
        pageUrl,
        fetcher,
      ),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not convert HTTP 200 with activation pending into a success', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: 'false', message: 'This form needs Activation.' }), {
          status: 200,
        }),
      );
    await expect(
      sendContributionEmail(fields, null, reference, pageUrl, fetcher),
    ).rejects.toMatchObject({ code: 'activation' });
  });
  it('distinguishes provider acceptance from delivery and preserves errors without automatic retries', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: 'true' }), { status: 200 }));
    await expect(sendContributionEmail(fields, null, reference, pageUrl, fetcher)).resolves.toEqual(
      { reference, status: 'provider_accepted' },
    );
    fetcher.mockRejectedValue(new Error('network failure'));
    await expect(
      sendContributionEmail(fields, null, reference, pageUrl, fetcher),
    ).rejects.toMatchObject({ code: 'unconfirmed' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
