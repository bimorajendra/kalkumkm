import type { Metadata } from 'next';
import { Page, PageTitle } from '@/components/takaran/page';
import { recipeCopy } from '@/features/recipes/copy';
import { RecipeList } from '@/features/recipes/recipe-list';

export const metadata: Metadata = { title: 'Resep' };

export default function ResepPage() {
  return (
    <Page>
      <section aria-labelledby="page-title" className="grid gap-4">
        <PageTitle>{recipeCopy.title}</PageTitle>
        <RecipeList />
      </section>
    </Page>
  );
}
