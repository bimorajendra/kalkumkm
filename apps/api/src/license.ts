import * as ed from '@noble/ed25519';
import {
  canonicalLicensePayload,
  encodeLicenseCode,
  licensePayloadSchema,
} from '@takaran/schema';

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('Kunci lisensi tidak valid.');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function ulid(): string {
  const time = Date.now();
  let timestamp = BigInt(time);
  let timePart = '';
  for (let index = 0; index < 10; index += 1) {
    timePart =
      '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Number(timestamp & 31n)] + timePart;
    timestamp >>= 5n;
  }
  const random = crypto.getRandomValues(new Uint8Array(16));
  let randomPart = '';
  for (const byte of random)
    randomPart += '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[byte % 32];
  return timePart + randomPart;
}

export async function issueLicense(name: string, privateKeyText: string) {
  const seed = decodeBase64Url(privateKeyText);
  if (seed.length !== 32) throw new Error('Kunci lisensi tidak valid.');
  const payload = licensePayloadSchema.parse({
    v: 1,
    id: `lic_${ulid()}`,
    n: name.trim(),
    p: 'pro',
    t: Math.floor(Date.now() / 1000),
  });
  const message = new TextEncoder().encode(canonicalLicensePayload(payload));
  const signature = await ed.signAsync(message, seed);
  return { payload, code: encodeLicenseCode(payload, signature) };
}
