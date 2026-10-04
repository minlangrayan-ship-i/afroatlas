import { Children, cloneElement, isValidElement, useEffect, useState, type ReactNode } from 'react';
import { translate, type Locale } from './i18n';

/** Translate React's virtual tree, never its DOM: hydration starts in the same language as SSR. */
export function withLocale<P>(render: (props: P) => ReactNode) {
  return function Localized(props: P) {
    const [locale, setLocale] = useState<Locale>('fr');
    useEffect(() => {
      const update = () => setLocale((document.documentElement.lang as Locale) || 'fr');
      update();
      window.addEventListener('afroatlas-locale', update);
      return () => window.removeEventListener('afroatlas-locale', update);
    }, []);
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
    !/\.(webp|svg|json|pdf)(\?|$)/.test(props.href)
  ) {
    const url = new URL(props.href, 'https://afroatlas.invalid');
    if (locale !== 'fr') url.searchParams.set('lang', locale);
    else url.searchParams.delete('lang');
    patch.href = url.pathname + url.search + url.hash;
  }
  return cloneElement(node, patch);
}
