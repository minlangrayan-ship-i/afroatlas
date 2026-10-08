import { Children, cloneElement, isValidElement, useEffect, useState, type ReactNode } from 'react';
import { translate, type Locale } from './i18n';
import { builtLocale, localizedPath } from './links';

export function useLocale() {
  // Start in the language of the generated HTML so hydration matches the server markup.
  const [locale, setLocale] = useState<Locale>(() => builtLocale() as Locale);
  useEffect(() => {
    const update = () => setLocale((document.documentElement.lang as Locale) || 'fr');
    update();
    window.addEventListener('afroatlas-locale', update);
    return () => window.removeEventListener('afroatlas-locale', update);
  }, []);
  return locale;
}

/** Translate React's virtual tree, never its DOM: hydration starts in the same language as SSR. */
export function withLocale<P>(render: (props: P) => ReactNode) {
  return function Localized(props: P) {
    const locale = useLocale();
    return localize(render(props), locale);
  };
}
function localize(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === 'string') return translate(node, locale);
  if (Array.isArray(node)) return Children.map(node, (child) => localize(child, locale));
  if (!isValidElement<Record<string, unknown>>(node)) return node;
  const props = node.props;
  const patch: Record<string, unknown> = {};
  if ('data-product-label' in props) {
    patch.children =
      props[`data-${locale}`] ||
      translate(
        locale === 'ar'
          ? 'Nom arabe non documenté'
          : locale === 'en'
            ? 'Nom anglais non documenté'
            : 'Nom français non documenté',
        locale,
      );
    patch.dir = 'auto';
  } else if (
    !('data-no-translate' in props) &&
    !/scientific|evidence-locator|photo-credit|card-names/.test(String(props.className || ''))
  ) {
    if ('children' in props) patch.children = localize(props.children as ReactNode, locale);
    for (const attribute of ['placeholder', 'aria-label', 'title', 'label']) {
      if (typeof props[attribute] === 'string')
        patch[attribute] = translate(props[attribute], locale);
    }
  }
  if (
    typeof props.href === 'string' &&
    props.href.startsWith(import.meta.env.BASE_URL) &&
    !/\.(webp|svg|json|pdf|png|jpg|mp4|vtt)(\?|$)/.test(props.href)
  ) {
    const url = new URL(props.href, 'https://afroatlas.invalid');
    url.searchParams.delete('lang');
    patch.href = localizedPath(url.pathname, locale) + url.search + url.hash;
  }
  return cloneElement(node, patch);
}
