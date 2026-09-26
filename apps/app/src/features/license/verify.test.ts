import * as ed from '@noble/ed25519';
import { encodeLicenseCode } from '@takaran/schema';
import { afterEach, describe, expect, it } from 'vitest';
import { licensePublicKeys } from './keys';
import { verifyLicenseCode } from './verify';

const seed = Uint8Array.from({ length: 32 }, (_, index) => index + 1);
const payload = {
  v: 1 as const,
  id: 'lic_01J8M9G5QZ0E3T2A1B7C6D5F4G',
  n: 'Dapur Sari',
  p: 'pro' as const,
  t: 1790000000,
};

afterEach(() => {
  delete licensePublicKeys[1];
});

describe('verifikasi lisensi offline', () => {
  it('menerima tanda tangan valid', async () => {
    licensePublicKeys[1] = await ed.getPublicKeyAsync(seed);
    const message = new TextEncoder().encode(JSON.stringify(payload));
    const signature = await ed.signAsync(message, seed);
    await expect(
      verifyLicenseCode(encodeLicenseCode(payload, signature)),
    ).resolves.toMatchObject({ n: 'Dapur Sari' });
  });

  it('menolak kode yang diubah dan versi kunci tidak dikenal', async () => {
    licensePublicKeys[1] = await ed.getPublicKeyAsync(seed);
    const message = new TextEncoder().encode(JSON.stringify(payload));
    const signature = await ed.signAsync(message, seed);
    const code = encodeLicenseCode(payload, signature);
    await expect(verifyLicenseCode(`${code.slice(0, -1)}A`)).rejects.toThrow();
    delete licensePublicKeys[1];
    await expect(verifyLicenseCode(code)).rejects.toThrow(
      'Versi kunci lisensi tidak dikenal.',
    );
  });
});
