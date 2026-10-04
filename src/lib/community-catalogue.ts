import { useEffect, useState } from 'react';
import type { CardProduct } from './catalogue';
import { approvedEntries, type PublicEntry } from './community';
export function mergeApproved(seed: CardProduct[], entries: PublicEntry[]): CardProduct[] {
  const result = seed.map((p) => ({ ...p, names: [...p.names], contexts: [...p.contexts] }));
  for (const e of entries.filter((e) => e.kind === 'product')) {
    if (result.some((p) => p.id === e.productId)) continue;
    const image = {
      id: `community-photo-${e.id}`,
      localPath: e.photoUrl,
      smallPath: e.photoUrl,
      width: 960,
      height: 640,
      altFr: `${e.labelFr} — ${e.form}`,
      creator: e.photoCredit,
      sourcePageUrl: e.sourceUrl,
      licenseId: e.photoLicense,
      licenseUrl: 'https://creativecommons.org/',
      attribution: e.photoCredit,
      modifications: 'Photographie fournie puis acceptée par le propriétaire',
      retrievedAt: '',
      title: e.labelFr,
      description: e.form,
      role: 'primary' as const,
      depictedForm: e.form,
    };
    result.push({
      id: e.productId,
      slug: `communaute/?id=${e.id}`,
      labelFr: e.labelFr,
      labelEn: e.labelEn,
      labelAr: e.labelAr,
      description: e.description,
      categoryId: e.categoryId,
      entityType: 'ingredient',
      scientificName: null,
      taxonId: null,
      sourceIds: [],
      imageId: image.id,
      formTypes: [e.form],
      verifiedAt: '',
      usage: e.description,
      editorialNote: 'Contribution acceptée par le propriétaire ; consulter la source.',
      image,
      names: [],
      contexts: [],
    });
  }
  for (const e of entries) {
    const p = result.find((p) => p.id === e.productId);
    if (!p) continue;
    if ((e.kind === 'name' || e.kind === 'product') && e.name)
      p.names.push({
        id: `community-name-${e.id}`,
        productId: p.id,
        formId: null,
        name: e.name,
        normalizedName: e.name
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase(),
        languageCode: e.language || null,
        countryIds: e.country ? [e.country] : [],
        regionIds: e.region ? [e.region] : [],
        culturalAreaIds: [],
        localContext: e.region,
        status: 'reviewed',
        evidenceIds: [`community-evidence-${e.id}`],
      });
    if (e.kind === 'photo' && e.photoUrl)
      p.image = {
        ...p.image,
        role: 'primary',
        depictedForm: e.form,
        localPath: e.photoUrl,
        smallPath: e.photoUrl,
        creator: e.photoCredit,
        licenseId: e.photoLicense,
        sourcePageUrl: e.sourceUrl,
        altFr: `${p.labelFr} — ${e.form}`,
      };
    if (e.kind === 'usage' || e.kind === 'product') {
      p.usage = e.description;
      p.description = e.description;
      if (e.country)
        p.contexts.push({
          id: e.id,
          productId: p.id,
          countryId: e.country,
          regionIds: e.region ? [e.region] : [],
          localContext: e.region || e.country,
          description: e.description,
          sourceId: e.id,
          locator: e.sourceUrl,
          form: e.form,
        });
    }
  }
  return result;
}
export function useCommunityCatalogue(seed: CardProduct[]) {
  const [products, setProducts] = useState(seed);
  useEffect(() => {
    let live = true;
    approvedEntries().then((entries) => {
      if (live) setProducts(mergeApproved(seed, entries));
    });
    return () => {
      live = false;
    };
  }, [seed]);
  return products;
}
export function useCommunityGeography() {
  const [entries, setEntries] = useState<PublicEntry[]>([]);
  useEffect(() => {
    approvedEntries().then((rows) =>
      setEntries(rows.filter((r) => r.kind === 'country' || r.kind === 'region')),
    );
  }, []);
  return entries;
}
