'use client';

import { Plus, Search } from 'lucide-react';
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
    <Page className="pb-36 lg:pb-12">
      <section aria-labelledby="page-title" className="grid gap-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <PageTitle>{ingredientCopy.title}</PageTitle>
            <p className="text-sm text-muted-foreground">
              {ingredients.length} bahan
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="min-h-12 rounded-full"
            onClick={() => openForm()}
          >
            <Plus aria-hidden="true" />
            {ingredientCopy.add}
          </Button>
        </header>
        <MarginAlarm />
        {ingredients.length === 0 ? (
          <EmptyState
            title={ingredientCopy.emptyTitle}
            description={ingredientCopy.emptyDescription}
          />
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
                className="min-h-12 rounded-[10px] bg-surface pl-10"
                placeholder={ingredientCopy.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <IngredientList query={query} onEdit={openForm} />
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
