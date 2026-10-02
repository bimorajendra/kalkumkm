import type { Metadata } from 'next';

export function publicMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: 'Takaran',
      title,
      description,
      url: path,
      images: [{ url: '/icon.png', alt: 'Takaran' }],
    },
    twitter: { card: 'summary', title, description, images: ['/icon.png'] },
  };
}
