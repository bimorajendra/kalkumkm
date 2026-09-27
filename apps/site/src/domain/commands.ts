import { z } from 'zod';
import { createChannel, deleteChannel, updateChannel } from './channels';
import {
  createIngredient,
  deleteIngredient,
  updateIngredient,
  updatePrice,
} from './ingredients';
import {
  createQuoteOption,
  deleteQuoteOption,
  updateQuoteOption,
} from './quotes';
import {
  createRecipe,
  deleteRecipe,
  duplicateRecipe,
  patchRecipe,
  updateRecipe,
} from './recipes';
import { seedExample } from './seed';
import {
  type Changes,
  type CommandContext,
  DomainError,
  type Snapshot,
} from './types';

/*
 * Semua perubahan data pengguna masuk lewat satu daftar perintah. Bentuknya
 * divalidasi di sini (batas kepercayaan); aturan bisnis ada di modul domain.
 */
const id = z.string().min(1).max(64);
const money = z.number().int().safe();

const ingredientInput = z.object({
  name: z.string().max(200),
  buyPrice: money,
  packSize: z.number().finite(),
  buyUnit: z.string().min(1).max(40),
  customUnits: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        qty: z.number().finite(),
        base: z.enum(['g', 'ml', 'pcs']),
      }),
    )
    .max(10),
});

const recipeInput = z.object({
  name: z.string().max(200),
  yieldPortions: money,
  items: z
    .array(
      z.object({
        refType: z.enum(['ingredient', 'recipe']),
        refId: id,
        quantity: z.number().finite(),
        unit: z.string().min(1).max(40),
      }),
    )
    .max(100),
  packagingPerPortion: money,
  energyPerBatch: money,
  laborMinutesPerBatch: money,
  laborRatePerHour: money.nullable(),
  targetMarginBp: money,
  currentPrice: money.nullable(),
  isSubRecipe: z.boolean(),
  subRecipeYield: z
    .object({ qty: z.number().finite(), unit: z.string().min(1).max(40) })
    .nullable(),
});

const channelInput = z.object({
  name: z.string().max(200),
  kind: z.enum(['commission', 'discount']),
  rateBp: money,
});

const quoteInput = z.object({
  name: z.string().max(200),
  priceAdd: money,
  costAdd: money,
});

export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ingredient.create'), input: ingredientInput }),
  z.object({
    type: z.literal('ingredient.update'),
    id,
    input: ingredientInput,
  }),
  z.object({ type: z.literal('ingredient.price'), id, buyPrice: money }),
  z.object({ type: z.literal('ingredient.delete'), id }),
  z.object({ type: z.literal('recipe.create'), input: recipeInput }),
  z.object({ type: z.literal('recipe.update'), id, input: recipeInput }),
  z.object({
    type: z.literal('recipe.patch'),
    id,
    patch: z
      .object({
        targetMarginBp: money,
        laborMinutesPerBatch: money,
        currentPrice: money.nullable(),
      })
      .partial(),
  }),
  z.object({ type: z.literal('recipe.duplicate'), id }),
  z.object({ type: z.literal('recipe.delete'), id }),
  z.object({ type: z.literal('recipe.seedExample') }),
  z.object({ type: z.literal('channel.create'), input: channelInput }),
  z.object({ type: z.literal('channel.update'), id, input: channelInput }),
  z.object({ type: z.literal('channel.delete'), id }),
  z.object({
    type: z.literal('quote.create'),
    recipeId: id,
    input: quoteInput,
  }),
  z.object({ type: z.literal('quote.update'), id, input: quoteInput }),
  z.object({ type: z.literal('quote.delete'), id }),
  z.object({
    type: z.literal('settings.update'),
    values: z
      .object({
        businessName: z.string().trim().max(60),
        defaultMarginBp: z.number().int().min(0).max(9500),
        lastRecipeId: id.nullable(),
      })
      .partial(),
  }),
  z.object({ type: z.literal('alarm.dismiss') }),
  z.object({ type: z.literal('alarm.applyPrice'), recipeId: id, price: money }),
]);

export type Command = z.infer<typeof commandSchema>;

export function applyCommand(
  snapshot: Snapshot,
  command: Command,
  context: CommandContext,
): Changes {
  switch (command.type) {
    case 'ingredient.create':
      return createIngredient(snapshot, command.input, context);
    case 'ingredient.update':
      return updateIngredient(snapshot, command.id, command.input, context);
    case 'ingredient.price':
      return updatePrice(snapshot, command.id, command.buyPrice, context);
    case 'ingredient.delete':
      return deleteIngredient(snapshot, command.id);
    case 'recipe.create':
      return createRecipe(snapshot, command.input, context);
    case 'recipe.update':
      return updateRecipe(snapshot, command.id, command.input, context);
    case 'recipe.patch':
      return patchRecipe(snapshot, command.id, command.patch, context);
    case 'recipe.duplicate':
      return duplicateRecipe(snapshot, command.id, context);
    case 'recipe.delete':
      return deleteRecipe(snapshot, command.id);
    case 'recipe.seedExample': {
      const { recipeId, ...changes } = seedExample(snapshot, context);
      return {
        ...changes,
        settings: { ...changes.settings, lastRecipeId: recipeId },
      };
    }
    case 'channel.create':
      return createChannel(snapshot, command.input, context);
    case 'channel.update':
      return updateChannel(snapshot, command.id, command.input, context);
    case 'channel.delete':
      return deleteChannel(snapshot, command.id);
    case 'quote.create':
      return createQuoteOption(
        snapshot,
        command.recipeId,
        command.input,
        context,
      );
    case 'quote.update':
      return updateQuoteOption(snapshot, command.id, command.input, context);
    case 'quote.delete':
      return deleteQuoteOption(snapshot, command.id);
    case 'settings.update': {
      const { lastRecipeId } = command.values;
      if (
        lastRecipeId &&
        !snapshot.recipes.some((recipe) => recipe.id === lastRecipeId)
      )
        throw new DomainError('NOT_FOUND', 'Resep tidak ditemukan.');
      return { settings: command.values };
    }
    case 'alarm.applyPrice': {
      const changes = patchRecipe(
        snapshot,
        command.recipeId,
        { currentPrice: command.price },
        context,
      );
      const alarm = snapshot.settings.marginAlarm;
      if (!alarm) return changes;
      const recipeIds = alarm.recipeIds.filter(
        (item) => item !== command.recipeId,
      );
      return {
        ...changes,
        settings: {
          marginAlarm: recipeIds.length === 0 ? null : { ...alarm, recipeIds },
        },
      };
    }
    case 'alarm.dismiss':
      return snapshot.settings.marginAlarm
        ? {
            settings: {
              marginAlarm: {
                ...snapshot.settings.marginAlarm,
                dismissed: true,
              },
            },
          }
        : {};
  }
}
