import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import './globals.css';

const jakarta = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Takaran', template: '%s | Takaran' },
  description:
    'Hitung HPP, harga jual, dan untung per jam untuk usaha makanan rumahan.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#fbf6f1' };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="id" suppressHydrationWarning className={jakarta.variable}>
      <head>
        <script nonce={nonce} src="/theme-init.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
