'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useSnapshot } from '@/components/takaran/data-provider';
import { EmptyState, Page, PageTitle } from '@/components/takaran/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { IngredientRow } from '@/domain/types';
import { MarginAlarm } from '@/features/margin-alarm/margin-alarm';
import { ingredientCopy } from './copy';
import { IngredientForm } from './ingredient-form';
import { IngredientList } from './ingredient-list';

export function BahanScreen() {
  const { ingredients } = useSnapshot();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientRow>();

  function openForm(ingredient?: IngredientRow) {
    setEditing(ingredient);
    setFormOpen(true);
  }

  return (
    <Page>
      <MarginAlarm />
      <section aria-labelledby="page-title" className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <PageTitle>{ingredientCopy.title}</PageTitle>
          {ingredients.length > 0 ? (
            <Button
              type="button"
              className="hidden lg:inline-flex"
              onClick={() => openForm()}
            >
              {ingredientCopy.add}
            </Button>
          ) : null}
        </div>
        {ingredients.length === 0 ? (
          <EmptyState
            title={ingredientCopy.emptyTitle}
            description={ingredientCopy.emptyDescription}
          >
            <Button type="button" onClick={() => openForm()}>
              {ingredientCopy.add}
            </Button>
          </EmptyState>
        ) : (
          <>
            <div className="relative">
              <label className="sr-only" htmlFor="ingredient-search">
                {ingredientCopy.searchLabel}
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="ingredient-search"
                type="search"
                className="pl-10"
                placeholder={ingredientCopy.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <IngredientList query={query} onEdit={openForm} />
            <Button
              type="button"
              size="lg"
              className="fixed inset-x-4 bottom-20 z-20 shadow-floating lg:hidden"
              onClick={() => openForm()}
            >
              {ingredientCopy.add}
            </Button>
          </>
        )}
      </section>
      <IngredientForm
        open={formOpen}
        ingredient={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
      />
    </Page>
  );
}
