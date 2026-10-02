import { afterEach, expect, it, vi } from 'vitest';

const execute = vi.fn();
vi.mock('@/server/db', () => ({ getDb: async () => ({ execute }) }));

import { GET } from '@/app/api/health/route';

afterEach(() => vi.resetAllMocks());

it('readiness memeriksa database dan tidak dapat dicache', async () => {
  execute.mockResolvedValueOnce([]);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(execute).toHaveBeenCalledOnce();
  expect(await response.json()).toEqual({ status: 'ok' });
});

it('kegagalan database memberi 503 tanpa detail koneksi', async () => {
  execute.mockRejectedValueOnce(new Error('private connection details'));
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private');
});
