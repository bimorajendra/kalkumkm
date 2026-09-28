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
    <Page className="pb-36 lg:pb-12">
      <MarginAlarm />
      <section aria-labelledby="page-title" className="grid gap-5">
        <header className="grid gap-2 sm:flex sm:items-end sm:justify-between">
          <div>
            <PageTitle>{ingredientCopy.title}</PageTitle>
            <p className="mt-2 text-muted-foreground">
              Catat harga dari struk belanja agar modal resepmu ikut terbarui.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {ingredients.length} bahan tersimpan
          </p>
        </header>
        {ingredients.length === 0 ? (
          <EmptyState
            title={ingredientCopy.emptyTitle}
            description={ingredientCopy.emptyDescription}
          >
            <Button
              type="button"
              size="lg"
              onClick={() => openForm()}
              className="rounded-full"
            >
              {ingredientCopy.add}
            </Button>
          </EmptyState>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                  className="min-h-12 rounded-[10px] border-line bg-surface pl-10"
                  placeholder={ingredientCopy.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Button
                type="button"
                size="lg"
                className="min-h-12 rounded-full"
                onClick={() => openForm()}
              >
                {ingredientCopy.add}
              </Button>
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
