import * as ed from '@noble/ed25519';
import {
  decodeLicenseCode,
  type LicensePayload,
  licensePayloadSchema,
} from '@takaran/schema';
import { licensePublicKeys } from './keys';

export async function verifyLicenseCode(code: string): Promise<LicensePayload> {
  const decoded = decodeLicenseCode(code.replace(/[\r\n\s]/g, ''));
  const publicKey = licensePublicKeys[decoded.payload.v];
  if (!publicKey || publicKey.length !== 32)
    throw new Error('Versi kunci lisensi tidak dikenal.');
  if (!(await ed.verifyAsync(decoded.signature, decoded.message, publicKey)))
    throw new Error('Tanda tangan lisensi tidak cocok.');
  return licensePayloadSchema.parse(decoded.payload);
}
