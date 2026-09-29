"use client";

import { formatRupiah } from "@takaran/ui/format";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRecipeResults } from "@/components/takaran/data-provider";
import { EmptyState, Page, PageTitle } from "@/components/takaran/page";
import { Button } from "@/components/ui/button";

export function RecipePickerPage() {
  const { snapshot, error } = useRecipeResults();
  const { recipes } = snapshot;

  if (error)
    return (
      <Page>
        <p role="alert">
          Daftar resep tidak bisa dibuka. Muat ulang halaman untuk mencoba lagi.
        </p>
      </Page>
    );

  return (
    <Page className="grid content-start gap-5">
      <header>
        <PageTitle>Hitung HPP</PageTitle>
        <p className="mt-1 text-muted-foreground">
          Pilih resep untuk melihat modal dan harga jualnya.
        </p>
      </header>
      {recipes.length ? (
        <ul className="grid gap-3 sm:max-w-3xl">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Button
                asChild
                variant="outline"
                className="h-auto min-h-16 w-full justify-between rounded-2xl border-line bg-surface px-4 py-3 text-left"
              >
                <Link
                  href={`/dashboard/hitung?resep=${encodeURIComponent(recipe.id)}&asal=menu`}
                >
                  <span className="grid gap-1">
                    <span className="font-semibold">{recipe.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {recipe.yieldPortions} porsi per adonan ·{" "}
                      {recipe.currentPrice === null
                        ? "Harga jual belum diatur"
                        : `Harga jual ${formatRupiah(recipe.currentPrice)}`}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Belum ada resep untuk dihitung."
          description="Buat resep terlebih dahulu agar HPP bisa dihitung."
        >
          <Button asChild>
            <Link href="/dashboard/resep">Buat resep</Link>
          </Button>
        </EmptyState>
      )}
    </Page>
  );
}
