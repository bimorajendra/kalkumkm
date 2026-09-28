// Cek anggaran ukuran (AGENTS.md aturan 6, diubah oleh CHANGE-001) dari hasil
// `next build`: JS awal satu halaman <= 220 KB gzip, total muatan awal
// <= 300 KB gzip. Muatan awal = JS + CSS halaman, ditambah font yang dipreload.
// Polyfill nomodule tidak dihitung karena browser modern tidak memuatnya.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = join(import.meta.dirname, '../apps/site/.next');
if (!existsSync(root)) {
  console.error('Jalankan `pnpm build` dulu.');
  process.exit(1);
}

const JS_LIMIT = 220 * 1024;
const TOTAL_LIMIT = 300 * 1024;
const routes = [
  {
    name: 'Kalkulator (/dashboard/hitung)',
    manifest: 'app/(app)/dashboard/hitung/page',
  },
  {
    name: 'Dashboard (/dashboard)',
    manifest: 'app/(app)/dashboard/page',
  },
  { name: 'Landing (/)', manifest: 'app/(marketing)/page' },
  { name: 'Halaman statis (/kebijakan-privasi)', manifest: 'app/kebijakan-privasi/page' },
];

const buildManifest = JSON.parse(
  readFileSync(join(root, 'build-manifest.json'), 'utf8'),
);
const gz = (file) => gzipSync(readFileSync(join(root, file))).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function assetsFor(manifestPath) {
  const source = readFileSync(
    join(root, 'server', `${manifestPath}_client-reference-manifest.js`),
    'utf8',
  );
  const files = new Set(buildManifest.rootMainFiles ?? []);
  for (const match of source.matchAll(/\/_next\/(static\/[^"\\]+\.js)/g))
    files.add(match[1]);
  for (const match of source.matchAll(/static\/chunks\/[\w-]+\.css/g))
    files.add(match[0]);
  return [...files].filter((file) => existsSync(join(root, file)));
}

// Font yang dipreload di halaman pertama: semua .woff2 di static/media.
const fonts = existsSync(join(root, 'static/media'))
  ? readdirSync(join(root, 'static/media'))
      .filter((file) => file.endsWith('.woff2'))
      .map((file) => `static/media/${file}`)
  : [];

let failed = false;
for (const route of routes) {
  const files = assetsFor(route.manifest);
  const js = files.filter((file) => file.endsWith('.js'));
  const css = files.filter((file) => file.endsWith('.css'));
  const jsSize = js.reduce((sum, file) => sum + gz(file), 0);
  const cssSize = css.reduce((sum, file) => sum + gz(file), 0);
  const fontSize = fonts.reduce((sum, file) => sum + gz(file), 0);
  const total = jsSize + cssSize + fontSize;
  const ok = jsSize <= JS_LIMIT && total <= TOTAL_LIMIT;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'LULUS' : 'GAGAL'}  ${route.name}: JS ${kb(jsSize)} (batas ${kb(JS_LIMIT)}), ` +
      `total ${kb(total)} (batas ${kb(TOTAL_LIMIT)}) [CSS ${kb(cssSize)}, font ${kb(fontSize)}]`,
  );
}
process.exit(failed ? 1 : 0);
