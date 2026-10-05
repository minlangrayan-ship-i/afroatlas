import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickImageInfo,
  MagickReadSettings,
  ResourceLimits,
} from 'npm:@imagemagick/magick-wasm@0.0.44';
import { photoSignature } from './validation.ts';
let initialized: Promise<void> | null = null;
async function initialize() {
  if (!initialized)
    initialized = (async () => {
      const bytes = await Deno.readFile(
        new URL(import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.44/magick.wasm')),
      );
      await initializeImageMagick(bytes);
      ResourceLimits.memory = 100663296n;
      ResourceLimits.disk = 0n;
      ResourceLimits.listLength = 8n;
      ResourceLimits.width = 8000n;
      ResourceLimits.height = 8000n;
    })();
  return initialized;
}
export async function sanitizePhoto(bytes: Uint8Array, mime: string) {
  if (bytes.length === 0 || bytes.length > 5242880 || !photoSignature(bytes, mime))
    throw new Error('Invalid photo');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    mime === 'image/webp' &&
    new TextDecoder().decode(bytes.slice(12, 16)) === 'VP8X' &&
    bytes[20] & 2
  )
    throw new Error('Animated photo');
  if (mime === 'image/png')
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (new TextDecoder().decode(bytes.slice(offset + 4, offset + 8)) === 'acTL')
        throw new Error('Animated photo');
      offset += size + 12;
    }
  await initialize();
  const settings = new MagickReadSettings({
    format:
      mime === 'image/jpeg'
        ? MagickFormat.Jpeg
        : mime === 'image/png'
          ? MagickFormat.Png
          : MagickFormat.WebP,
    frameCount: 1,
  });
  const info = MagickImageInfo.create(bytes, settings);
  if (
    !info.width ||
    !info.height ||
    info.width > 8000 ||
    info.height > 8000 ||
    info.width * info.height > 12000000
  )
    throw new Error('Invalid photo dimensions');
  // Decode, rotate then re-encode; strip EXIF/GPS and appended file content.
  return ImageMagick.read(bytes, settings, (image) => {
    image.autoOrient();
    const ratio = Math.min(1, 1600 / image.width, 1600 / image.height);
    if (ratio < 1) image.resize(Math.round(image.width * ratio), Math.round(image.height * ratio));
    image.strip();
    image.quality = 82;
    return image.write(MagickFormat.WebP, (data) => Uint8Array.from(data));
  });
}
