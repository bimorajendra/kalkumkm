'use client';

import { type CalcError, type RecipeResult, recalcAll } from '@takaran/calc';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { dispatch } from '@/app/(app)/actions';
import type { Command } from '@/domain/commands';
import type { DomainErrorCode, Snapshot } from '@/domain/types';

export class CommandError extends Error {
  constructor(
    readonly code:
      | DomainErrorCode
      | 'UNAUTHENTICATED'
      | 'RATE_LIMITED'
      | 'SERVER',
    message: string,
    readonly trigger?: 'recipe' | 'channel' | 'sub_recipe' | 'quote',
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

interface DataContextValue {
  snapshot: Snapshot;
  run: (command: Command) => Promise<Snapshot>;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * Menyimpan data akun di memori klien. Setiap perubahan dikirim ke server dan
 * hasilnya (data terbaru) menggantikan isi di sini, jadi layar selalu sama
 * dengan yang tersimpan.
 */
export function DataProvider({
  initial,
  children,
}: {
  initial: Snapshot;
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const router = useRouter();
  const run = useCallback(
    async (command: Command) => {
      const result = await dispatch(command);
      if (!result.ok) {
        if (result.code === 'UNAUTHENTICATED') router.push('/masuk');
        throw new CommandError(result.code, result.message, result.trigger);
      }
      setSnapshot(result.snapshot);
      return result.snapshot;
    },
    [router],
  );
  const value = useMemo(() => ({ snapshot, run }), [snapshot, run]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('DataProvider belum dipasang.');
  return value;
}

export const useSnapshot = () => useData().snapshot;
export const useRun = () => useData().run;

export type Results = Map<string, RecipeResult | CalcError>;

/** Hasil hitung semua resep. Dihitung ulang di klien setiap data berubah. */
export function useRecipeResults(): {
  snapshot: Snapshot;
  results: Results;
  error: boolean;
} {
  const snapshot = useSnapshot();
  return useMemo(() => {
    try {
      const results = recalcAll({
        ingredients: new Map(
          snapshot.ingredients.map((item) => [item.id, item]),
        ),
        recipes: new Map(snapshot.recipes.map((item) => [item.id, item])),
        roundingStep: snapshot.settings.roundingStep,
      }) as Results;
      return { snapshot, results, error: false };
    } catch {
      return { snapshot, results: new Map() as Results, error: true };
    }
  }, [snapshot]);
}

/** Pesan dari kegagalan perintah, untuk ditampilkan di formulir. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof CommandError ? error.message : fallback;
}
