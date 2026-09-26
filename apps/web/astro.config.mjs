import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

async function inlineHashes(root, tag) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const hashes = new Set();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const path = resolve(entry.parentPath, entry.name);
    const html = await readFile(path, 'utf8');
    let cursor = 0;
    while (true) {
      const start = html.indexOf(`<${tag}`, cursor);
      if (start < 0) break;
      const openEnd = html.indexOf('>', start);
      const closeTag = `</${tag}>`;
      const closeStart = html.indexOf(closeTag, openEnd);
      if (openEnd < 0 || closeStart < 0) break;
      const openingTag = html.slice(start, openEnd + 1);
      if (tag === 'style' || !openingTag.includes('src=')) {
        const content = html.slice(openEnd + 1, closeStart);
        const digest = createHash('sha256').update(content).digest('base64');
        hashes.add(`'sha256-${digest}'`);
      }
      cursor = closeStart + closeTag.length;
    }
  }
  return [...hashes].join(' ');
}

async function styleAttributeHashes(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const hashes = new Set();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const path = resolve(entry.parentPath, entry.name);
    const html = await readFile(path, 'utf8');
    for (const match of html.matchAll(/\sstyle="([^"]*)"/g)) {
      const value = match[1]
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
      const digest = createHash('sha256').update(value).digest('base64');
      hashes.add(`'sha256-${digest}'`);
    }
  }
  return [...hashes].join(' ');
}

function pagesHeaders() {
  return {
    name: 'takaran-pages-headers',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const configuredUmami = process.env.PUBLIC_UMAMI_SCRIPT_URL;
        const umamiOrigin = configuredUmami
          ? new URL(configuredUmami).origin
          : 'https://cloud.umami.is';
        const configuredApi = process.env.PUBLIC_API_BASE_URL;
        const apiOrigin = configuredApi ? new URL(configuredApi).origin : '';
        const apiSource = apiOrigin ? ` ${apiOrigin}` : '';
        if (!umamiOrigin.startsWith('https://'))
          throw new Error('PUBLIC_UMAMI_SCRIPT_URL harus memakai HTTPS.');
        if (
          configuredApi &&
          !apiOrigin.startsWith('https://') &&
          !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(apiOrigin)
        )
          throw new Error('PUBLIC_API_BASE_URL harus memakai HTTPS.');
        const output = fileURLToPath(dir);
        const scriptHashes = await inlineHashes(output, 'script');
        const styleHashes = await inlineHashes(output, 'style');
        const styleAttrHashes = await styleAttributeHashes(output);
        const headers = `/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com ${umamiOrigin}; connect-src 'self'${apiSource} ${umamiOrigin}; frame-src 'self' https://challenges.cloudflare.com; img-src 'self' data: blob:; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Content-Type-Options: nosniff\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`;
        const securedHeaders = headers
          .replace(
            `https://challenges.cloudflare.com ${umamiOrigin};`,
            `https://challenges.cloudflare.com ${umamiOrigin} ${scriptHashes};`,
          )
          .replace(`style-src 'self';`, `style-src 'self' ${styleHashes};`)
          .replace(
            `font-src 'self';`,
            `style-src-attr 'unsafe-hashes' ${styleAttrHashes}; font-src 'self';`,
          );
        await writeFile(resolve(output, '_headers'), securedHeaders, 'utf8');
      },
    },
  };
}

export default defineConfig({ integrations: [react(), pagesHeaders()] });
