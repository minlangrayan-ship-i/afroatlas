import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { searchProducts, emptyFilters } from '../lib/search';
import type { CardProduct } from '../lib/catalogue';
import { href } from '../lib/links';
import { useClientReady } from '../lib/use-client-ready';
export default function SearchBox({
  products,
  initial = '',
  onSearch,
}: {
  products: CardProduct[];
  initial?: string;
  onSearch?: (query: string) => void;
}) {
  const [value, setValue] = useState(initial),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const id = useId();
  const ready = useClientReady();
  const suggestions = useMemo(
    () => (value.trim() ? searchProducts(products, { ...emptyFilters, q: value }).slice(0, 5) : []),
    [value, products],
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
      window.location.href = href(`produits/${suggestions[active].product.slug}/`);
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
                href={href(`produits/${product.slug}/`)}
                className={active === i ? 'selected' : ''}
              >
                <img src={href(product.image.smallPath)} alt="" width="44" height="44" />
                <span>
                  {product.labelFr}
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
