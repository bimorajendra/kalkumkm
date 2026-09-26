import { createPrivateKey, randomBytes, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function ulid() {
  let time = BigInt(Date.now());
  let timestamp = '';
  for (let index = 0; index < 10; index += 1) {
    timestamp = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Number(time & 31n)] + timestamp;
    time >>= 5n;
  }
  const random = Array.from(
    randomBytes(16),
    (byte) => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[byte % 32],
  ).join('');
  return timestamp + random;
}

const name = arg('--name')?.trim();
const orderId = arg('--order');
if (!name || !orderId) {
  throw new Error('Pakai: node scripts/issue-license.mjs --name "Nama usaha" --order ID_PESANAN');
}
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const seedText = env.LICENSE_PRIVATE_KEY;
if (!seedText || !/^[A-Za-z0-9_-]+$/.test(seedText)) {
  throw new Error('LICENSE_PRIVATE_KEY tidak tersedia di .env.local.');
}
const seed = Buffer.from(seedText, 'base64url');
if (seed.length !== 32) throw new Error('LICENSE_PRIVATE_KEY tidak valid.');
if (name.length > 120) throw new Error('Nama usaha terlalu panjang.');
const payload = {
  v: 1,
  id: `lic_${ulid()}`,
  n: name,
  p: 'pro',
  t: Math.floor(Date.now() / 1000),
};
const message = Buffer.from(JSON.stringify(payload));
const privateKey = createPrivateKey({
  key: Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    seed,
  ]),
  format: 'der',
  type: 'pkcs8',
});
const code = `${message.toString('base64url')}.${sign(null, message, privateKey).toString('base64url')}`;
const appUrl = env.APP_URL;
if (!appUrl) throw new Error('APP_URL belum diatur di .env.local.');
console.log(
  JSON.stringify(
    { orderId, link: `${new URL('/aktivasi', appUrl).toString()}#${code}` },
    null,
    2,
  ),
);
