import { withLocale } from '../lib/locale-react';
import { useEffect, useRef, useState } from 'react';
import { approvedEntries } from '../lib/community';
import type { ImageAsset } from '../lib/schema';
import { href } from '../lib/links';
import { useClientReady } from '../lib/use-client-ready';
function PhotoZoom({
  image: seed,
  label,
  productId,
}: {
  image: ImageAsset;
  label: string;
  productId?: string;
}) {
  const [image, setImage] = useState(seed);
  const [replaced, setReplaced] = useState(false);
  useEffect(() => {
    if (!productId) return;
    let live = true;
    approvedEntries().then((entries) => {
      const e = entries
        .filter((e) => e.kind === 'photo' && e.productId === productId && e.photoUrl)
        .at(-1);
      if (e && live) {
        setImage({
          ...seed,
          role: 'primary',
          localPath: e.photoUrl,
          smallPath: e.photoUrl,
          creator: e.photoCredit,
          licenseId: e.photoLicense,
          sourcePageUrl: e.sourceUrl,
          depictedForm: e.form,
          altFr: `${label} — ${e.form}`,
        });
        setReplaced(true);
      }
    });
    return () => {
      live = false;
    };
  }, [productId, seed, label]);
  const dialog = useRef<HTMLDialogElement>(null);
  const ready = useClientReady();
  if (image.role !== 'primary')
    return <div className="photo-gap">Photo de la forme recherchée à documenter</div>;
  return (
    <>
      {replaced && (
        <p className="photo-credit" data-replaced-photo data-no-translate>
          {image.creator} · {image.licenseId} · {image.depictedForm} ·{' '}
          <a href={image.sourcePageUrl} target="_blank" rel="noopener noreferrer">
            Source ↗
          </a>
        </p>
      )}
      <button
        disabled={!ready}
        className="photo-open"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Agrandir la photographie : ${label}`}
      >
        <img
          src={href(image.localPath)}
          srcSet={`${href(image.smallPath)} 400w, ${href(image.localPath)} 960w`}
          sizes="(max-width: 700px) 100vw, 50vw"
          width={image.width}
          height={image.height}
          alt={image.altFr}
          loading="eager"
        />
        <span>⊕ Agrandir la photographie</span>
      </button>
      <dialog
        ref={dialog}
        className="photo-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="dialog-close"
          onClick={() => dialog.current?.close()}
          aria-label="Fermer la photographie"
        >
          Fermer ×
        </button>
        <img
          src={href(image.localPath)}
          alt={image.altFr}
          width={image.width}
          height={image.height}
        />
        <p>
          {image.creator} ·{' '}
          <a href={image.sourcePageUrl} target="_blank" rel="noopener noreferrer">
            {image.licenseId} ↗
          </a>
        </p>
      </dialog>
    </>
  );
}

export default withLocale(PhotoZoom);
