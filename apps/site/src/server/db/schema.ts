import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* Tabel autentikasi (Better Auth). Nama kolom mengikuti skema bawaannya. */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/*
 * Data usaha per akun. Setiap baris menyimpan satu entitas domain sebagai JSON
 * (bentuknya divalidasi di apps/site/src/domain). Kunci utamanya selalu
 * (user_id, id), jadi satu pengguna tidak bisa menyentuh baris pengguna lain.
 */
function collection(name: string) {
  return pgTable(
    name,
    {
      userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
      id: text('id').notNull(),
      data: jsonb('data').notNull(),
    },
    (table) => [primaryKey({ columns: [table.userId, table.id] })],
  );
}

export const ingredients = collection('ingredients');
export const recipes = collection('recipes');
export const channels = collection('channels');
export const quoteOptions = collection('quote_options');

export const priceHistory = pgTable(
  'price_history',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ingredientId: text('ingredient_id').notNull(),
    changedAt: timestamp('changed_at').notNull(),
    oldPrice: integer('old_price'),
    newPrice: integer('new_price').notNull(),
  },
  (table) => [index('price_history_user_idx').on(table.userId)],
);

/* Satu baris tiap marginBp resep benar-benar berubah (bukan tiap perintah). */
export const marginSnapshots = pgTable(
  'margin_snapshots',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    recipeId: text('recipe_id').notNull(),
    marginBp: integer('margin_bp').notNull(),
    recordedAt: timestamp('recorded_at').notNull(),
  },
  (table) => [index('margin_snapshots_user_idx').on(table.userId)],
);

export const userSettings = pgTable(
  'user_settings',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: jsonb('value'),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);

/* Pro adalah satu baris di sini. Hanya webhook Mayar atau admin yang menulisnya. */
export const entitlements = pgTable('entitlements', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['pro'] }).notNull(),
  source: text('source', { enum: ['mayar', 'admin'] }).notNull(),
  orderId: text('order_id'),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
});

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['pending', 'paid', 'cancelled', 'refunded'],
    }).notNull(),
    priceIdr: integer('price_idr').notNull(),
    whatsapp: text('whatsapp').notNull(),
    businessName: text('business_name').notNull(),
    mayarInvoiceId: text('mayar_invoice_id'),
    paymentUrl: text('payment_url'),
    consentAt: timestamp('consent_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    paidAt: timestamp('paid_at'),
  },
  (table) => [
    uniqueIndex('orders_mayar_invoice_idx').on(table.mayarInvoiceId),
    index('orders_user_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
  ],
);

export const mayarEvents = pgTable('mayar_events', {
  eventKey: text('event_key').primaryKey(),
  invoiceId: text('invoice_id'),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
  result: text('result'),
});

export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  whatsapp: text('whatsapp').notNull(),
  productType: text('product_type').notNull(),
  source: text('source'),
  consentAt: timestamp('consent_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').notNull(),
    windowStart: timestamp('window_start').notNull(),
    count: integer('count').notNull(),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);
