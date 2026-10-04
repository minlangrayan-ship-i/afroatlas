/** Bound requests even when Content-Length is absent (chunked uploads). */
export async function boundedForm(req: Request, limit = 5500000): Promise<FormData> {
  if (!req.body || Number(req.headers.get('content-length') || 0) > limit)
    throw new Error('Request too large or empty');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Request too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return new Response(body, {
    headers: { 'content-type': req.headers.get('content-type') || '' },
  }).formData();
}
