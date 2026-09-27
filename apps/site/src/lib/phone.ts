/** Nomor WhatsApp Indonesia dalam format 62xxxxxxxxxx, atau null bila tidak valid. */
export function normalizeWhatsApp(value: string): string | null {
  const input = value.trim();
  if (!/^\+?[\d\s()-]+$/.test(input)) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('08')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62') && digits.length >= 10 && digits.length <= 15)
    return digits;
  return null;
}
