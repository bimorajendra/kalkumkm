import type { Channel, Ingredient, QuoteOption, Recipe } from '@takaran/calc';

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
  ingredientId: string;
  changedAt: string;
  oldPrice: number | null;
  newPrice: number;
}

/** Satu titik margin resep dari waktu ke waktu. Ditulis hanya saat marginBp berubah. */
export interface MarginSnapshotRow {
  recipeId: string;
  marginBp: number;
  recordedAt: string;
}

export interface MarginAlarm {
  recipeIds: string[];
  triggeredBy: string;
  createdAt: string;
  dismissed: boolean;
}

export interface Settings {
  businessName: string;
  roundingStep: number;
  defaultMarginBp: number;
  lastRecipeId: string | null;
  marginAlarm: MarginAlarm | null;
}

export const settingDefaults: Settings = {
  businessName: '',
  roundingStep: 500,
  defaultMarginBp: 4000,
  lastRecipeId: null,
  marginAlarm: null,
};

export type Plan = 'free' | 'pro';

/** Seluruh data usaha satu akun. Ukurannya kecil, jadi selalu dikirim utuh. */
export interface Snapshot {
  plan: Plan;
  ingredients: IngredientRow[];
  recipes: RecipeRow[];
  channels: ChannelRow[];
  quoteOptions: QuoteOptionRow[];
  settings: Settings;
  /** Riwayat margin, dibatasi ke beberapa ratus titik terakhir per akun. */
  marginHistory: MarginSnapshotRow[];
  /** Riwayat harga yang dibatasi saat dimuat untuk ringkasan perubahan bahan. */
  priceHistory?: PriceHistoryRow[];
}

export interface Delta<T> {
  put?: T[];
  del?: string[];
}

/** Perubahan yang dihasilkan satu perintah. Disimpan dalam satu transaksi. */
export interface Changes {
  ingredients?: Delta<IngredientRow>;
  recipes?: Delta<RecipeRow>;
  channels?: Delta<ChannelRow>;
  quoteOptions?: Delta<QuoteOptionRow>;
  priceHistory?: PriceHistoryRow[];
  settings?: Partial<Settings>;
}

export type DomainErrorCode =
  | 'INVALID'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'IN_USE'
  | 'MISSING_REF'
  | 'DIMENSION_IN_USE'
  | 'DEFAULT'
  | 'FREE_LIMIT'
  | 'PRO_REQUIRED';

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly trigger?: 'recipe' | 'channel' | 'sub_recipe' | 'quote',
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export interface CommandContext {
  now: string;
  newId: () => string;
}
