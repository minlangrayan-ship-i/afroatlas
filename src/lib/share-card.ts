// Draws the seller card as a portrait image (1080 × 1350) to send by WhatsApp or post on
// social networks. Everything is drawn locally from same-origin files; nothing is uploaded.
export type ShareCardInput = {
  title: string;
  request: string;
  names: { name: string; language: string }[];
  destination?: string;
  photo?: string;
  footer: string;
  url: string;
  credit?: string;
};
const width = 1080,
  height = 1350;
const colors = { cream: '#faf7ef', green: '#193d30', terracotta: '#b94c35', muted: '#667064' };
const arabic = /[؀-ۿ]/;

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
function lines(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}
function write(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.direction = arabic.test(text) ? 'rtl' : 'ltr';
  ctx.fillText(text, x, y);
}

export async function drawShareCard(input: ShareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 0, width, height);
  const photoHeight = 560;
  const image = input.photo ? await loadImage(input.photo) : null;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, photoHeight);
  ctx.clip();
  if (image) {
    // Cover the band without distortion.
    const scale = Math.max(width / image.naturalWidth, photoHeight / image.naturalHeight);
    const w = image.naturalWidth * scale,
      h = image.naturalHeight * scale;
    ctx.drawImage(image, (width - w) / 2, (photoHeight - h) / 2, w, h);
  } else {
    ctx.fillStyle = colors.green;
    ctx.fillRect(0, 0, width, photoHeight);
  }
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = photoHeight + 90;
  ctx.fillStyle = colors.green;
  ctx.font = 'bold 64px Georgia, serif';
  for (const line of lines(ctx, input.title, 960).slice(0, 2)) {
    write(ctx, line, width / 2, y);
    y += 72;
  }
  ctx.fillStyle = colors.muted;
  ctx.font = '32px Arial, sans-serif';
  for (const line of lines(ctx, input.request, 960).slice(0, 2)) {
    write(ctx, line, width / 2, y);
    y += 42;
  }
  if (input.destination) {
    write(ctx, input.destination, width / 2, y);
    y += 42;
  }
  y += 24;
  for (const n of input.names.slice(0, 3)) {
    ctx.fillStyle = colors.terracotta;
    ctx.font = 'bold 52px Georgia, serif';
    write(ctx, n.name, width / 2, y);
    y += 40;
    ctx.fillStyle = colors.muted;
    ctx.font = '28px Arial, sans-serif';
    write(ctx, n.language, width / 2, y);
    y += 62;
  }
  ctx.fillStyle = colors.green;
  ctx.fillRect(0, height - 130, width, 130);
  ctx.fillStyle = colors.cream;
  ctx.font = 'bold 36px Georgia, serif';
  write(ctx, input.footer, width / 2, height - 76);
  ctx.font = '28px Arial, sans-serif';
  ctx.direction = 'ltr';
  ctx.fillText(input.url, width / 2, height - 32);
  if (input.credit) {
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(input.credit, width - 20, photoHeight - 16);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/png'),
  );
}

/** Opens the share sheet with the image when supported, otherwise downloads it. */
export async function shareImage(blob: Blob, name: string, text: string, url: string) {
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text: `${text} ${url}` });
    return 'shared';
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  return 'downloaded';
}
