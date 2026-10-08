// Titles and descriptions of the English and Arabic pages generated from each French page.
import { translate } from './i18n';
export type PageMeta = { title: string; description: string };
export type LocalizedMeta = { en: PageMeta; ar: PageMeta };

export const staticMeta: Record<string, LocalizedMeta> = {
  '': {
    en: {
      title: 'One product, many names. Find yours.',
      description:
        'AfroAtlas: an open library of African food products. Find okra, cassava leaves or bissap under the name you know, with photos, names by language and country, and sources.',
    },
    ar: {
      title: 'منتج واحد، أسماء كثيرة. اعثر على اسمك.',
      description:
        'أفرو أطلس: مكتبة مفتوحة للمنتجات الغذائية الأفريقية. ابحث عن البامية أو أوراق الكسافا أو الكركديه بالاسم الذي تعرفه، مع الصور والأسماء حسب اللغة والبلد والمصادر.',
    },
  },
  catalogue: {
    en: {
      title: 'Library of African food products',
      description:
        'Search African food products by the name you know: local names, languages, countries, photos and sources.',
    },
    ar: {
      title: 'مكتبة المنتجات الغذائية الأفريقية',
      description:
        'ابحث عن المنتجات الغذائية الأفريقية بالاسم الذي تعرفه: الأسماء المحلية واللغات والبلدان والصور والمصادر.',
    },
  },
  explorer: {
    en: {
      title: 'Explore African countries',
      description:
        'Explore African countries and their regions to find documented food names, with their sources and limits.',
    },
    ar: {
      title: 'استكشف البلدان الأفريقية',
      description:
        'استكشف البلدان الأفريقية ومناطقها للعثور على أسماء الأطعمة الموثقة مع مصادرها وحدودها.',
    },
  },
  methodologie: {
    en: {
      title: 'Methodology',
      description:
        'How AfroAtlas tells products, forms and names apart, checks sources and flags ambiguities without inventing equivalences.',
    },
    ar: {
      title: 'المنهجية',
      description:
        'كيف يميز أفرو أطلس بين المنتجات وأشكالها وتسمياتها، ويتحقق من المصادر ويشير إلى الالتباسات دون اختلاق مكافئات.',
    },
  },
  sources: {
    en: {
      title: 'Sources & credits',
      description: 'Credits, licences and references for the AfroAtlas photographs and data.',
    },
    ar: {
      title: 'المصادر والاعتمادات',
      description: 'الاعتمادات والتراخيص والمراجع الخاصة بصور وبيانات أفرو أطلس.',
    },
  },
  contact: {
    en: {
      title: 'Contact and advertising partnerships',
      description:
        'Contact the creator of AfroAtlas by email about a partnership, a grocery listing or advertising subject to approval.',
    },
    ar: {
      title: 'التواصل والشراكات الإعلانية',
      description:
        'تواصل مع منشئ أفرو أطلس بالبريد الإلكتروني بشأن شراكة أو إدراج متجر أو إعلان خاضع للموافقة.',
    },
  },
  presentation: {
    en: {
      title: 'Video: recognise a product in an African grocery',
      description:
        'Discover AfroAtlas on video: find a product from a name you know and compare documented names to talk with a seller.',
    },
    ar: {
      title: 'فيديو: تعرّف على منتج في متجر أفريقي',
      description:
        'اكتشف أفرو أطلس في فيديو: اعثر على منتج من اسم تعرفه وقارن التسميات الموثقة للتحدث مع البائع.',
    },
  },
  contribuer: {
    en: {
      title: 'Contribute to the library',
      description:
        'Suggest a local name, a missing product or a correction. Every proposal is reviewed before publication.',
    },
    ar: {
      title: 'ساهم في المكتبة',
      description: 'اقترح اسمًا محليًا أو منتجًا ناقصًا أو تصحيحًا. تُراجع كل مساهمة قبل نشرها.',
    },
  },
  references: {
    en: {
      title: 'Commercial references',
      description: 'Packaged products linked to AfroAtlas records by evidence.',
    },
    ar: {
      title: 'المراجع التجارية',
      description: 'منتجات معبأة مرتبطة بصفحات أفرو أطلس بدليل.',
    },
  },
  comparer: {
    en: { title: 'Compare products', description: 'Compare AfroAtlas records side by side.' },
    ar: { title: 'قارن المنتجات', description: 'قارن صفحات أفرو أطلس جنبًا إلى جنب.' },
  },
  favoris: {
    en: { title: 'My favourites', description: 'Your saved AfroAtlas records, on this device.' },
    ar: { title: 'مفضلاتي', description: 'صفحات أفرو أطلس المحفوظة على هذا الجهاز.' },
  },
  epiceries: {
    en: {
      title: 'Kit for African groceries',
      description:
        'Printable QR codes that help customers find a product by the name they know, free for African groceries.',
    },
    ar: {
      title: 'عدة للمتاجر الأفريقية',
      description:
        'رموز QR قابلة للطباعة تساعد الزبائن على إيجاد المنتج بالاسم الذي يعرفونه، مجانًا للمتاجر.',
    },
  },
};

