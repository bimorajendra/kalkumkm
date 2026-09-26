import { z } from 'zod';
import { licenseRecordSchema } from './license';

const timestamp = z.string().datetime({ offset: true });
const customUnit = z.object({
  name: z.string().min(1).max(24),
  qty: z.number().finite().positive(),
  base: z.enum(['g', 'ml', 'pcs']),
});
const ingredient = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  buyPrice: z.number().int().safe().min(1).max(100_000_000),
  packSize: z.number().finite().positive(),
  buyUnit: z.string().min(1),
  customUnits: z.array(customUnit),
  createdAt: timestamp,
  updatedAt: timestamp,
});
const recipeItem = z.object({
  refType: z.enum(['ingredient', 'recipe']),
  refId: z.string().min(1),
  quantity: z.number().finite().positive(),
  unit: z.string().min(1),
});
const recipe = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  yieldPortions: z.number().int().min(1).max(10_000),
  items: z.array(recipeItem),
  packagingPerPortion: z.number().int().safe().min(0),
  energyPerBatch: z.number().int().safe().min(0),
  laborMinutesPerBatch: z.number().int().safe().min(0),
  laborRatePerHour: z.number().int().safe().min(0).nullable(),
  targetMarginBp: z.number().int().min(0).max(10_000),
  currentPrice: z.number().int().safe().min(0).nullable(),
  isSubRecipe: z.boolean(),
  subRecipeYield: z
    .object({ qty: z.number().finite().positive(), unit: z.string().min(1) })
    .nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
});
const channel = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60),
  kind: z.enum(['commission', 'discount']),
  rateBp: z.number().int().min(0).max(10_000),
  createdAt: timestamp,
  updatedAt: timestamp,
});
const quoteOption = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
  name: z.string().min(1).max(60),
  priceAdd: z.number().int().safe(),
  costAdd: z.number().int().safe().min(0),
  createdAt: timestamp,
  updatedAt: timestamp,
});
const priceHistory = z.object({
  id: z.number().int().safe().optional(),
  ingredientId: z.string().min(1),
  changedAt: timestamp,
  oldPrice: z.number().int().safe().min(0).nullable(),
  newPrice: z.number().int().safe().min(0),
});
const marginAlarm = z.object({
  recipeIds: z.array(z.string()),
  triggeredBy: z.string(),
  createdAt: timestamp,
  dismissed: z.boolean(),
});
function settingsSchema<T extends z.ZodType>(licenseValue: T) {
  return z.discriminatedUnion('key', [
    z.object({ key: z.literal('businessName'), value: z.string() }),
    z.object({
      key: z.literal('roundingStep'),
      value: z.number().int().positive(),
    }),
    z.object({
      key: z.literal('defaultMarginBp'),
      value: z.number().int().min(0).max(10_000),
    }),
    z.object({ key: z.literal('lastBackupAt'), value: z.string().nullable() }),
    z.object({
      key: z.literal('backupReminderDismissedUntil'),
      value: z.string().nullable(),
    }),
    z.object({ key: z.literal('firstOpenedAt'), value: z.string().nullable() }),
    z.object({ key: z.literal('lastRecipeId'), value: z.string().nullable() }),
    z.object({
      key: z.literal('firstIngredientAddedAt'),
      value: z.string().nullable(),
    }),
    z.object({
      key: z.literal('hppFirstShownAt'),
      value: z.string().nullable(),
    }),
    z.object({ key: z.literal('license'), value: licenseValue }),
    z.object({ key: z.literal('marginAlarm'), value: marginAlarm.nullable() }),
  ]);
}

const settingsV1 = settingsSchema(z.string().max(1024).nullable());
const settingsV2 = settingsSchema(licenseRecordSchema.nullable());

const backupDataShape = {
  ingredients: z.array(ingredient),
  recipes: z.array(recipe),
  channels: z.array(channel),
  quoteOptions: z.array(quoteOption),
  priceHistory: z.array(priceHistory),
};

export const backupDataV1Schema = z
  .object({ ...backupDataShape, settings: z.array(settingsV1) })
  .strict();

export const backupDataSchema = z
  .object({ ...backupDataShape, settings: z.array(settingsV2) })
  .strict();

const backupEnvelope = {
  app: z.literal('takaran'),
  exportedAt: timestamp,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
};

export const backupSchemaV1 = z
  .object({
    ...backupEnvelope,
    schemaVersion: z.literal(1),
    data: backupDataV1Schema,
  })
  .strict();

export const backupSchema = z
  .object({
    ...backupEnvelope,
    schemaVersion: z.literal(2),
    data: backupDataSchema,
  })
  .strict();

export type BackupData = z.infer<typeof backupDataSchema>;
export type BackupDataV1 = z.infer<typeof backupDataV1Schema>;
export type BackupFile = z.infer<typeof backupSchema>;
