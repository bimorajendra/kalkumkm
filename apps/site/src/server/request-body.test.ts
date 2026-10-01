import { describe, expect, it } from 'vitest';
import { readLimitedText } from './request-body';

describe('readLimitedText', () => {
  it('menerima body yang masih di dalam batas byte', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: 'isi',
    });

    await expect(readLimitedText(request, 3)).resolves.toEqual({
      ok: true,
      text: 'isi',
    });
  });

  it('menghentikan body yang melewati batas byte', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: 'terlalu besar',
    });

    await expect(readLimitedText(request, 5)).resolves.toEqual({
      ok: false,
      reason: 'too_large',
    });
  });

  it('menolak body yang bukan UTF-8 valid', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: new Uint8Array([0xff]),
    });

    await expect(readLimitedText(request, 5)).resolves.toEqual({
      ok: false,
      reason: 'invalid_encoding',
    });
  });
});
