export const site = {
  name: 'AfroAtlas',
  contactEmail: 'minlangrayan@gmail.com',
  tagline: 'Un produit, plusieurs noms.',
  description:
    'Une bibliothèque ouverte pour identifier les produits, explorer leurs appellations et retrouver leurs références.',
  palette: { cream: '#faf7ef', green: '#193d30', terracotta: '#b94c35', spice: '#dfae43' },
  advertisingEnabled: false,
  adPlacements: [
    {
      id: 'home',
      location: 'home-after-categories',
      sizeVariant: 'banner',
      enabled: false,
      sponsorLabel: null as string | null,
      targetUrl: null as string | null,
    },
    {
      id: 'catalog',
      location: 'catalog-after-six',
      sizeVariant: 'inline',
      enabled: false,
      sponsorLabel: null as string | null,
      targetUrl: null as string | null,
    },
    {
      id: 'product',
      location: 'product-after-main-info',
      sizeVariant: 'banner',
      enabled: false,
      sponsorLabel: null as string | null,
      targetUrl: null as string | null,
    },
    {
      id: 'footer',
      location: 'footer',
      sizeVariant: 'banner',
      enabled: false,
      sponsorLabel: null as string | null,
      targetUrl: null as string | null,
    },
  ],
};
