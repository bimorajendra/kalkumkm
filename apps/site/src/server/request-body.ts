export type LimitedTextResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'too_large' | 'invalid_encoding' };

export async function readLimitedText(
  request: Request,
  maxBytes: number,
): Promise<LimitedTextResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0)
    throw new RangeError('Batas body harus bilangan bulat non-negatif.');

  const contentLength = request.headers.get('content-length');
  if (
    contentLength &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > maxBytes
  )
    return { ok: false, reason: 'too_large' };

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, text: '' };

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return {
      ok: true,
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    };
  } catch {
    return { ok: false, reason: 'invalid_encoding' };
  }
}
