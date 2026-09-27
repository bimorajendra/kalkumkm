import { and, eq, inArray, sql } from 'drizzle-orm';
import { DEFAULT_CHANNEL, defaultChannelRow } from '@/domain/channels';
import { applyCommand, type Command, commandSchema } from '@/domain/commands';
import { createUlid } from '@/domain/id';
import {
  type Changes,
  type ChannelRow,
  type CommandContext,
  DomainError,
  type IngredientRow,
  type MarginAlarm,
  type QuoteOptionRow,
  type RecipeRow,
  type Settings,
  type Snapshot,
  settingDefaults,
} from '@/domain/types';
import type { Db } from './db';
import * as t from './db/schema';

/** Batas baris per koleksi. Mencegah satu akun membengkakkan database. */
const ROW_CAP = 1000;

async function lock(db: Db, userId: string) {
  await db.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

async function ensureDefaultChannel(
  db: Db,
  userId: string,
  context: CommandContext,
) {
  const rows = await db
    .select({ data: t.channels.data })
    .from(t.channels)
    .where(eq(t.channels.userId, userId));
  if (
    (rows as { data: ChannelRow }[]).some(
      (row) => row.data.name === DEFAULT_CHANNEL,
    )
  )
    return;
  const row = defaultChannelRow(context);
  await db.insert(t.channels).values({ userId, id: row.id, data: row });
}

export async function loadSnapshot(db: Db, userId: string): Promise<Snapshot> {
  const [entitlement, ingredients, recipes, channels, quoteOptions, settings] =
    await Promise.all([
      db
        .select({ plan: t.entitlements.plan })
        .from(t.entitlements)
        .where(eq(t.entitlements.userId, userId)),
      db
        .select({ data: t.ingredients.data })
        .from(t.ingredients)
        .where(eq(t.ingredients.userId, userId)),
      db
        .select({ data: t.recipes.data })
        .from(t.recipes)
        .where(eq(t.recipes.userId, userId)),
      db
        .select({ data: t.channels.data })
        .from(t.channels)
        .where(eq(t.channels.userId, userId)),
      db
        .select({ data: t.quoteOptions.data })
        .from(t.quoteOptions)
        .where(eq(t.quoteOptions.userId, userId)),
      db.select().from(t.userSettings).where(eq(t.userSettings.userId, userId)),
    ]);
  const values: Record<string, unknown> = {};
  for (const row of settings) values[row.key] = row.value;
  return {
    plan: entitlement[0]?.plan === 'pro' ? 'pro' : 'free',
    ingredients: ingredients.map((row) => row.data as IngredientRow),
    recipes: recipes.map((row) => row.data as RecipeRow),
    channels: channels.map((row) => row.data as ChannelRow),
    quoteOptions: quoteOptions.map((row) => row.data as QuoteOptionRow),
    settings: {
      businessName:
        typeof values.businessName === 'string'
          ? values.businessName
          : settingDefaults.businessName,
      roundingStep:
        typeof values.roundingStep === 'number'
          ? values.roundingStep
          : settingDefaults.roundingStep,
      defaultMarginBp:
        typeof values.defaultMarginBp === 'number'
          ? values.defaultMarginBp
          : settingDefaults.defaultMarginBp,
      lastRecipeId:
        typeof values.lastRecipeId === 'string' ? values.lastRecipeId : null,
      marginAlarm:
        (values.marginAlarm as MarginAlarm | null | undefined) ?? null,
    },
  };
}

function assertRowCaps(snapshot: Snapshot, changes: Changes) {
  const collections = [
    ['ingredients', snapshot.ingredients, changes.ingredients],
    ['recipes', snapshot.recipes, changes.recipes],
    ['channels', snapshot.channels, changes.channels],
    ['quoteOptions', snapshot.quoteOptions, changes.quoteOptions],
  ] as const;
  for (const [, existing, delta] of collections) {
    const ids = new Set(existing.map((row) => row.id));
    for (const id of delta?.del ?? []) ids.delete(id);
    for (const row of delta?.put ?? []) ids.add(row.id);
    if (ids.size > ROW_CAP)
      throw new DomainError('INVALID', 'Batas jumlah data tercapai.');
  }
}

async function persist(db: Db, userId: string, changes: Changes) {
  const collections = [
    [t.ingredients, changes.ingredients],
    [t.recipes, changes.recipes],
    [t.channels, changes.channels],
    [t.quoteOptions, changes.quoteOptions],
  ] as const;
  for (const [table, delta] of collections) {
    const del = delta?.del ?? [];
    if (del.length > 0)
      await db
        .delete(table)
        .where(and(eq(table.userId, userId), inArray(table.id, del)));
    for (const row of delta?.put ?? [])
      await db
        .insert(table)
        .values({ userId, id: row.id, data: row })
        .onConflictDoUpdate({
          target: [table.userId, table.id],
          set: { data: row },
        });
  }
  for (const entry of changes.priceHistory ?? [])
    await db.insert(t.priceHistory).values({
      userId,
      ingredientId: entry.ingredientId,
      changedAt: new Date(entry.changedAt),
      oldPrice: entry.oldPrice,
      newPrice: entry.newPrice,
    });
  for (const [key, value] of Object.entries(changes.settings ?? {}) as [
    keyof Settings,
    unknown,
  ][])
    await db
      .insert(t.userSettings)
      .values({ userId, key, value })
      .onConflictDoUpdate({
        target: [t.userSettings.userId, t.userSettings.key],
        set: { value },
      });
}

function context(now = new Date()): CommandContext {
  return { now: now.toISOString(), newId: () => createUlid(now.getTime()) };
}

/** Membaca data akun. Membuat saluran "Langsung" bila akun baru. */
export async function getSnapshot(db: Db, userId: string): Promise<Snapshot> {
  return db.transaction(async (tx) => {
    await lock(tx, userId);
    await ensureDefaultChannel(tx, userId, context());
    return loadSnapshot(tx, userId);
  });
}

/**
 * Menjalankan satu perintah dalam satu transaksi dengan kunci per akun,
 * sehingga batas paket gratis dan pemeriksaan "dipakai di resep" konsisten
 * walau ada dua permintaan bersamaan. Mengembalikan data terbaru.
 */
export async function runCommand(
  db: Db,
  userId: string,
  raw: unknown,
  now = new Date(),
): Promise<Snapshot> {
  const parsed = commandSchema.safeParse(raw);
  if (!parsed.success)
    throw new DomainError('INVALID', 'Data yang dikirim tidak valid.');
  const command: Command = parsed.data;
  return db.transaction(async (tx) => {
    await lock(tx, userId);
    const ctx = context(now);
    await ensureDefaultChannel(tx, userId, ctx);
    const snapshot = await loadSnapshot(tx, userId);
    const changes = applyCommand(snapshot, command, ctx);
    assertRowCaps(snapshot, changes);
    await persist(tx, userId, changes);
    return loadSnapshot(tx, userId);
  });
}

/** Unduh seluruh data akun (hak pengguna atas datanya). */
export async function exportUserData(db: Db, userId: string) {
  const snapshot = await getSnapshot(db, userId);
  const history = await db
    .select()
    .from(t.priceHistory)
    .where(eq(t.priceHistory.userId, userId));
  return {
    exportedAt: new Date().toISOString(),
    ...snapshot,
    priceHistory: history.map(
      ({ ingredientId, changedAt, oldPrice, newPrice }) => ({
        ingredientId,
        changedAt: changedAt.toISOString(),
        oldPrice,
        newPrice,
      }),
    ),
  };
}
