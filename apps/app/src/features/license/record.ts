export function getLicenseCode(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (
    value &&
    typeof value === 'object' &&
    'code' in value &&
    typeof value.code === 'string'
  )
    return value.code || null;
  return null;
}
