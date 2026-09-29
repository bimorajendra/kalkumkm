import type { Metadata } from 'next';
import { HitungScreen } from '@/features/pricing/hitung-screen';
import { RecipePickerPage } from '@/features/pricing/recipe-picker-page';

export const metadata: Metadata = { title: 'Hitung HPP' };

export default async function HitungPage({
  searchParams,
}: {
  searchParams: Promise<{
    resep?: string | string[];
    asal?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const recipeId = Array.isArray(params.resep) ? params.resep[0] : params.resep;
  if (!recipeId) return <RecipePickerPage />;
  const fromPicker =
    (Array.isArray(params.asal) ? params.asal[0] : params.asal) === 'menu';
  return <HitungScreen initialRecipeId={recipeId} fromPicker={fromPicker} />;
}
