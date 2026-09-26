import Dexie, { type Table } from 'dexie';
import type {
  ChannelRow,
  IngredientRow,
  PriceHistoryRow,
  QuoteOptionRow,
  RecipeRow,
  SettingRow,
} from './schema';

export class TakaranDatabase extends Dexie {
  ingredients!: Table<IngredientRow, string>;
  recipes!: Table<RecipeRow, string>;
  channels!: Table<ChannelRow, string>;
  quoteOptions!: Table<QuoteOptionRow, string>;
  priceHistory!: Table<PriceHistoryRow, number>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'takaran') {
    super(name);
    this.version(1).stores({
      ingredients: 'id, name, updatedAt',
      recipes: 'id, name, isSubRecipe, updatedAt',
      channels: 'id, name',
      quoteOptions: 'id, recipeId',
      priceHistory: '++id, ingredientId, changedAt',
      settings: 'key',
    });
    this.version(2)
      .stores({
        ingredients: 'id, name, updatedAt',
        recipes: 'id, name, isSubRecipe, updatedAt',
        channels: 'id, name',
        quoteOptions: 'id, recipeId',
        priceHistory: '++id, ingredientId, changedAt',
        settings: 'key',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('priceHistory')
          .toCollection()
          .modify((row) => {
            row.oldPrice = row.previousBuyPrice;
            row.newPrice = row.buyPrice;
            delete row.previousBuyPrice;
            delete row.buyPrice;
          });
      });
    this.on('versionchange', () => {
      this.close();
      if (typeof window !== 'undefined')
        window.dispatchEvent(new Event('takaran:database-versionchange'));
    });
  }
}

export const db = new TakaranDatabase();
