import { z } from 'zod';
const id = z.string().min(1);
const ids = z.array(id);
export const productSchema = z.object({
  id,
  slug: id,
  labelFr: id,
  labelEn: z.string().nullable(),
  labelAr: z.string().nullable().optional(),
  description: id,
  categoryId: z.enum(['spices', 'vegetables', 'fish', 'staples']),
  entityType: z.enum(['taxon', 'ingredient', 'commercial-category', 'mixture', 'prepared-dish']),
  scientificName: z.string().nullable(),
  taxonId: z.string().nullable(),
  sourceIds: ids,
  imageId: id,
  formTypes: ids,
  verifiedAt: id,
  usage: z.string().nullable(),
  editorialNote: id,
  consumedPart: z.string().optional(),
  scientificNames: ids.optional(),
  verificationStatus: z.enum(['documented', 'reviewed']).optional(),
  identityEvidenceIds: ids.optional(),
});
export const nameSchema = z.object({
  id,
  productId: id,
  formId: z.string().nullable(),
  name: id,
  normalizedName: id,
  languageCode: z.string().nullable(),
  countryIds: ids,
  regionIds: ids,
  culturalAreaIds: ids,
  status: z.enum(['candidate', 'documented', 'reviewed', 'rejected']),
  evidenceIds: ids,
  localContext: z.string().default(''),
  nameType: z.enum(['common', 'local', 'spelling', 'input', 'scientific']).optional(),
  ambiguity: z.string().optional(),
});
export const imageSchema = z.object({
  id,
  localPath: id,
  smallPath: id,
  width: z.number().positive(),
  height: z.number().positive(),
  altFr: id,
  creator: id,
  sourcePageUrl: z.url(),
  licenseId: id,
  licenseUrl: z.url(),
  attribution: id,
  modifications: id,
  retrievedAt: id,
  title: id,
  description: z.string(),
  role: z.enum(['primary', 'complementary']).default('complementary'),
  depictedForm: z.string().default('non documentée'),
  depictedProductId: z.string().optional(),
  depictedPart: z.string().optional(),
  visuallyCheckedAt: z.string().optional(),
  visualCheckResult: z.string().optional(),
});
export const sourceSchema = z.object({
  id,
  title: id,
  publisher: id,
  url: z.url(),
  licenseId: id,
  retrievedAt: id,
  datasetVersion: id,
});
export const evidenceSchema = z.object({
  id,
  sourceId: id,
  assertionType: id,
  locator: id,
  shortNote: id,
  checkedAt: z.string().nullable(),
  checkedBy: z.string().nullable(),
});
export const catalogueSchema = z.object({
  contexts: z
    .array(
      z.object({
        id,
        productId: id,
        countryId: id,
        regionIds: ids,
        localContext: id,
        description: id,
        sourceId: id,
        locator: id,
        form: id,
        relationType: z
          .enum([
            'consumption',
            'recipe-use',
            'cultivation',
            'presence',
            'botanical-origin',
            'local-name',
          ])
          .optional(),
      }),
    )
    .default([]),
  products: z.array(productSchema),
  names: z.array(nameSchema),
  images: z.array(imageSchema),
  sources: z.array(sourceSchema),
  evidence: z.array(evidenceSchema),
  forms: z.array(z.object({ id, productId: id, formType: id, description: id, sourceIds: ids })),
  relations: z.array(
    z.object({
      fromId: id,
      toId: id,
      relationType: z.enum(['same-ingredient-other-form', 'related-product', 'adjacent-category']),
      evidenceIds: ids,
    }),
  ),
  culturalAreas: z.array(z.object({ id, label: id, description: id, sourceIds: ids })),
});
export const draftSchema = z.object({
  version: z.literal(1),
  productId: z.string().optional(),
  proposedFields: z.object({
    product: z.string().max(200),
    name: z.string().min(1).max(200),
    country: z.string(),
    region: z.string(),
    language: z.string().max(50),
  }),
  evidenceUrl: z.url(),
  comment: z.string().max(3000),
  createdAt: z.string(),
});
export const commercialSchema = z.object({
  license: id,
  licenseUrl: z.url(),
  imageLicense: id,
  references: z.array(
    z.object({
      id,
      brandId: id,
      brand: id,
      barcode: id,
      tradeName: id,
      packageImageIds: ids,
      quantity: z.string().nullable(),
      unit: z.string().nullable(),
      ingredientsDeclared: z.string().nullable(),
      originClaim: z.string().nullable(),
      manufactureCountryIds: ids,
      manufacturingPlaceDeclared: z.string().nullable(),
      marketCountryIds: ids,
      sourceRecordId: id,
      sourceUrl: z.url(),
      retrievedAt: id,
      status: z.literal('documented'),
      label: id,
      relations: z.array(
        z.object({
          productId: id,
          relationType: z.enum(['ingredient', 'mixture-ingredient', 'same-product']),
          evidenceIds: ids,
        }),
      ),
    }),
  ),
  gaps: z.array(z.unknown()),
  importedAt: id,
  note: id,
});
export type Product = z.infer<typeof productSchema>;
export type NameAssertion = z.infer<typeof nameSchema>;
export type ImageAsset = z.infer<typeof imageSchema>;
export type ContributionDraft = z.infer<typeof draftSchema>;
