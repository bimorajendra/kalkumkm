ALTER TABLE licenses ADD COLUMN license_code TEXT;
ALTER TABLE orders ADD COLUMN mayar_checked_at TEXT;
CREATE UNIQUE INDEX idx_licenses_order_id ON licenses(order_id);
