import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
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
    {
      path: '../../node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: { default: 'Takaran', template: '%s | Takaran' },
  description:
    'Hitung HPP, harga jual, dan untung per jam untuk usaha makanan rumahan.',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  applicationName: 'Takaran',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Takaran',
    title: 'Takaran, kalkulator HPP usaha makanan rumahan',
    description:
      'Hitung modal per porsi, tentukan harga jual, dan cek untung usaha makanan rumahan.',
  },
  twitter: {
    card: 'summary',
    title: 'Takaran, kalkulator HPP usaha makanan rumahan',
    description:
      'Hitung modal per porsi, tentukan harga jual, dan cek untung usaha makanan rumahan.',
  },
};

export const viewport: Viewport = { themeColor: '#fcf8f5' };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="light" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
