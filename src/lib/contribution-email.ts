import { submissionSchema, validatePhoto, type Submission } from './community';
import { site } from '../data/site';
import { countries, europeanContexts } from '../data/countries';
export const contributionEmailEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(site.contactEmail)}`;
const typeLabels: Record<Submission['type'], string> = {
  'new-product': 'Produit absent',
  'local-name': 'Appellation locale',
  'country-region': 'Pays ou région',
  correction: 'Correction',
  photo: 'Photographie',
};
export class EmailSubmissionError extends Error {
  constructor(public code: 'activation' | 'unconfirmed') {
    super(
      code === 'activation'
        ? 'Envoi en attente : le propriétaire doit activer la réception des contributions par email. Votre formulaire est conservé à l’écran.'
        : 'Envoi par email non confirmé. Vos champs sont conservés ; réessayez plus tard.',
    );
  }
}
export async function emailContributionPayload(
  fields: Submission,
  photo: File | null | undefined,
  reference: string,
  pageUrl: string,
) {
  const value = submissionSchema.parse(fields);
  if (!/^[a-f0-9-]{36}$/i.test(reference)) throw new Error('Référence de contribution invalide.');
  if (photo) {
    validatePhoto(photo);
    const b = new Uint8Array(await photo.slice(0, 12).arrayBuffer());
    const valid =
      photo.type === 'image/jpeg'
        ? b[0] === 255 && b[1] === 216 && b[2] === 255
        : photo.type === 'image/png'
          ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)
          : String.fromCharCode(...b.slice(0, 4)) === 'RIFF' &&
            String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
    if (!valid)
      throw new Error(
        'Le contenu du fichier ne correspond pas à une photographie JPEG, PNG ou WebP.',
      );
    if (
      !value.photoRights &&
      !(
        value.photoSource.startsWith('https://') &&
        ['CC BY 4.0', 'CC BY-SA 4.0', 'CC0', 'Public domain'].includes(value.photoLicense)
      )
    )
      throw new Error('Confirmez vos droits ou renseignez une source et une licence réutilisable.');
    if (typeof createImageBitmap === 'function') {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(photo);
      } catch {
        throw new Error(
          'La photographie ne peut pas être ouverte. Choisissez un fichier image valide.',
        );
      }
      const tooLarge = bitmap.width * bitmap.height > 30000000;
      bitmap.close();
      if (tooLarge)
        throw new Error('La photographie dépasse 30 millions de pixels. Réduisez ses dimensions.');
    }
  }
  const country = [...countries, ...europeanContexts].find((c) => c.ISO3 === value.country);
  const form = new FormData();
  // Destination, subject and provider controls are fixed, never supplied by a visitor.
  form.set('_subject', `AfroAtlas — contribution ${reference}`);
  form.set('_template', 'table');
  form.set('_url', pageUrl);
  form.set('_honey', '');
  const entries: [string, string | undefined][] = [
    ['Référence', reference],
    ['Type de contribution', typeLabels[value.type]],
    ['Produit', value.product],
    ['Identifiant produit', value.productId],
    ['Fiche produit', value.productSlug],
    ['Nom local', value.name],
    ['Pays', country ? `${country.nameFr} (${country.ISO3})` : value.countryName || value.country],
    ['Région', value.region],
    ['Langue', value.language],
    ['Forme', value.form],
    ['Description', value.description],
    ['Source ou explication', value.source],
    ['Prénom ou pseudonyme', value.contributorName],
    [
      'Auteur de la photographie',
      !photo
        ? 'Sans objet — aucune photographie jointe'
        : value.photoRights
          ? 'Auteur contributeur, autorisation CC BY 4.0'
          : 'Source et licence fournies',
    ],
    ['Source de la photographie', value.photoSource],
    [
      'Licence de la photographie',
      !photo
        ? 'Sans objet — aucune photographie jointe'
        : value.photoRights
          ? 'CC BY 4.0'
          : value.photoLicense,
    ],
    [
      'Consentement',
      'Transmission par FormSubmit au créateur pour examen ; aucune publication automatique.',
    ],
  ];
  for (const [label, text] of entries) form.set(label, text?.trim() || 'Non précisé');
  if (value.contributorEmail) form.set('email', value.contributorEmail);
  if (photo) form.set('attachment', photo, photo.name);
  return form;
}
export async function sendContributionEmail(
  fields: Submission,
  photo: File | null | undefined,
  reference: string,
  pageUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const body = await emailContributionPayload(fields, photo, reference, pageUrl);
  let response: Response;
  try {
    response = await fetcher(contributionEmailEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
      credentials: 'omit',
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new EmailSubmissionError('unconfirmed');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || (result?.success !== true && result?.success !== 'true')) {
    if (/activat/i.test(String(result?.message || '')))
      throw new EmailSubmissionError('activation');
    throw new EmailSubmissionError('unconfirmed');
  }
  // Provider acceptance is not evidence of inbox delivery or catalogue approval.
  return { reference, status: 'provider_accepted' as const };
}
