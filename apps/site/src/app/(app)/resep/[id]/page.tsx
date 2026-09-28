import { redirect } from 'next/navigation';

export default async function LegacyResepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/resep/${encodeURIComponent(id)}`);
}
