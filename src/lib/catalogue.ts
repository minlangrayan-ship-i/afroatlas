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
