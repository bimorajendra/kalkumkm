'use client';

import { ChevronDown, Cookie } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RecipeRow } from '@/domain/types';

/** Chip nama resep aktif. Mengetuknya membuka daftar resep. */
export function RecipePicker({
  recipes,
  selectedId,
  onSelect,
}: {
  recipes: RecipeRow[];
  selectedId: string;
  onSelect: (recipe: RecipeRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = recipes.find((recipe) => recipe.id === selectedId);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-peach-100 px-3 text-caramel-700"
      >
        <Cookie aria-hidden="true" className="size-4" strokeWidth={1.75} />
        <span>
          {selected?.name ?? 'Pilih resep'} · {selected?.yieldPortions ?? 0}{' '}
          potong
        </span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold">
              Pilih resep
            </DialogTitle>
            <DialogDescription className="sr-only">
              Pilih resep yang mau dihitung.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  aria-current={recipe.id === selectedId ? 'true' : undefined}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-1 text-left aria-[current=true]:font-semibold"
                  onClick={() => {
                    onSelect(recipe);
                    setOpen(false);
                  }}
                >
                  <span>{recipe.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {recipe.yieldPortions} potong
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
