import type { Metadata } from 'next';
import { Page } from '@/components/takaran/page';
import { RecipeList } from '@/features/recipes/recipe-list';

export const metadata: Metadata = { title: 'Resep' };

export default function ResepPage() {
  return (
    <Page>
      <RecipeList />
    </Page>
  );
}
