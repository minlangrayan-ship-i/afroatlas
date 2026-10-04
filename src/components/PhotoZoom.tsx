import { useRef } from 'react';
import type { ImageAsset } from '../lib/schema';
import { href } from '../lib/links';
import { useClientReady } from '../lib/use-client-ready';
export default function PhotoZoom({ image, label }: { image: ImageAsset; label: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ready = useClientReady();
  return (
    <>
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
