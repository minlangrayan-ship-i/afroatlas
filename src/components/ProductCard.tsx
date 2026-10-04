import type { CardProduct } from '../lib/catalogue';
import { href } from '../lib/links';
import { categories } from '../data/countries';
import ProductActions from './ProductActions';
export default function ProductCard({
  product,
  match = '',
}: {
  product: CardProduct;
  match?: string;
}) {
  const previews = product.names
    .filter((n) => ['fr', 'en', 'sw', 'ar'].includes(n.languageCode || ''))
    .slice(0, 3);
  return (
    <article className="product-card">
      <a className="card-photo" href={href(`produits/${product.slug}/`)}>
        <img
          src={href(product.image.smallPath)}
          srcSet={`${href(product.image.smallPath)} 400w, ${href(product.image.localPath)} 960w`}
          sizes="(max-width: 700px) 90vw, 30vw"
          width={product.image.width}
          height={product.image.height}
          alt={product.image.altFr}
          loading="lazy"
        />
        <span className="photo-tag">
          {categories.find((c) => c.id === product.categoryId)?.label}
        </span>
      </a>
      <div className="card-body">
        <a href={href(`produits/${product.slug}/`)}>
          <h3>{product.labelFr}</h3>
        </a>
        <p className="card-names">{previews.map((n) => n.name).join(' · ')}</p>
        {match && <p className="match-note">{match}</p>}
        <div className="card-bottom">
          <a className="text-link" href={href(`produits/${product.slug}/`)}>
            Explorer la fiche ↗
          </a>
          <ProductActions id={product.id} />
        </div>
      </div>
    </article>
  );
}
