import { withLocale } from '../lib/locale-react';
import type { CardProduct } from '../lib/catalogue';
import { href } from '../lib/links';
import { categories } from '../data/countries';
import ProductActions from './ProductActions';
function ProductCard({ product, match = '' }: { product: CardProduct; match?: string }) {
  const previews = product.names
    .filter((n) => n.nameType !== 'input' && n.nameType !== 'scientific')
    .slice(0, 3);
  return (
    <article className="product-card">
      <a className="card-photo" href={href(`produits/${product.slug}/`)}>
        {product.image.role === 'primary' ? (
          <img
            src={href(product.image.smallPath)}
            srcSet={`${href(product.image.smallPath)} 400w, ${href(product.image.localPath)} 960w`}
            sizes="(max-width: 700px) 90vw, 30vw"
            width={product.image.width}
            height={product.image.height}
            alt={product.image.altFr}
            loading="lazy"
          />
        ) : (
          <span className="photo-gap">Photo de la forme recherchée à documenter</span>
        )}
        <span className="photo-tag">
          {categories.find((c) => c.id === product.categoryId)?.label}
        </span>
      </a>
      <div className="card-body">
        <a href={href(`produits/${product.slug}/`)}>
          <h3
            data-product-label
            data-no-translate
            data-fr={product.labelFr}
            data-en={product.labelEn || ''}
            data-ar={
              product.labelAr || product.names.find((n) => n.languageCode === 'ar')?.name || ''
            }
          >
            {product.labelFr}
          </h3>
        </a>
        <p className="card-names" data-no-translate dir="auto">
          {previews.map((n) => (
            <bdi key={n.id} lang={n.languageCode || undefined}>
              {n.name} ·{' '}
            </bdi>
          ))}
        </p>
        <p className="table-note">
          {product.consumedPart && (
            <>
              <span>
                {product.documentaryScope === 'organism' ? 'Identité couverte' : 'Partie consommée'}
              </span>{' '}
              : {product.consumedPart} ·{' '}
            </>
          )}
          Forme photographiée :{' '}
          {product.image.role === 'primary' ? product.image.depictedForm : 'non documentée'}
        </p>
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

export default withLocale(ProductCard);
