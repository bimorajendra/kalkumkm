import type { MetadataRoute } from 'next';
import { articles } from '@/features/articles/content';
import { useCases } from '@/features/seo/use-cases';

const publicPaths = [
  '/',
  '/fitur',
  '/harga',
  '/cara-hitung',
  '/kebijakan-privasi',
  '/artikel',
  '/kalkulator-hpp',
  '/margin',
  '/bep',
  '/harga-jual',
  '/harga-ojol',
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
  const useCasePages = useCases.map((item) => ({
    url: new URL(`/usaha/${item.slug}`, origin).href,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages, ...useCasePages];
}
