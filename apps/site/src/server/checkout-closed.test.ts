import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/session', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/server/db', () => ({
  getDb: vi.fn(() => {
    throw new Error('Checkout tertutup tidak boleh membuka database.');
  }),
}));
vi.mock('@/server/env', () => ({
  mayarConfig: vi.fn(() => {
    throw new Error('Checkout tertutup tidak boleh memakai Mayar.');
  }),
}));

import { startCheckout } from '@/app/(app)/dashboard/beli/actions';
import { getDb } from './db';
import { mayarConfig } from './env';
import { getSessionUser } from './session';

describe('checkout sebelum Pro dibuka', () => {
  it.each([
    null,
    { id: 'buyer', name: 'Penguji', email: 'buyer@contoh.id', image: null },
  ])('menolak checkout langsung tanpa membuat pesanan atau menghubungi Mayar (%j)', async (user) => {
    vi.mocked(getSessionUser).mockResolvedValue(user);
    const result = await startCheckout({
      businessName: 'Usaha uji',
      whatsapp: '081234567890',
      consent: true,
    });
    expect(result).toEqual({
      ok: false,
      message: 'Takaran Pro segera hadir. Pembelian belum dibuka.',
    });
    expect(getDb).not.toHaveBeenCalled();
    expect(mayarConfig).not.toHaveBeenCalled();
  });
});
