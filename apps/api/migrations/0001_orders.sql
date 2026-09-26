PRAGMA foreign_keys = ON;

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  customer_name TEXT,
  email TEXT,
  whatsapp TEXT NOT NULL,
  product_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('waitlist','preorder','checkout','paid','licensed','refunded','cancelled')),
  price_idr INTEGER,
  pay_method TEXT,
  mayar_invoice_id TEXT UNIQUE,
  claim_token_hash TEXT,
  paid_at TEXT,
  licensed_at TEXT,
  terminal_at TEXT,
  source TEXT,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE rate_limits (
  key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE licenses (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  plan TEXT NOT NULL DEFAULT 'pro',
  issued_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  invoice_id TEXT,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  result TEXT
);