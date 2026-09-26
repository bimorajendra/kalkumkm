import type Big from 'big.js';

export type BaseUnit = 'g' | 'ml' | 'pcs';
export type Unit = string;
export interface CustomUnit {
  name: string;
  qty: number;
  base: BaseUnit;
}
export interface Ingredient {
  id: string;
  name: string;
  buyPrice: number;
  packSize: number;
  buyUnit: Unit;
  customUnits: CustomUnit[];
}
export interface RecipeItem {
  refType: 'ingredient' | 'recipe';
  refId: string;
  quantity: number;
  unit: Unit;
}
export interface Recipe {
  id: string;
  name: string;
  yieldPortions: number;
  items: RecipeItem[];
  packagingPerPortion: number;
  energyPerBatch: number;
  laborMinutesPerBatch: number;
  laborRatePerHour: number | null;
  targetMarginBp: number;
  currentPrice: number | null;
  isSubRecipe: boolean;
  subRecipeYield: { qty: number; unit: Unit } | null;
}
export interface Channel {
  id: string;
  name: string;
  kind: 'commission' | 'discount';
  rateBp: number;
}
export interface CalcContext {
  ingredients: Map<string, Ingredient>;
  recipes: Map<string, Recipe>;
  roundingStep: number;
}
export interface CostBreakdown {
  ingredients: Big;
  subRecipes: Big;
  energy: Big;
  labor: Big;
  packaging: Big;
  hpp: Big;
}
export interface RecipeResult {
  batchCost: Big;
  breakdown: CostBreakdown;
  hpp: Big;
}
export interface QuoteOption {
  priceAdd: number;
  costAdd: number;
}
export interface ChannelPrice {
  price: number;
  marginBp: number;
}
