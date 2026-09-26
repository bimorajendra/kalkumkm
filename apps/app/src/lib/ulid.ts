const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function createUlid(now = Date.now()): string {
  let timestamp = BigInt(now);
  let timePart = '';
  for (let index = 0; index < 10; index += 1) {
    timePart = alphabet[Number(timestamp & 31n)] + timePart;
    timestamp >>= 5n;
  }
  const randomness = crypto.getRandomValues(new Uint8Array(16));
  return (
    timePart + Array.from(randomness, (byte) => alphabet[byte & 31]).join('')
  );
}
