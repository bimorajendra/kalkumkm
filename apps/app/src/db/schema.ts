import type {
  Channel,
  Ingredient,
  QuoteOption,
  Recipe,
} from '../../../../packages/calc/src/types';

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export type IngredientRow = Ingredient & Timestamps;
export type RecipeRow = Recipe & Timestamps;
export type ChannelRow = Channel & Timestamps;

export interface QuoteOptionRow extends QuoteOption, Timestamps {
  id: string;
  recipeId: string;
  name: string;
}

export interface PriceHistoryRow {
  id?: number;
  ingredientId: string;
  changedAt: string;
  oldPrice: number | null;
  newPrice: number;
}

export interface MarginAlarm {
  recipeIds: string[];
  triggeredBy: string;
  createdAt: string;
  dismissed: boolean;
}

export type SettingKey =
  | 'businessName'
  | 'roundingStep'
  | 'defaultMarginBp'
  | 'license'
  | 'lastBackupAt'
  | 'firstOpenedAt'
  | 'lastRecipeId'
  | 'marginAlarm'
  | 'firstIngredientAddedAt'
  | 'hppFirstShownAt';

export interface SettingValues {
  businessName: string;
  roundingStep: number;
  defaultMarginBp: number;
  license: string | null;
  lastBackupAt: string | null;
  firstOpenedAt: string | null;
  lastRecipeId: string | null;
  marginAlarm: MarginAlarm | null;
  firstIngredientAddedAt: string | null;
  hppFirstShownAt: string | null;
}

export interface SettingRow {
  key: SettingKey;
  value: SettingValues[SettingKey];
}

export const settingDefaults: SettingValues = {
  businessName: '',
  roundingStep: 500,
  defaultMarginBp: 4000,
  license: null,
  lastBackupAt: null,
  firstOpenedAt: null,
  lastRecipeId: null,
  marginAlarm: null,
  firstIngredientAddedAt: null,
  hppFirstShownAt: null,
};
