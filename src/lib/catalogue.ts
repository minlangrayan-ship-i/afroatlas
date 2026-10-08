import raw from '../data/published/catalogue.json';
import commercialRaw from '../data/published/commercial-off.json';
import { catalogueSchema, commercialSchema } from './schema';
export const catalogue = catalogueSchema.parse(raw);
export const commercial = commercialSchema.parse(commercialRaw);
export const products = catalogue.products;
export const imageFor = (productId: string) =>
  catalogue.images.find((image) => image.id === products.find((p) => p.id === productId)?.imageId)!;
export const namesFor = (id: string) =>
  catalogue.names.filter(
    (n) => n.productId === id && (n.status === 'documented' || n.status === 'reviewed'),
  );
export const cardProducts = products.map((p) => ({
  ...p,
  image: imageFor(p.id),
  names: namesFor(p.id),
  contexts: catalogue.contexts.filter((c) => c.productId === p.id),
}));
export type CardProduct = (typeof cardProducts)[number];
/** Fields needed to search and list products; credits and evidence stay on product pages. */
export const searchCards = cardProducts.map((p) => ({
  id: p.id,
  slug: p.slug,
  labelFr: p.labelFr,
  labelEn: p.labelEn,
  labelAr: p.labelAr,
  scientificName: p.scientificName,
  scientificNames: p.scientificNames,
  categoryId: p.categoryId,
  formTypes: p.formTypes,
  description: p.description,
  consumedPart: p.consumedPart,
  documentaryScope: p.documentaryScope,
  image: {
    role: p.image.role,
    verificationStatus: p.image.verificationStatus,
    smallPath: p.image.smallPath,
    localPath: p.image.localPath,
    width: p.image.width,
    height: p.image.height,
    altFr: p.image.altFr,
    depictedForm: p.image.depictedForm,
    depictedPart: p.image.depictedPart,
  },
  names: p.names.map((n) => ({
    id: n.id,
    name: n.name,
    nameType: n.nameType,
    status: n.status,
    languageCode: n.languageCode,
    languageId: n.languageId,
    languageLabel: n.languageLabel,
    countryIds: n.countryIds,
    regionIds: n.regionIds,
    geographicScope: n.geographicScope,
    localContext: n.localContext,
  })),
  contexts: p.contexts.map((c) => ({
    countryId: c.countryId,
    regionIds: c.regionIds,
    localContext: c.localContext,
    relationType: c.relationType,
  })),
})) as unknown as CardProduct[];
