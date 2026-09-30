import type { MetadataRoute } from 'next';
import { articles } from '@/features/articles/content';

const publicPaths = [
  '/',
  '/fitur',
  '/harga',
  '/cara-hitung',
  '/kebijakan-privasi',
  '/artikel',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = new URL(process.env.APP_URL || 'http://localhost:3000');
  const staticPages = publicPaths.map((path) => ({
    url: new URL(path, origin).href,
    changeFrequency: 'monthly' as const,
    priority: path === '/' ? 1 : path === '/artikel' ? 0.8 : 0.7,
  }));
  const articlePages = articles.map((article) => ({
    url: new URL(`/artikel/${article.slug}`, origin).href,
    lastModified: article.updatedAt,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...articlePages];
}