type GlanceName = { name: string; language: string };
const listNames = (glance: GlanceName[], locale: 'en' | 'ar') =>
  glance
    .slice(0, 4)
    .map((n) =>
      n.language === 'Nom local'
        ? n.name
        : `${n.name} (${translate(n.language, locale).toLowerCase()})`,
    )
    .join(locale === 'ar' ? '، ' : ', ');

export function productMeta(input: {
  labelFr: string;
  scientificName?: string | null;
  english?: string;
  arabic?: string;
  glance: GlanceName[];
}): LocalizedMeta {
  const english = input.english || input.labelFr;
  const en = english.charAt(0).toUpperCase() + english.slice(1);
  const ar = input.arabic || input.labelFr;
  const latin = input.scientificName ? ` (${input.scientificName})` : '';
  const sameEn = en.toLowerCase() === input.labelFr.toLowerCase();
  return {
    en: {
      title: `${en}${sameEn ? '' : ` (${input.labelFr})`}: names across languages and countries`,
      description: `${en}${latin}: ${listNames(input.glance, 'en') || input.labelFr}. Photo, names by language and country, how to ask for it in a shop, sources.`,
    },
    ar: {
      title: `${ar}${ar === input.labelFr ? '' : ` (${input.labelFr})`}: أسماؤه حسب اللغات والبلدان`,
      description: `${ar}${latin}: ${listNames(input.glance, 'ar') || input.labelFr}. صورة وأسماء حسب اللغة والبلد وكيف تطلبه في المتجر، مع المصادر.`,
    },
  };
}

export function categoryMeta(label: string, count: number): LocalizedMeta {
  return {
    en: {
      title: `${translate(label, 'en')}: African products and their other names`,
      description: `Discover ${count} records in ${translate(label, 'en').toLowerCase()}: identity, forms, names in African languages and sources.`,
    },
    ar: {
      title: `${translate(label, 'ar')}: منتجات أفريقية وأسماؤها الأخرى`,
      description: `اكتشف ${count} صفحة في فئة ${translate(label, 'ar')}: الهوية والأشكال والأسماء باللغات الأفريقية والمصادر.`,
    },
  };
}

export function countryMeta(nameFr: string, count: number): LocalizedMeta {
  return {
    en: {
      title: `Documented food products and names: ${translate(nameFr, 'en')}`,
      description: `Names and uses of ${count} food products documented in ${translate(nameFr, 'en')}, with sources and regional scope.`,
    },
    ar: {
      title: `منتجات وتسميات موثقة: ${translate(nameFr, 'ar')}`,
      description: `أسماء واستخدامات ${count} منتجًا غذائيًا موثقًا في ${translate(nameFr, 'ar')}، مع المصادر والنطاق الإقليمي.`,
    },
  };
}
