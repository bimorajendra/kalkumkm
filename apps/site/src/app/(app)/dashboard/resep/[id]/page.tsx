import type { Metadata } from 'next';
import { ResepDetailScreen } from '@/features/recipes/resep-detail-screen';

export const metadata: Metadata = { title: 'Detail resep' };

export default async function ResepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResepDetailScreen id={id} />;
}
