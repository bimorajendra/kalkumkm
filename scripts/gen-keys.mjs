import { randomBytes, createPrivateKey, createPublicKey } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envPath = resolve(root, '.env.local');
const existingEnv = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
if (/^LICENSE_PRIVATE_KEY=/m.test(existingEnv)) {
  throw new Error('LICENSE_PRIVATE_KEY sudah ada di .env.local; skrip tidak akan menimpanya.');
}
const seed = randomBytes(32);
const privateKey = createPrivateKey({
  key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
  format: 'der',
  type: 'pkcs8',
});
const publicDer = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
const publicKey = publicDer.subarray(-32);
const b64url = (value) => value.toString('base64url');
const secretLine = `LICENSE_PRIVATE_KEY=${b64url(seed)}\n`;
if (existingEnv) {
  appendFileSync(envPath, `${existingEnv.endsWith('\n') ? '' : '\n'}${secretLine}`, { mode: 0o600 });
} else {
  writeFileSync(envPath, secretLine, { flag: 'wx', mode: 0o600 });
}
const keysPath = resolve(root, 'apps/app/src/features/license/keys.ts');
writeFileSync(
  keysPath,
  `export const licensePublicKeys: Record<number, Uint8Array> = {\n  1: Uint8Array.from([${Array.from(publicKey).join(', ')}]),\n};\n`,
);
console.log('Kunci lisensi siap. Secret disimpan di .env.local yang diabaikan Git. Pasang secret yang sama pada Cloudflare Worker.');
