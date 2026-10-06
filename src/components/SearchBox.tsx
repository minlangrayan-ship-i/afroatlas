import { withLocale } from '../lib/locale-react';
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { searchProducts, emptyFilters } from '../lib/search';
import type { CardProduct } from '../lib/catalogue';
import { href, productLink } from '../lib/links';
import { useClientReady } from '../lib/use-client-ready';
import { useCommunityCatalogue } from '../lib/community-catalogue';
function SearchBox({
  products: seed,
  initial = '',
  onSearch,
}: {
  products: CardProduct[];
  initial?: string;
  onSearch?: (query: string) => void;
}) {
  const products = useCommunityCatalogue(seed);
  const [value, setValue] = useState(initial),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const id = useId();
  const [debounced, setDebounced] = useState(initial);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 120);
    return () => clearTimeout(id);
  }, [value]);
  const ready = useClientReady();
  const suggestions = useMemo(
    () =>
      debounced.trim()
        ? searchProducts(products, { ...emptyFilters, q: debounced }).slice(0, 5)
        : [],
    [debounced, products],
  );
  function key(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
    if (event.key === 'Enter' && open && active >= 0 && suggestions[active]) {
      event.preventDefault();
      window.location.href = productLink(
        suggestions[active].product.slug,
        new URLSearchParams({ q: value }).toString(),
      );
    }
  }
  return (
    <div
      className="search-wrap"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <form
        className="search-box"
        action={href('catalogue/')}
        onSubmit={(event) => {
          if (onSearch) {
            event.preventDefault();
            onSearch(value);
            setOpen(false);
            setActive(-1);
          }
        }}
      >
        {ready && document.documentElement.lang !== 'fr' && (
          <input type="hidden" name="lang" value={document.documentElement.lang} />
        )}
        <label className="sr-only" htmlFor={id}>
          Comment appelez-vous ce produit ?
        </label>
        <span aria-hidden="true" className="search-icon">
          ⌕
        </span>
        <input
          disabled={!ready}
          id={id}
          type="search"
          name="q"
          maxLength={200}
          value={value}
          placeholder="Comment appelez-vous ce produit ?"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={`${id}-suggestions`}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={key}
        />
        <button type="submit" disabled={!ready}>
          Rechercher <span aria-hidden="true">↗</span>
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <ul
          className="suggestions"
          id={`${id}-suggestions`}
          role="listbox"
          aria-label="Suggestions documentées"
        >
          {suggestions.map(({ product }, i) => (
            <li key={product.id} role="option" id={`${id}-${i}`} aria-selected={active === i}>
              <a
                href={productLink(product.slug, new URLSearchParams({ q: value }).toString())}
                className={active === i ? 'selected' : ''}
              >
                {(product.image.role === 'primary' ||
                  product.image.verificationStatus === 'visually_checked') && (
                  <img
                    src={href(product.image.smallPath)}
                    alt={
                      product.image.role === 'primary'
                        ? ''
                        : `Photo complémentaire : ${product.image.depictedPart}`
                    }
                    width="44"
                    height="44"
                  />
                )}
                <span>
                  <span
                    data-product-label
                    data-no-translate
                    data-fr={product.labelFr}
                    data-en={product.labelEn || ''}
                    data-ar={
                      product.labelAr ||
                      product.names.find((n) => n.languageCode === 'ar')?.name ||
                      ''
                    }
                  >
                    {product.labelFr}
                  </span>
                  <small>{product.scientificName}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default withLocale(SearchBox);
