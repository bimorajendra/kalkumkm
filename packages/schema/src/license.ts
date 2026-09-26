import { z } from 'zod';

export const licensePayloadSchema = z
  .object({
    v: z.literal(1),
    id: z.string().regex(/^lic_[0-9A-HJKMNP-TV-Z]{26}$/),
    n: z.string().trim().min(1).max(120),
    p: z.literal('pro'),
    t: z.number().int().positive().safe(),
  })
  .strict();

export type LicensePayload = z.infer<typeof licensePayloadSchema>;

export const licenseRecordSchema = z
  .object({
    code: z.string().min(1).max(1024),
    payload: licensePayloadSchema.nullable(),
    activatedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export type LicenseRecord = z.infer<typeof licenseRecordSchema>;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('Kode lisensi tidak valid.');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function canonicalLicensePayload(payload: LicensePayload): string {
  return JSON.stringify({
    v: payload.v,
    id: payload.id,
    n: payload.n,
    p: payload.p,
    t: payload.t,
  });
}

export function encodeLicenseCode(
  payload: LicensePayload,
  signature: Uint8Array,
): string {
  const valid = licensePayloadSchema.parse(payload);
  if (signature.length !== 64)
    throw new Error('Tanda tangan lisensi tidak valid.');
  return `${base64Url(new TextEncoder().encode(canonicalLicensePayload(valid)))}.${base64Url(signature)}`;
}

export function decodeLicenseCode(code: string): {
  payload: LicensePayload;
  message: Uint8Array;
  signature: Uint8Array;
} {
  if (code.length > 1024) throw new Error('Kode lisensi tidak valid.');
  const parts = code.trim().split('.');
  if (parts.length !== 2) throw new Error('Kode lisensi tidak valid.');
  const message = fromBase64Url(parts[0] ?? '');
  const signature = fromBase64Url(parts[1] ?? '');
  if (signature.length !== 64) throw new Error('Kode lisensi tidak valid.');
  const parsed: unknown = JSON.parse(new TextDecoder().decode(message));
  const payload = licensePayloadSchema.parse(parsed);
  if (canonicalLicensePayload(payload) !== new TextDecoder().decode(message))
    throw new Error('Kode lisensi tidak valid.');
  return { payload, message, signature };
}
